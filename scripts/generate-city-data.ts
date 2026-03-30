#!/usr/bin/env bun
/**
 * Generate CityData JSON from a local git repository
 *
 * Usage:
 *   bun scripts/generate-city-data.ts /path/to/repo [output-path]
 *
 * Examples:
 *   bun scripts/generate-city-data.ts ~/projects/my-app
 *   bun scripts/generate-city-data.ts ~/projects/my-app ./assets/my-app-city.json
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { GitFileTreeBuilder } from '@principal-ai/repository-abstraction';
import {
  buildCityDataFromFileTree,
  enrichWithLineCounts,
  type LineCountData,
} from '../src/panels/file-city-3d/buildCityData';

function printUsage() {
  console.log(`
Usage: bun scripts/generate-city-data.ts <repo-path> [output-path]

Arguments:
  repo-path    Path to a git repository
  output-path  Output JSON path (default: assets/<repo-name>-city-data.json)

Examples:
  bun scripts/generate-city-data.ts ~/projects/my-app
  bun scripts/generate-city-data.ts . ./assets/this-repo.json
`);
}

function validateRepoPath(repoPath: string): string {
  const resolved = path.resolve(repoPath);

  if (!fs.existsSync(resolved)) {
    console.error(`Error: Path does not exist: ${resolved}`);
    process.exit(1);
  }

  if (!fs.statSync(resolved).isDirectory()) {
    console.error(`Error: Path is not a directory: ${resolved}`);
    process.exit(1);
  }

  const gitDir = path.join(resolved, '.git');
  if (!fs.existsSync(gitDir)) {
    console.error(
      `Error: Not a git repository (no .git directory): ${resolved}`
    );
    process.exit(1);
  }

  return resolved;
}

// Binary file extensions to skip line counting
const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'ico',
  'webp',
  'svg',
  'bmp',
  'tiff',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'zip',
  'tar',
  'gz',
  'rar',
  '7z',
  'bz2',
  'exe',
  'dll',
  'so',
  'dylib',
  'bin',
  'mp3',
  'mp4',
  'wav',
  'avi',
  'mov',
  'mkv',
  'webm',
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot',
  'lock', // package-lock.json, yarn.lock, etc. (huge files)
]);

function isBinaryFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return BINARY_EXTENSIONS.has(ext);
}

function countLines(content: string): number {
  if (!content) return 0;
  // Count newlines, add 1 if file doesn't end with newline
  const newlines = (content.match(/\n/g) || []).length;
  return content.endsWith('\n') ? newlines : newlines + 1;
}

interface FileData {
  path: string;
  size: number;
  lineCount?: number;
}

function getGitFiles(repoPath: string): {
  files: FileData[];
  lineCounts: LineCountData;
} {
  // Get list of tracked files
  const output = execSync('git ls-files', {
    cwd: repoPath,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large repos
  });

  const filePaths = output.split('\n').filter(Boolean);
  console.log(`Found ${filePaths.length} tracked files`);

  // Get file sizes and line counts
  const files: FileData[] = [];
  const lineCounts: LineCountData = {};
  let skipped = 0;
  let linesCounted = 0;

  for (const filePath of filePaths) {
    const fullPath = path.join(repoPath, filePath);
    try {
      const stat = fs.statSync(fullPath);
      const fileData: FileData = { path: filePath, size: stat.size };

      // Count lines for non-binary files
      if (!isBinaryFile(filePath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = countLines(content);
          fileData.lineCount = lines;
          lineCounts[filePath] = lines;
          linesCounted++;
        } catch {
          // File might be binary despite extension, skip line counting
        }
      }

      files.push(fileData);
    } catch {
      // File might be deleted but still tracked
      skipped++;
    }
  }

  console.log(`Counted lines in ${linesCounted} files`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} files (deleted or inaccessible)`);
  }

  return { files, lineCounts };
}

function getGitInfo(repoPath: string): { commitSha: string; branch: string } {
  const commitSha = execSync('git rev-parse HEAD', {
    cwd: repoPath,
    encoding: 'utf-8',
  }).trim();

  let branch = 'unknown';
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoPath,
      encoding: 'utf-8',
    }).trim();
  } catch {
    // Detached HEAD state
  }

  return { commitSha, branch };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const repoPath = validateRepoPath(args[0]);
  const repoName = path.basename(repoPath);

  // Determine output path
  const outputPath = args[1]
    ? path.resolve(args[1])
    : path.resolve(__dirname, '..', 'assets', `${repoName}-city-data.json`);

  console.log(`\nGenerating CityData for: ${repoPath}`);
  console.log(`Output: ${outputPath}\n`);

  // Get git info
  const { commitSha, branch } = getGitInfo(repoPath);
  console.log(`Commit: ${commitSha.slice(0, 8)} (${branch})`);

  // Get files with line counts
  const { files, lineCounts } = getGitFiles(repoPath);

  // Build FileTree
  console.log('\nBuilding FileTree...');
  const builder = new GitFileTreeBuilder();
  const fileTree = builder.build({
    commitSha,
    branch,
    files,
    rootPath: repoName,
  });

  // Convert to CityData and enrich with actual line counts
  console.log('Converting to CityData...');
  let cityData = buildCityDataFromFileTree(fileTree, repoName);

  // Transform line counts to use full paths (matching building paths)
  const fullPathLineCounts: LineCountData = {};
  for (const [filePath, count] of Object.entries(lineCounts)) {
    fullPathLineCounts[`${repoName}/${filePath}`] = count;
  }
  cityData = enrichWithLineCounts(cityData, fullPathLineCounts);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(cityData, null, 2));

  // Print summary
  console.log('\n✓ Generated successfully!');
  console.log(`  Buildings: ${cityData.buildings.length}`);
  console.log(`  Districts: ${cityData.districts.length}`);
  console.log(`  Total files: ${cityData.metadata.totalFiles}`);
  console.log(`  Total directories: ${cityData.metadata.totalDirectories}`);
  console.log(`\nOutput written to: ${outputPath}`);
}

main();
