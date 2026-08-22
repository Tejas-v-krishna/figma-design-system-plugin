import { sanitizeConfig } from '../src/shared/config-schema';
import { DEFAULT_CONFIG } from '../src/shared/types';

let failed = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}\n         got ${a}\n         want ${e}`);
  }
}

console.log('sanitizeConfig');

// 1. undefined -> defaults, no repairs reported (a fresh install is not "damaged")
{
  const r = sanitizeConfig(undefined);
  check('undefined yields defaults', r.config.primaryColor, DEFAULT_CONFIG.primaryColor);
  check('undefined reports no repairs', r.repairs, []);
}

// 2. a non-object is a real problem and is reported
{
  const r = sanitizeConfig('nope');
  check('string input reports a repair', r.repairs.length > 0, true);
  check('string input still yields a usable config', r.config.radiusPreset, 'rounded');
}

// 3. the shapes that used to reach the generator unchecked
{
  const r = sanitizeConfig({
    brandName: '  Acme  ',
    primaryColor: 'f00',
    secondaryColor: '#nothex',
    baseFontSize: 900,
    baseSpacing: 'abc',
    radiusPreset: 'squircle',
    effectsIntensity: 'MEDIUM',
    componentsToGenerate: 'Button',
    fontFamily: 'Inter',
    options: { createStyles: 'yes', includeDarkMode: false },
  });
  check('brandName trimmed', r.config.brandName, 'Acme');
  check('3-digit hex expanded and cased', r.config.primaryColor, '#FF0000');
  check('malformed optional colour dropped', r.config.secondaryColor, undefined);
  check('font size clamped', r.config.baseFontSize, 32);
  check('non-numeric spacing defaulted', r.config.baseSpacing, DEFAULT_CONFIG.baseSpacing);
  check('unknown radius preset defaulted', r.config.radiusPreset, 'rounded');
  check('wrong-case enum defaulted', r.config.effectsIntensity, 'medium');
  check('non-array component list emptied', r.config.componentsToGenerate, []);
  check('non-object fontFamily defaulted', r.config.fontFamily, DEFAULT_CONFIG.fontFamily);
  check('non-boolean option defaulted', r.config.options.createStyles, true);
  check('valid boolean option preserved', r.config.options.includeDarkMode, false);
  // Note what is absent: 'f00' expands to a valid colour and '  Acme  ' only
  // needed trimming, so neither counts as a repair.
  check('every repair reported', r.repairs, [
    'secondaryColor: "#nothex" is not a colour, ignoring it',
    'fontFamily: expected an object, using defaults',
    'baseFontSize: 900 is out of range, clamped to 32',
    'baseSpacing: expected a number, using 4',
    'radiusPreset: "squircle" is not recognised, using "rounded"',
    'effectsIntensity: "MEDIUM" is not recognised, using "medium"',
    'componentsToGenerate: expected a list, ignoring it',
    'options.createStyles: expected true or false, using true',
  ]);
}

// 4. a clean config passes through untouched
{
  const r = sanitizeConfig(DEFAULT_CONFIG);
  check('clean config reports no repairs', r.repairs, []);
  check('clean config round-trips', r.config, DEFAULT_CONFIG);
}

// 5. component list filters junk entries but keeps the good ones
{
  const r = sanitizeConfig({ ...DEFAULT_CONFIG, componentsToGenerate: ['Button', 42, '', 'Card', null] });
  check('component list keeps valid names', r.config.componentsToGenerate, ['Button', 'Card']);
  check('component list reports the drops', r.repairs, ['componentsToGenerate: dropped 3 invalid entries']);
}

// 6. the sanitized config must not alias DEFAULT_CONFIG's nested objects
{
  const r = sanitizeConfig(undefined);
  r.config.options.createStyles = false;
  check('nested options are cloned, not shared', DEFAULT_CONFIG.options.createStyles, true);
}

console.log(failed === 0 ? '\nall passed' : `\n${failed} FAILED`);
if (failed > 0) process.exit(1);
