/**
 * Snapshot guard over the whole token pipeline.
 *
 * check-dtcg-parity.ts re-derives the "expected" output from the *current*
 * buildTokens, so it proves the serialiser refactor kept its shape but cannot
 * see a change in token names or values — both sides move together and the diff
 * cancels. Renaming the entire radius scale passed it without a murmur.
 *
 * This one diffs against baselines committed to disk, so any change to a token
 * name, value or count shows up as a failing case with the exact line. Run with
 * --update to accept a deliberate change; the diff in that commit is then the
 * record of what moved.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG, GenerationConfig } from '../src/shared/types';
import { exportTokens, ExportFormat } from '../src/plugin/commands/export';

const SNAP_DIR = join(dirname(fileURLToPath(import.meta.url)), '__snapshots__');
const FORMATS: ExportFormat[] = ['json', 'css', 'tailwind', 'dtcg'];

/**
 * Cases are chosen so each one is the only difference from defaults. A case
 * that changes two knobs at once cannot tell you which one moved the output.
 */
const CASES: { label: string; config: GenerationConfig }[] = [
  { label: 'defaults', config: DEFAULT_CONFIG },
  {
    label: 'dark-mode-off',
    config: { ...DEFAULT_CONFIG, options: { ...DEFAULT_CONFIG.options, includeDarkMode: false } },
  },
  { label: 'radius-sharp', config: { ...DEFAULT_CONFIG, radiusPreset: 'sharp' } },
  { label: 'radius-pill', config: { ...DEFAULT_CONFIG, radiusPreset: 'pill' } },
  { label: 'effects-none', config: { ...DEFAULT_CONFIG, effectsIntensity: 'none' } },
  { label: 'effects-subtle', config: { ...DEFAULT_CONFIG, effectsIntensity: 'subtle' } },
  { label: 'effects-strong', config: { ...DEFAULT_CONFIG, effectsIntensity: 'strong' } },
  { label: 'brand-crimson', config: { ...DEFAULT_CONFIG, primaryColor: '#B3261E' } },
  { label: 'spacing-base-8', config: { ...DEFAULT_CONFIG, baseSpacing: 8 } },
  { label: 'type-scale-system', config: { ...DEFAULT_CONFIG, typographyScale: 'system' } },
  {
    label: 'type-scale-custom-20',
    config: { ...DEFAULT_CONFIG, typographyScale: 'custom', baseFontSize: 20 },
  },
];

const update = process.argv.includes('--update');
if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });

const ext: Record<ExportFormat, string> = { json: 'json', css: 'css', tailwind: 'js', dtcg: 'json' };
const seen = new Set<string>();
let failures = 0;
let written = 0;

for (const { label, config } of CASES) {
  for (const format of FORMATS) {
    const file = `${label}.${format}.${ext[format]}`;
    seen.add(file);
    const path = join(SNAP_DIR, file);

    let actual: string;
    try {
      // getLastTokens() is empty outside the sandbox, so this always takes the
      // rebuild-from-config path — which is what we want to pin down.
      actual = exportTokens(format, config);
    } catch (err) {
      failures++;
      console.error(`  THREW  ${file}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    if (!existsSync(path)) {
      writeFileSync(path, actual);
      written++;
      console.log(`  NEW    ${file} (${actual.length} bytes)`);
      continue;
    }

    // Snapshots are read back with the same normalisation git applies on
    // checkout, or every case fails on a machine that checked out CRLF.
    const expected = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    if (expected === actual.replace(/\r\n/g, '\n')) {
      console.log(`  PASS   ${file}`);
      continue;
    }

    if (update) {
      writeFileSync(path, actual);
      written++;
      console.log(`  UPDATE ${file}`);
      continue;
    }

    failures++;
    const a = expected.split('\n');
    const b = actual.replace(/\r\n/g, '\n').split('\n');
    console.error(`  FAIL   ${file}`);
    let shown = 0;
    for (let i = 0; i < Math.max(a.length, b.length) && shown < 3; i++) {
      if (a[i] !== b[i]) {
        console.error(`         line ${i + 1}\n           was: ${a[i] ?? '<end of file>'}\n           now: ${b[i] ?? '<end of file>'}`);
        shown++;
      }
    }
  }
}

// A snapshot left behind by a case that no longer exists is worse than no
// snapshot: it reads as coverage. Fail on it unless --update prunes it.
const stale = readdirSync(SNAP_DIR).filter((f) => !seen.has(f));
for (const f of stale) {
  if (update) {
    writeFileSync(join(SNAP_DIR, f), '');
    console.log(`  STALE  ${f} (emptied — delete it in this commit)`);
  } else {
    failures++;
    console.error(`  STALE  ${f} has no matching case`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} snapshot(s) differ. If the change is intended, rerun with --update and commit the diff.`);
  process.exit(1);
}
console.log(`\n${seen.size} snapshot(s) match${written ? `, ${written} written` : ''}.`);
