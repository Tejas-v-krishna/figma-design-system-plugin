// Confirms the DTCG typing cleanup did not change a single byte of output.
// Rebuilds the pre-refactor shape with the old untyped algorithm and diffs it
// against the exporter's current output.
import { DEFAULT_CONFIG, DesignTokens } from '../src/shared/types';
import { exportTokens } from '../src/plugin/commands/export';
import { buildTokens } from '../src/shared/build-tokens';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
function legacyToDtcg(tokens: DesignTokens): string {
  const dtcg: any = { color: {}, dimension: {}, borderRadius: {}, strokeWidth: {}, shadow: {} };
  for (const [name, ct] of Object.entries(tokens.colors)) {
    dtcg.color[name] = {};
    for (const [shade, hex] of Object.entries(ct.shades)) {
      dtcg.color[name][shade] = { $type: 'color', $value: hex };
    }
    if (ct.darkShades) {
      dtcg.color[name].dark = {};
      for (const [shade, hex] of Object.entries(ct.darkShades)) {
        dtcg.color[name].dark[shade] = { $type: 'color', $value: hex };
      }
    }
  }
  for (const s of tokens.spacing) {
    dtcg.dimension[`spacing-${s.name}`] = { $type: 'dimension', $value: `${s.value}px` };
  }
  for (const r of tokens.borderRadius) {
    dtcg.borderRadius[r.name] = { $type: 'borderRadius', $value: r.value };
  }
  for (const s of tokens.strokes) {
    dtcg.strokeWidth[s.name] = { $type: 'dimension', $value: `${s.value}px` };
  }
  for (const s of tokens.shadows) {
    dtcg.shadow[s.name] = { $type: 'shadow', $value: s.value };
  }
  return JSON.stringify(dtcg, null, 2);
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

const CASES: { label: string; config: typeof DEFAULT_CONFIG }[] = [
  { label: 'defaults (dark mode on)', config: DEFAULT_CONFIG },
  {
    label: 'dark mode off',
    config: { ...DEFAULT_CONFIG, options: { ...DEFAULT_CONFIG.options, includeDarkMode: false } },
  },
  {
    label: 'sharp radius, no effects',
    config: { ...DEFAULT_CONFIG, radiusPreset: 'sharp', effectsIntensity: 'none' },
  },
];

let failures = 0;
for (const { label, config } of CASES) {
  const expected = legacyToDtcg(buildTokens(config));
  const actual = exportTokens('dtcg', config);
  if (expected === actual) {
    console.log(`  PASS  ${label} (${actual.length} bytes)`);
  } else {
    failures++;
    console.error(`  FAIL  ${label}`);
    const a = expected.split('\n');
    const b = actual.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        console.error(`        line ${i + 1}\n          was: ${a[i] ?? '<end>'}\n          now: ${b[i] ?? '<end>'}`);
        break;
      }
    }
  }
}

console.log(failures === 0 ? '\nDTCG output unchanged.' : `\n${failures} case(s) changed.`);
process.exit(failures === 0 ? 0 : 1);
