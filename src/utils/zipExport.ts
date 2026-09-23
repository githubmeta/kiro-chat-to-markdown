import JSZip from 'jszip';
import { BatchConversionItem, ConversionResult } from '../types/kiro';

/**
 * Clean and format a string into a safe file name
 */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'kiro-chat-session';
}

/**
 * Determine a descriptive, unique filename for a converted markdown file
 */
export function getMarkdownFilename(
  result: ConversionResult,
  fallbackSource: string,
  existingNames: Set<string>
): string {
  let baseName = '';

  if (result.session?.title) {
    baseName = sanitizeFilename(result.session.title);
  } else if (result.session?.name) {
    baseName = sanitizeFilename(result.session.name);
  } else if (result.session?.sessionId) {
    baseName = sanitizeFilename(result.session.sessionId);
  } else {
    // Try from source file name without .zip
    const cleanSource = fallbackSource.replace(/\.zip$/i, '');
    baseName = sanitizeFilename(cleanSource);
  }

  let finalName = `${baseName}.md`;
  let counter = 1;

  while (existingNames.has(finalName)) {
    finalName = `${baseName}-${counter}.md`;
    counter++;
  }

  existingNames.add(finalName);
  return finalName;
}

/**
 * Download a single Markdown file
 */
export function downloadSingleMarkdown(filename: string, markdown: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Package multiple converted markdown files into a single .zip archive and trigger download
 */
export async function downloadBatchAsZip(
  items: BatchConversionItem[],
  zipArchiveName: string = 'kiro-markdown-exports.zip'
): Promise<void> {
  if (items.length === 0) return;

  const zip = new JSZip();

  // Add each markdown file into the root of the zip archive
  items.forEach((item) => {
    const filename = item.markdownFileName.endsWith('.md')
      ? item.markdownFileName
      : `${item.markdownFileName}.md`;

    zip.file(filename, item.result.markdown);
  });

  // Generate zip binary in browser
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipArchiveName.endsWith('.zip') ? zipArchiveName : `${zipArchiveName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sequential download of multiple markdown files individually
 */
export async function downloadAllSeparately(items: BatchConversionItem[]): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    downloadSingleMarkdown(item.markdownFileName, item.result.markdown);
    // Short delay to avoid browser blocking rapid triggers
    if (i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}
