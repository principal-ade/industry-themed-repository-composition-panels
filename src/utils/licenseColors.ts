/**
 * License permissiveness levels and color mapping
 */

export type LicensePermissiveness =
  | 'permissive'
  | 'weakCopyleft'
  | 'strongCopyleft'
  | 'unknown';

const permissiveLicenses = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'Unlicense',
  'CC0-1.0',
  '0BSD',
  'WTFPL',
]);

const weakCopyleftLicenses = new Set([
  'LGPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'MPL-2.0',
  'EPL-1.0',
  'EPL-2.0',
  'OSL-3.0',
]);

const strongCopyleftLicenses = new Set([
  'GPL-2.0',
  'GPL-3.0',
  'AGPL-3.0',
  'GPL-2.0-only',
  'GPL-3.0-only',
  'AGPL-3.0-only',
]);

/**
 * Get the permissiveness level of a license
 */
export function getLicensePermissiveness(
  license: string | undefined
): LicensePermissiveness {
  if (!license) return 'unknown';

  const normalized = license.trim();

  if (permissiveLicenses.has(normalized)) return 'permissive';
  if (weakCopyleftLicenses.has(normalized)) return 'weakCopyleft';
  if (strongCopyleftLicenses.has(normalized)) return 'strongCopyleft';

  // Check for common variations
  const upper = normalized.toUpperCase();
  if (
    upper.includes('MIT') ||
    upper.includes('APACHE') ||
    upper.includes('BSD')
  )
    return 'permissive';
  if (upper.includes('LGPL') || upper.includes('MPL')) return 'weakCopyleft';
  if (upper.includes('GPL') || upper.includes('AGPL')) return 'strongCopyleft';

  return 'unknown';
}

/**
 * Get a color for a license based on its permissiveness
 */
export function getLicenseColor(license: string | undefined): string {
  const permissiveness = getLicensePermissiveness(license);

  switch (permissiveness) {
    case 'permissive':
      return '#10b981'; // green
    case 'weakCopyleft':
      return '#f59e0b'; // amber/orange
    case 'strongCopyleft':
      return '#ef4444'; // red
    case 'unknown':
    default:
      return '#6b7280'; // gray
  }
}
