// FIGR Design System - Color Naming Service (PalettesPro API + Offline Matching)
const nameCache: Map<string, string> = new Map();

// Comprehensive color list for guaranteed offline matching
const COLOR_NAMES_LIST: { name: string; hex: string }[] = [
  { name: 'Black', hex: '000000' },
  { name: 'White', hex: 'FFFFFF' },
  { name: 'Pure Red', hex: 'FF0000' },
  { name: 'Lime Green', hex: '00FF00' },
  { name: 'Pure Blue', hex: '0000FF' },
  { name: 'Bright Yellow', hex: 'FFFF00' },
  { name: 'Cyan', hex: '00FFFF' },
  { name: 'Magenta', hex: 'FF00FF' },
  { name: 'Silver', hex: 'C0C0C0' },
  { name: 'Gray', hex: '808080' },
  { name: 'Maroon', hex: '800000' },
  { name: 'Olive', hex: '808000' },
  { name: 'Green', hex: '008000' },
  { name: 'Purple', hex: '800080' },
  { name: 'Teal', hex: '008080' },
  { name: 'Navy Blue', hex: '000080' },
  { name: 'Orange', hex: 'FFA500' },
  { name: 'Amber', hex: 'FFBF00' },
  { name: 'Coral', hex: 'FF7F50' },
  { name: 'Crimson', hex: 'DC143C' },
  { name: 'Dark Red', hex: '8B0000' },
  { name: 'Firebrick', hex: 'B22222' },
  { name: 'Pink', hex: 'FFC0CB' },
  { name: 'Rose', hex: 'FF007F' },
  { name: 'Hot Pink', hex: 'FF69B4' },
  { name: 'Deep Pink', hex: 'FF1493' },
  { name: 'Misty Rose', hex: 'FFE4E1' },
  { name: 'Tomato', hex: 'FF6347' },
  { name: 'Gold', hex: 'FFD700' },
  { name: 'Khaki', hex: 'F0E68C' },
  { name: 'Violet', hex: 'EE82EE' },
  { name: 'Orchid', hex: 'DA70D6' },
  { name: 'Plum', hex: 'DDA0DD' },
  { name: 'Indigo', hex: '4B0082' },
  { name: 'Slate Blue', hex: '6A5ACD' },
  { name: 'Dark Slate Blue', hex: '483D8B' },
  { name: 'Forest Green', hex: '228B22' },
  { name: 'Emerald', hex: '50C878' },
  { name: 'Sea Green', hex: '2E8B57' },
  { name: 'Dark Green', hex: '006400' },
  { name: 'Olive Drab', hex: '6B8E23' },
  { name: 'Turquoise', hex: '40E0D0' },
  { name: 'Cadet Blue', hex: '5F9EA0' },
  { name: 'Steel Blue', hex: '4682B4' },
  { name: 'Sky Blue', hex: '87CEEB' },
  { name: 'Royal Blue', hex: '4169E1' },
  { name: 'Dodger Blue', hex: '1E90FF' },
  { name: 'Cornflower Blue', hex: '6495ED' },
  { name: 'Midnight Blue', hex: '191970' },
  { name: 'Charcoal', hex: '36454F' },
  { name: 'Dim Gray', hex: '696969' },
  { name: 'Slate Gray', hex: '708090' },
  { name: 'Light Slate Gray', hex: '778899' },
  { name: 'Brown', hex: 'A52A2A' },
  { name: 'Saddle Brown', hex: '8B4513' },
  { name: 'Sienna', hex: 'A0522D' },
  { name: 'Chocolate', hex: 'D2691E' },
  { name: 'Sandy Brown', hex: 'F4A460' },
  { name: 'Beige', hex: 'F5F5DC' },
  { name: 'Ivory', hex: 'FFFFF0' },
  { name: 'Tangelo', hex: 'F97316' },
  { name: 'Brass', hex: '937A34' },
  { name: 'Olive Gold', hex: '808000' }
];

export function getNearestColorName(hex: string): string {
  if (!hex) return 'Custom Color';
  const cleanHex = hex.replace('#', '').toUpperCase();
  if (cleanHex.length !== 6) return 'Custom Color';

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  let closestName = 'Custom Color';
  let minDistance = Infinity;

  for (const item of COLOR_NAMES_LIST) {
    const targetR = parseInt(item.hex.slice(0, 2), 16);
    const targetG = parseInt(item.hex.slice(2, 4), 16);
    const targetB = parseInt(item.hex.slice(4, 6), 16);

    const dist = Math.sqrt(
      Math.pow(r - targetR, 2) +
      Math.pow(g - targetG, 2) +
      Math.pow(b - targetB, 2)
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }

  return closestName;
}

/**
 * Fetch the color name from PalettesPro API with offline fallback matching.
 */
export async function fetchColorName(hex: string): Promise<string> {
  if (!hex) return '';
  const cleanHex = hex.replace('#', '').toUpperCase();

  if (nameCache.has(cleanHex)) {
    return nameCache.get(cleanHex)!;
  }

  try {
    const url = `https://palettespro.com/api/v1/color-name?color=${encodeURIComponent(cleanHex)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const apiName = data?.name || data?.closest_color?.label || data?.colorName;
      if (apiName) {
        nameCache.set(cleanHex, apiName);
        return apiName;
      }
    }
  } catch (error) {
    // Ignore API error and fall back to local matching
  }

  // Fallback to TheColorAPI if PalettesPro fails
  try {
    const response = await fetch(`https://www.thecolorapi.com/id?hex=${cleanHex}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.name?.value) {
        nameCache.set(cleanHex, data.name.value);
        return data.name.value;
      }
    }
  } catch (error) {
    // Ignore API error
  }

  const fallbackName = getNearestColorName(cleanHex);
  nameCache.set(cleanHex, fallbackName);
  return fallbackName;
}
