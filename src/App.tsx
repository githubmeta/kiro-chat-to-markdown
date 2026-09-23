import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { BatchSessionSelector } from './components/BatchSessionSelector';
import { SessionStatsBar } from './components/SessionStatsBar';
import { MarkdownViewer } from './components/MarkdownViewer';
import { SettingsModal } from './components/SettingsModal';
import { BatchConversionItem, ConversionOptions } from './types/kiro';
import {
  defaultConversionOptions,
  parseKiroZip,
  processKiroFiles,
} from './utils/kiroParser';
import { generateMarkdown } from './utils/markdownGenerator';
import { getSampleFiles } from './utils/sampleData';
import {
  getMarkdownFilename,
  downloadSingleMarkdown,
  downloadBatchAsZip,
} from './utils/zipExport';
import confetti from 'canvas-confetti';

export default function App() {
  const [items, setItems] = useState<BatchConversionItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>(defaultConversionOptions);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Active item and result
  const activeItem = items.find((it) => it.id === activeItemId) || items[0] || null;
  const currentResult = activeItem ? activeItem.result : null;

  // Handle uploading 1 or multiple .zip files
  const handleZipsUpload = async (files: File[], append: boolean = false) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    const existingNames = new Set<string>(
      append ? items.map((i) => i.markdownFileName) : []
    );
    const newItems: BatchConversionItem[] = [];
    const failures: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(
        files.length > 1
          ? `Parsing archive ${i + 1} of ${files.length}: ${file.name}...`
          : `Parsing archive: ${file.name}...`
      );

      try {
        const buffer = await file.arrayBuffer();
        const res = await parseKiroZip(buffer, options);
        const mdName = getMarkdownFilename(res, file.name, existingNames);
        newItems.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          sourceFileName: file.name,
          markdownFileName: mdName,
          result: res,
        });
      } catch (err: any) {
        console.error(`Failed to parse ${file.name}:`, err);
        failures.push(`${file.name} (${err?.message || 'Invalid format'})`);
      }
    }

    if (newItems.length > 0) {
      if (append) {
        setItems((prev) => [...prev, ...newItems]);
        if (!activeItemId) {
          setActiveItemId(newItems[0].id);
        }
      } else {
        setItems(newItems);
        setActiveItemId(newItems[0].id);
      }

      if (failures.length > 0) {
        setError(
          `Converted ${newItems.length} archives successfully. ${failures.length} file(s) failed: ${failures.join(', ')}`
        );
      }
    } else {
      setError(
        failures.length > 0
          ? `Could not parse zip file(s): ${failures.join('; ')}`
          : 'No valid Kiro chat export data found in the uploaded zip(s).'
      );
    }

    setIsProcessing(false);
    setProcessingStatus(null);
  };

  // Handle single zip upload (backwards-compatible prop)
  const handleZipUpload = (file: File) => {
    handleZipsUpload([file], false);
  };

  // Handle multiple loose files or unzipped folder upload
  const handleFilesUpload = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setProcessingStatus('Reading unzipped folder contents...');
    setError(null);
    try {
      const fileList = Array.from(files);
      const textFiles: { path: string; content: string; size: number }[] = [];

      for (const f of fileList) {
        const path = (f as any).webkitRelativePath || f.name;
        if (path.endsWith('.json') || path.endsWith('.jsonl')) {
          const content = await f.text();
          textFiles.push({
            path,
            content,
            size: f.size,
          });
        }
      }

      if (textFiles.length === 0) {
        throw new Error(
          'No valid .jsonl or session.json files were found in the uploaded selection. Please provide messages.jsonl or Kiro export .zip.'
        );
      }

      const res = processKiroFiles(textFiles, options);
      const existingNames = new Set<string>();
      const mdName = getMarkdownFilename(res, 'kiro-folder-export', existingNames);
      const newItem: BatchConversionItem = {
        id: `folder-${Date.now()}`,
        sourceFileName: 'Folder Upload',
        markdownFileName: mdName,
        result: res,
      };

      setItems([newItem]);
      setActiveItemId(newItem.id);
    } catch (err: any) {
      console.error('Failed to parse files:', err);
      setError(err?.message || 'Failed to process files. Please verify the file formats.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  // Handle loading realistic sample export
  const handleLoadSample = () => {
    setIsProcessing(true);
    setProcessingStatus('Loading sample Kiro export...');
    setError(null);
    setTimeout(() => {
      try {
        const sampleFiles = getSampleFiles();
        const res = processKiroFiles(sampleFiles, options);
        const existingNames = new Set<string>();
        const mdName = getMarkdownFilename(res, 'sample-auth-refactor', existingNames);
        const sampleItem: BatchConversionItem = {
          id: `sample-${Date.now()}`,
          sourceFileName: 'sample-kiro-export.zip',
          markdownFileName: mdName,
          result: res,
        };
        setItems([sampleItem]);
        setActiveItemId(sampleItem.id);
      } catch (err: any) {
        setError('Failed to load sample export.');
      } finally {
        setIsProcessing(false);
        setProcessingStatus(null);
      }
    }, 150);
  };

  // Update conversion options & regenerate markdown across all loaded batch items
  const handleOptionsChange = (newOptions: ConversionOptions) => {
    setOptions(newOptions);
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        result: {
          ...item.result,
          markdown: generateMarkdown(
            item.result.messages,
            item.result.session,
            newOptions
          ),
        },
      }))
    );
  };

  // Download currently active single .md file
  const handleDownloadActive = () => {
    if (!activeItem) return;
    downloadSingleMarkdown(activeItem.markdownFileName, activeItem.result.markdown);
  };

  // Download specific single .md file
  const handleDownloadSingle = (item: BatchConversionItem) => {
    downloadSingleMarkdown(item.markdownFileName, item.result.markdown);
  };

  // Download all converted .md files together inside a single .zip archive
  const handleDownloadAllZip = async () => {
    if (items.length === 0) return;
    setIsDownloadingZip(true);
    try {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {
        // purely decorative
      }
      await downloadBatchAsZip(items, 'kiro-chat-markdown-exports.zip');
    } catch (err: any) {
      console.error('Failed to bundle markdown files into zip:', err);
      setError('Failed to create batch zip archive for download.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Remove a single item from the batch
  const handleRemoveItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    if (activeItemId === id) {
      setActiveItemId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Reset to upload state
  const handleReset = () => {
    setItems([]);
    setActiveItemId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-amber-500/20 selection:text-amber-900">
      {/* Hidden file input for "Add More Files" in batch mode */}
      <input
        ref={addMoreInputRef}
        type="file"
        accept=".zip"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleZipsUpload(Array.from(e.target.files), true);
            e.target.value = '';
          }
        }}
        className="hidden"
        id="batch-add-more-input"
      />

      {/* Top Navigation */}
      <Header
        hasResult={items.length > 0}
        batchCount={items.length}
        onLoadSample={handleLoadSample}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownload={handleDownloadActive}
        onDownloadAllZip={handleDownloadAllZip}
        onReset={handleReset}
        isProcessing={isProcessing}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {items.length === 0 || !currentResult ? (
          <UploadZone
            onZipUpload={handleZipUpload}
            onZipsUpload={handleZipsUpload}
            onFilesUpload={handleFilesUpload}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessing}
            processingStatusText={processingStatus}
            error={error}
          />
        ) : (
          <div>
            {/* Batch Session Switcher & Aggregate Download Bar */}
            {items.length > 1 && (
              <BatchSessionSelector
                items={items}
                activeItemId={activeItem.id}
                onSelectItem={(id) => setActiveItemId(id)}
                onDownloadAllZip={handleDownloadAllZip}
                onDownloadSingle={handleDownloadSingle}
                onRemoveItem={handleRemoveItem}
                onAddMoreFiles={() => addMoreInputRef.current?.click()}
                isDownloadingZip={isDownloadingZip}
              />
            )}

            {/* Current Session Metadata & Stats Bar */}
            <SessionStatsBar
              result={currentResult}
              batchCount={items.length}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onDownload={handleDownloadActive}
              onDownloadAllZip={handleDownloadAllZip}
            />

            {/* Markdown Inspector & Viewer for the current session */}
            <MarkdownViewer key={activeItem.id} result={currentResult} />
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onChange={handleOptionsChange}
      />
    </div>
  );
}
