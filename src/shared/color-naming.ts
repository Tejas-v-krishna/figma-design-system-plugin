// Design System Kit — offline colour naming.
//
// Nearest-match against a local list. No network: the plugin manifest blocks
// all outbound requests, so a remote naming API can never succeed here.
const nameCache: Map<string, string> = new Map();

// The full CSS Color Module Level 4 named-colour set, plus a few design-system
// staples CSS has no name for. Duplicate hexes are deliberately excluded — CSS
// aliases aqua/cyan and fuchsia/magenta to the same value, and a nearest-match
// search would otherwise pick between identical candidates arbitrarily.
const COLOR_NAMES_LIST: { name: string; hex: string }[] = [
  // Neutrals
  { name: 'Black', hex: '000000' },
  { name: 'Dim Gray', hex: '696969' },
  { name: 'Gray', hex: '808080' },
  { name: 'Dark Gray', hex: 'A9A9A9' },
  { name: 'Silver', hex: 'C0C0C0' },
  { name: 'Light Gray', hex: 'D3D3D3' },
  { name: 'Gainsboro', hex: 'DCDCDC' },
  { name: 'White Smoke', hex: 'F5F5F5' },
  { name: 'White', hex: 'FFFFFF' },
  { name: 'Snow', hex: 'FFFAFA' },
  { name: 'Ghost White', hex: 'F8F8FF' },
  { name: 'Charcoal', hex: '36454F' },
  { name: 'Dark Slate Gray', hex: '2F4F4F' },
  { name: 'Slate Gray', hex: '708090' },
  { name: 'Light Slate Gray', hex: '778899' },

  // Reds
  { name: 'Red', hex: 'FF0000' },
  { name: 'Dark Red', hex: '8B0000' },
  { name: 'Maroon', hex: '800000' },
  { name: 'Firebrick', hex: 'B22222' },
  { name: 'Crimson', hex: 'DC143C' },
  { name: 'Indian Red', hex: 'CD5C5C' },
  { name: 'Rosy Brown', hex: 'BC8F8F' },
  { name: 'Light Coral', hex: 'F08080' },
  { name: 'Salmon', hex: 'FA8072' },
  { name: 'Dark Salmon', hex: 'E9967A' },
  { name: 'Light Salmon', hex: 'FFA07A' },
  { name: 'Tomato', hex: 'FF6347' },
  { name: 'Coral', hex: 'FF7F50' },
  { name: 'Orange Red', hex: 'FF4500' },

  // Pinks
  { name: 'Pink', hex: 'FFC0CB' },
  { name: 'Light Pink', hex: 'FFB6C1' },
  { name: 'Hot Pink', hex: 'FF69B4' },
  { name: 'Deep Pink', hex: 'FF1493' },
  { name: 'Rose', hex: 'FF007F' },
  { name: 'Pale Violet Red', hex: 'DB7093' },
  { name: 'Medium Violet Red', hex: 'C71585' },
  { name: 'Misty Rose', hex: 'FFE4E1' },
  { name: 'Lavender Blush', hex: 'FFF0F5' },

  // Oranges and browns
  { name: 'Orange', hex: 'FFA500' },
  { name: 'Dark Orange', hex: 'FF8C00' },
  { name: 'Tangelo', hex: 'F97316' },
  { name: 'Amber', hex: 'FFBF00' },
  { name: 'Chocolate', hex: 'D2691E' },
  { name: 'Saddle Brown', hex: '8B4513' },
  { name: 'Sienna', hex: 'A0522D' },
  { name: 'Brown', hex: 'A52A2A' },
  { name: 'Peru', hex: 'CD853F' },
  { name: 'Sandy Brown', hex: 'F4A460' },
  { name: 'Burlywood', hex: 'DEB887' },
  { name: 'Tan', hex: 'D2B48C' },
  { name: 'Wheat', hex: 'F5DEB3' },
  { name: 'Navajo White', hex: 'FFDEAD' },
  { name: 'Peach Puff', hex: 'FFDAB9' },
  { name: 'Moccasin', hex: 'FFE4B5' },
  { name: 'Bisque', hex: 'FFE4C4' },
  { name: 'Blanched Almond', hex: 'FFEBCD' },
  { name: 'Papaya Whip', hex: 'FFEFD5' },
  { name: 'Antique White', hex: 'FAEBD7' },
  { name: 'Linen', hex: 'FAF0E6' },
  { name: 'Old Lace', hex: 'FDF5E6' },
  { name: 'Seashell', hex: 'FFF5EE' },
  { name: 'Floral White', hex: 'FFFAF0' },
  { name: 'Cornsilk', hex: 'FFF8DC' },
  { name: 'Brass', hex: '937A34' },

  // Yellows
  { name: 'Yellow', hex: 'FFFF00' },
  { name: 'Gold', hex: 'FFD700' },
  { name: 'Goldenrod', hex: 'DAA520' },
  { name: 'Dark Goldenrod', hex: 'B8860B' },
  { name: 'Khaki', hex: 'F0E68C' },
  { name: 'Dark Khaki', hex: 'BDB76B' },
  { name: 'Pale Goldenrod', hex: 'EEE8AA' },
  { name: 'Light Goldenrod Yellow', hex: 'FAFAD2' },
  { name: 'Lemon Chiffon', hex: 'FFFACD' },
  { name: 'Light Yellow', hex: 'FFFFE0' },
  { name: 'Ivory', hex: 'FFFFF0' },
  { name: 'Beige', hex: 'F5F5DC' },
  { name: 'Olive', hex: '808000' },
  { name: 'Dark Olive Green', hex: '556B2F' },
  { name: 'Olive Drab', hex: '6B8E23' },

  // Greens
  { name: 'Lime', hex: '00FF00' },
  { name: 'Lime Green', hex: '32CD32' },
  { name: 'Lawn Green', hex: '7CFC00' },
  { name: 'Chartreuse', hex: '7FFF00' },
  { name: 'Green Yellow', hex: 'ADFF2F' },
  { name: 'Yellow Green', hex: '9ACD32' },
  { name: 'Green', hex: '008000' },
  { name: 'Dark Green', hex: '006400' },
  { name: 'Forest Green', hex: '228B22' },
  { name: 'Sea Green', hex: '2E8B57' },
  { name: 'Medium Sea Green', hex: '3CB371' },
  { name: 'Dark Sea Green', hex: '8FBC8F' },
  { name: 'Light Green', hex: '90EE90' },
  { name: 'Pale Green', hex: '98FB98' },
  { name: 'Spring Green', hex: '00FF7F' },
  { name: 'Medium Spring Green', hex: '00FA9A' },
  { name: 'Emerald', hex: '50C878' },
  { name: 'Light Sea Green', hex: '20B2AA' },
  { name: 'Honeydew', hex: 'F0FFF0' },
  { name: 'Mint Cream', hex: 'F5FFFA' },

  // Cyans and teals
  { name: 'Cyan', hex: '00FFFF' },
  { name: 'Dark Cyan', hex: '008B8B' },
  { name: 'Teal', hex: '008080' },
  { name: 'Turquoise', hex: '40E0D0' },
  { name: 'Dark Turquoise', hex: '00CED1' },
  { name: 'Medium Turquoise', hex: '48D1CC' },
  { name: 'Pale Turquoise', hex: 'AFEEEE' },
  { name: 'Aquamarine', hex: '7FFFD4' },
  { name: 'Medium Aquamarine', hex: '66CDAA' },
  { name: 'Cadet Blue', hex: '5F9EA0' },
  { name: 'Light Cyan', hex: 'E0FFFF' },
  { name: 'Azure', hex: 'F0FFFF' },

  // Blues
  { name: 'Blue', hex: '0000FF' },
  { name: 'Medium Blue', hex: '0000CD' },
  { name: 'Dark Blue', hex: '00008B' },
  { name: 'Navy', hex: '000080' },
  { name: 'Midnight Blue', hex: '191970' },
  { name: 'Royal Blue', hex: '4169E1' },
  { name: 'Cornflower Blue', hex: '6495ED' },
  { name: 'Dodger Blue', hex: '1E90FF' },
  { name: 'Deep Sky Blue', hex: '00BFFF' },
  { name: 'Sky Blue', hex: '87CEEB' },
  { name: 'Light Sky Blue', hex: '87CEFA' },
  { name: 'Steel Blue', hex: '4682B4' },
  { name: 'Light Steel Blue', hex: 'B0C4DE' },
  { name: 'Light Blue', hex: 'ADD8E6' },
  { name: 'Powder Blue', hex: 'B0E0E6' },
  { name: 'Alice Blue', hex: 'F0F8FF' },

  // Purples and violets
  { name: 'Purple', hex: '800080' },
  { name: 'Dark Magenta', hex: '8B008B' },
  { name: 'Magenta', hex: 'FF00FF' },
  { name: 'Indigo', hex: '4B0082' },
  { name: 'Rebecca Purple', hex: '663399' },
  { name: 'Dark Violet', hex: '9400D3' },
  { name: 'Blue Violet', hex: '8A2BE2' },
  { name: 'Dark Orchid', hex: '9932CC' },
  { name: 'Medium Orchid', hex: 'BA55D3' },
  { name: 'Orchid', hex: 'DA70D6' },
  { name: 'Violet', hex: 'EE82EE' },
  { name: 'Plum', hex: 'DDA0DD' },
  { name: 'Thistle', hex: 'D8BFD8' },
  { name: 'Medium Purple', hex: '9370DB' },
  { name: 'Slate Blue', hex: '6A5ACD' },
  { name: 'Dark Slate Blue', hex: '483D8B' },
  { name: 'Medium Slate Blue', hex: '7B68EE' },
  { name: 'Lavender', hex: 'E6E6FA' },
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
 * Resolve a human-readable name for a hex colour.
 *
 * This used to try palettespro.com and then thecolorapi.com before falling back
 * to local matching. manifest.json declares `networkAccess.allowedDomains:
 * ["none"]`, so both requests were blocked by the sandbox every single time —
 * every colour name paid for two doomed round-trips and then used the local
 * result anyway. Naming is now purely local, which also keeps the plugin
 * offline and removes a network-permission question from Figma's review.
 */
export function getColorName(hex: string): string {
  if (!hex) return '';
  const cleanHex = hex.replace('#', '').toUpperCase();

  const cached = nameCache.get(cleanHex);
  if (cached !== undefined) return cached;

  const name = getNearestColorName(cleanHex);
  nameCache.set(cleanHex, name);
  return name;
}
