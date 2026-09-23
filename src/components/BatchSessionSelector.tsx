import React from 'react';
import {
  FileText,
  Archive,
  Download,
  Plus,
  CheckCircle2,
  Layers,
  ChevronRight,
  HardDriveDownload,
  Trash2,
} from 'lucide-react';
import { BatchConversionItem } from '../types/kiro';

interface BatchSessionSelectorProps {
  items: BatchConversionItem[];
  activeItemId: string;
  onSelectItem: (id: string) => void;
  onDownloadAllZip: () => void;
  onDownloadSingle: (item: BatchConversionItem) => void;
  onRemoveItem: (id: string) => void;
  onAddMoreFiles: () => void;
  isDownloadingZip?: boolean;
}

export const BatchSessionSelector: React.FC<BatchSessionSelectorProps> = ({
  items,
  activeItemId,
  onSelectItem,
  onDownloadAllZip,
  onDownloadSingle,
  onRemoveItem,
  onAddMoreFiles,
  isDownloadingZip = false,
}) => {
  // Aggregate stats
  const totalMessages = items.reduce((sum, item) => sum + item.result.stats.totalMessages, 0);
  const totalSubExecs = items.reduce((sum, item) => sum + item.result.stats.subExecutionCount, 0);

  return (
    <div
      id="batch-session-selector"
      className="bg-stone-900 text-white border-b border-stone-800 shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top summary row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-white">
                  Batch Session Queue
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {items.length} {items.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {totalMessages} messages combined &bull; {totalSubExecs} sub-agent sessions merged &bull; Click any file below to inspect
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              id="btn-add-more-zips"
              type="button"
              onClick={onAddMoreFiles}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
              title="Add more .zip exports to this batch"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add More .zip Files</span>
            </button>

            <button
              id="btn-download-all-zip-batch"
              type="button"
              onClick={onDownloadAllZip}
              disabled={isDownloadingZip}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>Download All as .zip ({items.length} .md)</span>
            </button>
          </div>
        </div>

        {/* Horizontal tabs / items list */}
        <div className="pt-2.5 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
          {items.map((item, index) => {
            const isActive = item.id === activeItemId;
            const displayName =
              item.result.session?.title ||
              item.result.session?.name ||
              item.markdownFileName;

            return (
              <div
                key={item.id}
                id={`session-pill-${item.id}`}
                className={`group relative flex items-center rounded-xl border text-xs transition-all duration-150 flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-400/60 text-white font-medium shadow-xs ring-1 ring-amber-400/40'
                    : 'bg-stone-800/80 hover:bg-stone-800 border-stone-700/80 text-stone-300'
                }`}
                onClick={() => onSelectItem(item.id)}
              >
                {/* Selectable tab area */}
                <div className="flex items-center space-x-2 py-2 pl-3 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-mono text-stone-400">
                      #{index + 1}
                    </span>
                    <FileText
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-amber-400' : 'text-stone-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col text-left max-w-[180px] sm:max-w-[220px]">
                    <span className="truncate font-medium text-xs leading-tight">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-stone-400 truncate">
                      {item.result.stats.totalMessages} msgs
                      {item.result.stats.subExecutionCount > 0 &&
                        ` • ${item.result.stats.subExecutionCount} sub-agents`}
                    </span>
                  </div>
                </div>

                {/* Individual download button & close button */}
                <div className="flex items-center space-x-0.5 pr-2 pl-1 border-l border-stone-700/50 my-1.5">
                  <button
                    type="button"
                    title={`Download ${item.markdownFileName}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSingle(item);
                    }}
                    className="p-1 rounded text-stone-400 hover:text-amber-300 hover:bg-stone-700/60 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  {items.length > 1 && (
                    <button
                      type="button"
                      title="Remove from batch"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-stone-700/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
