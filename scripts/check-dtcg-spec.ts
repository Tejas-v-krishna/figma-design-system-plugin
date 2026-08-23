// Validates the DTCG export against the 2025.10 draft of the W3C Design Tokens
// format (https://www.designtokens.org/TR/drafts/format/).
//
// Replaces check-dtcg-parity, which asserted the output had not changed byte for
// byte since a typing cleanup. That was the right guard while the shape was
// frozen and the wrong one the moment the shape was deliberately corrected — a
// test that only ever says "still the same" cannot tell you whether the thing it
// is guarding was right to begin with. This one checks the output against the
// spec, so it keeps working across intentional changes and catches the failure
// the old one never could: a token that does not conform.
//
// The reference check is the part that earns its keep. A three-tier document is
// mostly aliases, and a mistyped one — {semantic.light.primry} — is invisible in
// a diff, valid JSON, and completely broken for a consumer.
import { DEFAULT_CONFIG, GenerationConfig } from '../src/shared/types';
import { buildTokens } from '../src/shared/build-tokens';
import { buildDtcgDocument } from '../src/shared/dtcg';

const RESERVED = new Set(['$schema', '$type', '$description', '$value', '$extensions', '$deprecated']);

const VALID_TYPES = new Set(['color', 'dimension', 'shadow', 'typography', 'fontFamily']);

type Json = Record<string, unknown>;

const errors: string[] = [];
let leafCount = 0;
let aliasCount = 0;

function fail(path: string, message: string): void {
  errors.push(`${path}: ${message}`);
}

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const ALIAS = /^\{([^{}]+)\}$/;

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function checkDimension(path: string, v: unknown): void {
  if (!isObject(v)) return fail(path, 'dimension $value must be an object { value, unit }');
  if (!isNum(v.value)) fail(path, 'dimension .value must be a finite number');
  // The spec is explicit that the unit is required even when the value is 0,
  // which is exactly the case a "16px"-style string exporter gets wrong.
  if (v.unit !== 'px' && v.unit !== 'rem') fail(path, `dimension .unit must be "px" or "rem", got ${JSON.stringify(v.unit)}`);
}

function checkColor(path: string, v: unknown): void {
  if (!isObject(v)) return fail(path, 'color $value must be an object { colorSpace, components }');
  if (v.colorSpace !== 'srgb') fail(path, `unexpected colorSpace ${JSON.stringify(v.colorSpace)}`);
  const c = v.components;
  if (!Array.isArray(c) || c.length !== 3) {
    fail(path, 'color .components must be an array of 3 numbers');
  } else {
    c.forEach((n, i) => {
      if (!isNum(n) || n < 0 || n > 1) fail(path, `color .components[${i}] must be 0..1, got ${JSON.stringify(n)}`);
    });
  }
  if (v.alpha !== undefined && (!isNum(v.alpha) || v.alpha < 0 || v.alpha > 1)) {
    fail(path, `color .alpha must be 0..1, got ${JSON.stringify(v.alpha)}`);
  }
  if (v.hex !== undefined && !/^#[0-9a-f]{6}$/.test(String(v.hex))) {
    fail(path, `color .hex must be lower-case #rrggbb, got ${JSON.stringify(v.hex)}`);
  }
}

function checkShadow(path: string, v: unknown): void {
  if (!isObject(v)) return fail(path, 'shadow $value must be a composite object, not a CSS string');
  checkColor(`${path}.color`, v.color);
  for (const k of ['offsetX', 'offsetY', 'blur', 'spread'] as const) {
    if (v[k] === undefined) fail(path, `shadow is missing .${k}`);
    else checkDimension(`${path}.${k}`, v[k]);
  }
  if (v.inset !== undefined && typeof v.inset !== 'boolean') fail(path, 'shadow .inset must be a boolean');
}

function checkTypography(path: string, v: unknown): void {
  if (!isObject(v)) return fail(path, 'typography $value must be a composite object');
  const fam = v.fontFamily;
  const famOk = typeof fam === 'string' || (Array.isArray(fam) && fam.length > 0 && fam.every((f) => typeof f === 'string'));
  if (!famOk) fail(path, 'typography .fontFamily must be a string or a non-empty array of strings');
  checkDimension(`${path}.fontSize`, v.fontSize);
  if (!isNum(v.fontWeight) || v.fontWeight < 1 || v.fontWeight > 1000) {
    fail(path, `typography .fontWeight must be 1..1000, got ${JSON.stringify(v.fontWeight)}`);
  }
  if (v.letterSpacing !== undefined) checkDimension(`${path}.letterSpacing`, v.letterSpacing);
  // Unitless multiple, per the spec — not a pixel height.
  if (!isNum(v.lineHeight)) fail(path, 'typography .lineHeight must be a unitless number');
}

