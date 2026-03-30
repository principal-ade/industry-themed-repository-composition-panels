/**
 * Environment Variable Parser
 *
 * Parses environment variable documentation from both:
 * - env.json (structured JSON format)
 * - .env.example / .env.sample (dotenv format with comments)
 */

export interface EnvVariable {
  name: string;
  description?: string;
  required: boolean;
  default?: string;
  example?: string;
  group?: string;
  link?: string;
}

export interface EnvParseResult {
  variables: EnvVariable[];
  format: 'json' | 'dotenv';
}

/**
 * Schema for env.json files
 */
interface EnvJsonSchema {
  variables: Array<{
    name: string;
    description?: string;
    required?: boolean;
    default?: string;
    example?: string;
    group?: string;
    link?: string;
  }>;
}

/**
 * Parse env.json content
 */
function parseEnvJson(content: string): EnvVariable[] {
  const parsed: EnvJsonSchema = JSON.parse(content);

  if (!parsed.variables || !Array.isArray(parsed.variables)) {
    throw new Error('Invalid env.json: missing "variables" array');
  }

  return parsed.variables.map((v) => ({
    name: v.name,
    description: v.description,
    required: v.required ?? false,
    default: v.default,
    example: v.example,
    group: v.group,
    link: v.link,
  }));
}

// URL pattern to auto-detect links in comments
const urlPattern = /https?:\/\/[^\s)>\]]+/gi;

/**
 * Parse .env.example / .env.sample content (dotenv format)
 *
 * Supports:
 * - Comments above variables become descriptions
 * - "# required" in comments marks variable as required
 * - Values after = become default/example
 * - Section headers for grouping: "# === Section ===" or "## Section" or "# [Section]"
 * - Auto-detects URLs in comments as links
 */
function parseDotEnv(content: string): EnvVariable[] {
  const lines = content.split('\n');
  const variables: EnvVariable[] = [];
  const commentBuffer: string[] = [];
  let currentGroup: string | undefined = undefined;

  // Patterns for section headers
  const sectionPatterns = [
    /^#\s*===\s*(.+?)\s*===\s*$/, // # === Section ===
    /^##\s+(.+?)\s*$/, // ## Section
    /^#\s*\[(.+?)\]\s*$/, // # [Section]
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines (but clear comment buffer)
    if (!trimmed) {
      commentBuffer.length = 0;
      continue;
    }

    // Check for section headers
    if (trimmed.startsWith('#')) {
      let isSection = false;
      for (const pattern of sectionPatterns) {
        const sectionMatch = trimmed.match(pattern);
        if (sectionMatch) {
          currentGroup = sectionMatch[1].trim();
          commentBuffer.length = 0;
          isSection = true;
          break;
        }
      }

      if (!isSection) {
        // Regular comment - add to buffer
        commentBuffer.push(trimmed.slice(1).trim());
      }
      continue;
    }

    // Parse variable line: KEY=value or KEY=
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
    if (match) {
      const [, name, value] = match;

      // Process comments to extract description, required flag, and links
      let required = false;
      let link: string | undefined = undefined;
      const descriptionParts: string[] = [];

      for (const comment of commentBuffer) {
        const lowerComment = comment.toLowerCase();

        // Extract URL if not already found
        if (!link) {
          const urlMatch = comment.match(urlPattern);
          if (urlMatch) {
            link = urlMatch[0];
          }
        }

        if (lowerComment === 'required' || lowerComment === '(required)') {
          required = true;
        } else if (lowerComment.includes('required')) {
          required = true;
          // Include the comment but note it mentioned required
          descriptionParts.push(
            comment.replace(/\s*\(?\s*required\s*\)?\s*/gi, '').trim()
          );
        } else {
          descriptionParts.push(comment);
        }
      }

      const description =
        descriptionParts.filter(Boolean).join(' ') || undefined;
      const defaultValue = value.trim() || undefined;

      variables.push({
        name,
        description,
        required,
        default: defaultValue,
        example: defaultValue,
        group: currentGroup,
        link,
      });

      // Clear comment buffer after processing
      commentBuffer.length = 0;
    }
  }

  return variables;
}

/**
 * Parse inline JSON field (e.g., expo.extra from app.json)
 * Converts a simple key-value object to EnvVariable array
 */
function parseInlineJson(content: string, inlineField: string): EnvVariable[] {
  const parsed = JSON.parse(content);

  // Navigate to the nested field (e.g., "expo.extra" -> parsed.expo.extra)
  const fieldPath = inlineField.split('.');
  let data: unknown = parsed;
  for (const key of fieldPath) {
    if (data && typeof data === 'object' && key in data) {
      data = (data as Record<string, unknown>)[key];
    } else {
      return []; // Field not found
    }
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  // Convert key-value pairs to EnvVariable format
  return Object.entries(data as Record<string, unknown>).map(
    ([name, value]) => ({
      name,
      description: `Configuration value from ${inlineField}`,
      required: false,
      default:
        typeof value === 'object' ? JSON.stringify(value) : String(value),
      group: inlineField,
    })
  );
}

/**
 * Parse environment variable documentation file
 *
 * @param content - File content
 * @param fileType - File type ('json' for env.json, 'custom' for .env.example)
 * @param inlineField - Optional field path for inline configs (e.g., 'expo.extra')
 * @returns Parsed environment variables
 */
export function parseEnvFile(
  content: string,
  fileType: 'json' | 'yaml' | 'toml' | 'js' | 'ts' | 'ini' | 'custom',
  inlineField?: string
): EnvParseResult {
  if (fileType === 'json') {
    // If inlineField is specified, extract from nested path (e.g., expo.extra)
    if (inlineField) {
      return {
        variables: parseInlineJson(content, inlineField),
        format: 'json',
      };
    }
    return {
      variables: parseEnvJson(content),
      format: 'json',
    };
  }

  // Default to dotenv parsing for .env.example, .env.sample, etc.
  return {
    variables: parseDotEnv(content),
    format: 'dotenv',
  };
}
