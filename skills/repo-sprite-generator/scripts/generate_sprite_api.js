#!/usr/bin/env node
/**
 * Repository Sprite Generator (API-based)
 * Generates custom sprites using AI image generation APIs
 *
 * Usage:
 *   node generate_sprite_api.js <metadata.json> <output.png> [--provider=openai|replicate]
 *
 * Environment variables:
 *   OPENAI_API_KEY - OpenAI API key (for DALL-E)
 *   REPLICATE_API_TOKEN - Replicate API token (for Stable Diffusion)
 */

import fs from 'fs';
import https from 'https';
import http from 'http';

// Style guide and color palettes
const BIOME_COLORS = {
  grass: { primary: '#22c55e', secondary: '#16a34a', accent: '#86efac', desc: 'green' },
  desert: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fde68a', desc: 'yellow/orange' },
  water: { primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9', desc: 'cyan/blue' },
  volcano: { primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5', desc: 'red/orange' },
  ice: { primary: '#3b82f6', secondary: '#2563eb', accent: '#dbeafe', desc: 'light blue' }
};

const REPO_TYPE_DESCRIPTIONS = {
  'git-repo': 'a modern glass office building with a grid of windows, representing a single-package repository',
  'monorepo': 'a cluster of 2-3 connected buildings with bridges between them, representing multiple packages in one repository',
  'castle': 'a grand fortress with towers and battlements, representing a major/flagship repository',
  'fortress': 'a large defensive fortification, representing an important infrastructure library',
  'tower': 'a tall, narrow building with multiple floors and distinctive top, representing a specialized tool or utility',
  'house': 'a modest residential building with peaked roof, representing a standard library or package',
  'pipe': 'a simple green warp pipe (Mario-style), representing a minimal entry point package'
};

/**
 * Build the image generation prompt
 */
function buildPrompt(metadata) {
  const { repositoryName, repositoryType, theme, features = [], purpose = '' } = metadata;
  const colors = BIOME_COLORS[theme] || BIOME_COLORS.grass;
  const buildingDesc = REPO_TYPE_DESCRIPTIONS[repositoryType] || 'a simple isometric building';

  let prompt = `Create an isometric pixel art sprite in 8-bit retro NES style. The sprite should be ${buildingDesc}.

Style Requirements:
- 8-bit pixel art aesthetic with crisp, clean edges (no anti-aliasing)
- Isometric 2.5D projection showing front face and right side face
- Limited color palette using ${colors.desc} theme colors: ${colors.primary} (main), ${colors.secondary} (shading), ${colors.accent} (highlights)
- Size: 128x128 pixels on transparent background
- Building should be centered in the canvas

Building Details:`;

  if (repositoryType === 'tower') {
    prompt += `
- Tall (40px height), narrow structure (24px width)
- Multiple distinct floors (4 levels) indicated by horizontal dividing lines
- Flat or distinctive roof cap at the top`;
  } else if (repositoryType === 'monorepo') {
    prompt += `
- Main building 40px tall, with two smaller connected buildings (28px and 24px tall)
- Three small gold dots on the main building's roof representing multiple packages
- Connected with bridges or shared foundation`;
  } else if (repositoryType === 'castle') {
    prompt += `
- Large central structure 44px tall with crenellated battlements
- Two corner towers 52px tall
- Imposing, authoritative appearance`;
  } else if (repositoryType === 'git-repo') {
    prompt += `
- Modern office building 36px tall
- Blue glass appearance (#3b82f6)
- Orange accent stripe on roof (#f97316)`;
  }

  // Add feature-specific details
  if (features.includes('windows')) {
    prompt += `\n- Multiple windows arranged in a grid pattern on the front face, colored ${colors.accent}`;
  }
  if (features.includes('antenna')) {
    prompt += `\n- Antenna or satellite dish on the roof for API/networking functionality`;
  }
  if (features.includes('flag')) {
    prompt += `\n- Small red flag on a pole at the highest point`;
  }
  if (features.includes('gears')) {
    prompt += `\n- Visible gears or mechanical elements indicating build/automation tools`;
  }

  if (purpose) {
    prompt += `\n\nThe building should visually represent: ${purpose}`;
  }

  prompt += `\n\nImportant: The sprite MUST be pixel-perfect 8-bit style with no gradients or smooth shading. Use only solid colors from the palette. The isometric perspective should show the front face as a rectangle and the right side as a parallelogram going up and to the right.`;

  return prompt;
}

/**
 * Generate sprite using OpenAI DALL-E
 */
async function generateWithOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  console.log('🎨 Generating sprite with DALL-E...');

  const requestBody = JSON.stringify({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024', // DALL-E 3 requires this size, we'll crop/resize
    quality: 'standard',
    style: 'natural'
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/images/generations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`OpenAI API error: ${res.statusCode} ${data}`));
          return;
        }
        const result = JSON.parse(data);
        if (result.data && result.data[0] && result.data[0].url) {
          resolve(result.data[0].url);
        } else {
          reject(new Error('Unexpected response format from OpenAI'));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * Download image from URL
 */
async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        downloadImage(res.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node generate_sprite_api.js <metadata.json> <output.png> [--provider=openai]');
    process.exit(1);
  }

  const metadataFile = args[0];
  const outputFile = args[1];
  const provider = args[2]?.replace('--provider=', '') || 'openai';

  try {
    // Read metadata
    const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
    console.log(`📊 Repository: ${metadata.repositoryName}`);
    console.log(`   Type: ${metadata.repositoryType}, Theme: ${metadata.theme}`);

    // Build prompt
    const prompt = buildPrompt(metadata);
    console.log('\n📝 Generated prompt:');
    console.log(prompt);
    console.log();

    // Generate image
    let imageUrl;
    if (provider === 'openai') {
      imageUrl = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`Unsupported provider: ${provider}. Use 'openai'.`);
    }

    // Download image
    console.log('⬇️  Downloading generated image...');
    await downloadImage(imageUrl, outputFile);

    console.log(`✅ Sprite generated successfully: ${outputFile}`);
    console.log(`   Note: You may need to resize/crop to 128x128 if needed`);
  } catch (error) {
    console.error('❌ Error generating sprite:', error.message);
    process.exit(1);
  }
}

main();