function checkFontFamily(path: string, v: unknown): void {
  const ok = typeof v === 'string' || (Array.isArray(v) && v.length > 0 && v.every((f) => typeof f === 'string'));
  if (!ok) fail(path, 'fontFamily $value must be a string or a non-empty array of strings');
}

/** Collected on the first pass so aliases can be resolved on the second. */
const tokenPaths = new Set<string>();
const aliasUses: { from: string; target: string }[] = [];

function walk(node: Json, path: string, inheritedType: string | undefined, collectOnly: boolean): void {
  const declared = node.$type;
  if (declared !== undefined) {
    if (typeof declared !== 'string' || !VALID_TYPES.has(declared)) {
      if (!collectOnly) fail(path || '(root)', `unknown $type ${JSON.stringify(declared)}`);
    }
  }
  const type = typeof declared === 'string' ? declared : inheritedType;

  if ('$value' in node) {
    // A leaf. The spec forbids a name being both a token and a group, so a node
    // carrying $value must not carry children.
    const children = Object.keys(node).filter((k) => !RESERVED.has(k));
    if (children.length && !collectOnly) {
      fail(path, `a token cannot also be a group (unexpected children: ${children.join(', ')})`);
    }
    if (collectOnly) {
      tokenPaths.add(path);
      return;
    }
    leafCount++;
    if (!type) return fail(path, 'no $type, and no ancestor group declares one');

    const value = node.$value;
    const alias = typeof value === 'string' ? ALIAS.exec(value) : null;
    if (alias) {
      aliasCount++;
      aliasUses.push({ from: path, target: alias[1]! });
      return;
    }
    if (typeof value === 'string') return fail(path, `$value is a bare string (${JSON.stringify(value)}); only {alias} references may be strings`);

    switch (type) {
      case 'color': return checkColor(path, value);
      case 'dimension': return checkDimension(path, value);
      case 'shadow': return checkShadow(path, value);
      case 'typography': return checkTypography(path, value);
      case 'fontFamily': return checkFontFamily(path, value);
    }
    return;
  }

  for (const [k, v] of Object.entries(node)) {
    if (RESERVED.has(k)) continue;
    const childPath = path ? `${path}.${k}` : k;
    if (!collectOnly) {
      // A dot in a key would make every reference containing it ambiguous.
      if (k.includes('.')) fail(childPath, 'key contains a ".", which is the reference delimiter');
      if (k.startsWith('$')) fail(childPath, 'key starts with "$", which is reserved');
      if (k.includes('{') || k.includes('}')) fail(childPath, 'key contains "{" or "}"');
    }
    if (!isObject(v)) {
      if (!collectOnly) fail(childPath, `expected a group or token object, got ${Array.isArray(v) ? 'array' : typeof v}`);
      continue;
    }
    walk(v, childPath, type, collectOnly);
  }
}

const CASES: { label: string; config: GenerationConfig }[] = [
  { label: 'defaults (dark mode on)', config: DEFAULT_CONFIG },
  {
    label: 'dark mode off',
    config: { ...DEFAULT_CONFIG, options: { ...DEFAULT_CONFIG.options, includeDarkMode: false } },
  },
  {
    label: 'sharp radius, no effects',
    config: { ...DEFAULT_CONFIG, radiusPreset: 'sharp', effectsIntensity: 'none' },
  },
  {
    label: 'custom type scale at 20px',
    config: { ...DEFAULT_CONFIG, typographyScale: 'custom', baseFontSize: 20 },
  },
];

let failedCases = 0;
for (const { label, config } of CASES) {
  errors.length = 0;
  tokenPaths.clear();
  aliasUses.length = 0;
  leafCount = 0;
  aliasCount = 0;

  const doc = buildDtcgDocument(buildTokens(config), config) as unknown as Json;

  if (doc.$schema !== 'https://www.designtokens.org/schemas/2025.10/format.json') {
    fail('(root)', `missing or unexpected $schema: ${JSON.stringify(doc.$schema)}`);
  }

  walk(doc, '', undefined, true);
  walk(doc, '', undefined, false);

  for (const { from, target } of aliasUses) {
    if (!tokenPaths.has(target)) fail(from, `references {${target}}, which is not a token in this document`);
  }

  if (errors.length === 0) {
    console.log(`  PASS  ${label} — ${leafCount} tokens, ${aliasCount} resolved references`);
  } else {
    failedCases++;
    console.error(`  FAIL  ${label} — ${errors.length} problem(s)`);
    for (const e of errors.slice(0, 15)) console.error(`          ${e}`);
    if (errors.length > 15) console.error(`          ... and ${errors.length - 15} more`);
  }
}

console.log(
  failedCases === 0
    ? '\nDTCG output conforms to the 2025.10 draft.'
    : `\n${failedCases} case(s) do not conform.`
);
process.exit(failedCases === 0 ? 0 : 1);
