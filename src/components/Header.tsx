import React from 'react';
import { FileText, Sparkles, Settings2, Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  hasResult: boolean;
  batchCount?: number;
  onLoadSample: () => void;
  onOpenSettings: () => void;
  onDownload: () => void;
  onDownloadAllZip?: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasResult,
  batchCount = 1,
  onLoadSample,
  onOpenSettings,
  onDownload,
  onDownloadAllZip,
  onReset,
  isProcessing,
}) => {
  return (
    <header
      id="app-header"
      className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center shadow-xs">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight whitespace-nowrap">
                Kiro Chat to Markdown
              </h1>
              <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                IDE Export Tool
              </span>
              {batchCount > 1 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-900 text-amber-400">
                  {batchCount} Files Batch
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Combines <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">messages.jsonl</code> and <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">sub-executions/</code> into clean Markdown
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {!hasResult ? (
            <button
              id="btn-load-sample-header"
              onClick={onLoadSample}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="whitespace-nowrap">Load Sample Export</span>
            </button>
          ) : (
            <>
              <button
                id="btn-reset-header"
                onClick={onReset}
                title="Convert new or different files"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline whitespace-nowrap">Start Over</span>
              </button>

              <button
                id="btn-settings-header"
                onClick={onOpenSettings}
                title="Markdown Options"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-stone-600" />
                <span className="whitespace-nowrap">Formatting</span>
              </button>

              {batchCount > 1 && onDownloadAllZip ? (
                <button
                  id="btn-download-all-header"
                  onClick={onDownloadAllZip}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs transition-colors cursor-pointer"
                  title="Download all markdown files in a single .zip"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Download All ({batchCount} .md)</span>
                </button>
              ) : null}

              <button
                id="btn-download-header"
                onClick={onDownload}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">
                  {batchCount > 1 ? 'Download Current .md' : 'Export .md'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
