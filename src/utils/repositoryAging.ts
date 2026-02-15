/**
 * Utilities for calculating repository age and weathering effects
 * Based on lastEditedAt timestamp to show aging/inactivity
 */

export type AgeCategory = 'fresh' | 'recent' | 'old';

export interface AgingMetrics {
  category: AgeCategory;
  monthsSinceEdit: number;
  weatheringLevel: number; // 0.0 (pristine) to 1.0 (heavily weathered)
  colorFade: number; // 0.0 (no fade) to 1.0 (maximum fade/desaturation)
  lastEditedAt?: string; // ISO timestamp of last edit (stored for region grouping)
}

/**
 * Calculate aging metrics from last edit timestamp
 * Categories:
 * - Fresh: 0-3 months (no weathering, vibrant colors)
 * - Recent: 3-12 months (light weathering, slight color fade)
 * - Old: 1+ year (heavy weathering, significant color fade)
 */
export function calculateAgingMetrics(lastEditedAt?: string): AgingMetrics {
  if (!lastEditedAt) {
    // No timestamp = assume fresh
    return {
      category: 'fresh',
      monthsSinceEdit: 0,
      weatheringLevel: 0,
      colorFade: 0,
    };
  }

  const now = new Date();
  const lastEdit = new Date(lastEditedAt);
  const monthsSinceEdit = (now.getTime() - lastEdit.getTime()) / (1000 * 60 * 60 * 24 * 30);

  let category: AgeCategory;
  let weatheringLevel: number;
  let colorFade: number;

  if (monthsSinceEdit < 3) {
    // Fresh (0-3 months)
    category = 'fresh';
    weatheringLevel = 0;
    colorFade = 0;
  } else if (monthsSinceEdit < 12) {
    // Recent (3-12 months)
    category = 'recent';
    // Linear interpolation from 0 to 0.5 over 3-12 months
    const progress = (monthsSinceEdit - 3) / 9;
    weatheringLevel = progress * 0.5;
    colorFade = progress * 0.3;
  } else {
    // Old (12+ months)
    category = 'old';
    // Cap at 24 months for maximum weathering
    const monthsCapped = Math.min(monthsSinceEdit, 24);
    const progress = (monthsCapped - 12) / 12;
    weatheringLevel = 0.5 + progress * 0.5; // 0.5 to 1.0
    colorFade = 0.3 + progress * 0.4; // 0.3 to 0.7
  }

  return {
    category,
    monthsSinceEdit,
    weatheringLevel: Math.min(weatheringLevel, 1.0),
    colorFade: Math.min(colorFade, 0.7), // Cap at 70% fade
    lastEditedAt, // Store for region grouping
  };
}

/**
 * Apply color desaturation/fading to a hex color
 * fadeAmount: 0.0 (no change) to 1.0 (fully desaturated/grayed)
 */
export function applyColorFade(hexColor: string, fadeAmount: number): string {
  // Parse hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Convert to HSL for desaturation
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r / 255:
        h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g / 255:
        h = ((b / 255 - r / 255) / d + 2) / 6;
        break;
      case b / 255:
        h = ((r / 255 - g / 255) / d + 4) / 6;
        break;
    }
  }

  // Reduce saturation and darken slightly
  const newS = s * (1 - fadeAmount * 0.7); // Reduce saturation
  const newL = l * (1 - fadeAmount * 0.2); // Darken slightly

  // Convert back to RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return hslToRgb(h, newS, newL);
}
