import React, { useRef, useState } from 'react';
import { UploadCloud, FolderArchive, Sparkles, FolderUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onZipUpload?: (file: File) => void;
  onZipsUpload: (files: File[]) => void;
  onFilesUpload: (files: FileList | File[]) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
  processingStatusText?: string | null;
  error: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onZipUpload,
  onZipsUpload,
  onFilesUpload,
  onLoadSample,
  isProcessing,
  processingStatusText,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const zipFiles = files.filter((f) => f.name.toLowerCase().endsWith('.zip'));

      if (zipFiles.length > 0) {
        onZipsUpload(zipFiles);
      } else {
        onFilesUpload(files);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const zipFiles = files.filter((f) => f.name.toLowerCase().endsWith('.zip'));

      if (zipFiles.length > 0) {
        onZipsUpload(zipFiles);
      } else {
        onFilesUpload(files);
      }
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Upload card container */}
      <div
        id="upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-amber-500 bg-amber-50/50 scale-[1.005]'
            : 'border-stone-300 bg-white hover:border-stone-400 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.jsonl,.json"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          id="file-input-zip"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is standard for folder picking
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          id="folder-input-directory"
        />

        {isProcessing ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-stone-900">
                {processingStatusText || 'Unpacking and Parsing Kiro Export...'}
              </h3>
              <p className="text-sm text-stone-500">
                Merging messages.jsonl, session.json, and all sub-executions in chronological order
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            {/* Title & Instructions */}
            <div className="max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 mb-1">
                <span>Single or Batch Conversion</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Upload Kiro IDE Chat Export(s)
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Drag and drop one or <span className="font-semibold text-stone-900">multiple .zip exports</span> at once, or click to browse. Each archive is converted into a separate, clean Markdown file, and all output files can be downloaded together in a single zip archive.
              </p>
            </div>

            {/* Error Message if any */}
            {error && (
              <div
                id="upload-error-alert"
                className="max-w-md mx-auto p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5 text-left"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-xs uppercase tracking-wider text-red-800">Error Parsing Export</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="btn-choose-zip-file"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <span className="whitespace-nowrap">Choose .zip File(s)</span>
              </button>

              <button
                id="btn-choose-folder"
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-sm font-medium transition-colors cursor-pointer"
                title="If you already extracted the folder"
              >
                <FolderUp className="w-4 h-4 text-stone-500" />
                <span className="whitespace-nowrap">Select Unzipped Folder</span>
              </button>
            </div>

            {/* Sample Button */}
            <div className="pt-4 border-t border-stone-100 max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-stone-500">
              <span>Don't have an export handy right now?</span>
              <button
                id="btn-try-sample-upload"
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center space-x-1 font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Kiro Export</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feature Explanations / Structure Info */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              All Sub-Chats Combined
            </h4>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Eliminates nested folders. Sub-agent messages in <code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded">sub-executions/</code> are merged into the main transcript.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              Strict Chronological Order
            </h4>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Every user prompt, assistant reasoning step, tool call, and sub-execution is interleaved by exact timestamp.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
              100% Client-Side & Private
            </h4>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Your export zip is unpacked and converted entirely in your browser. No files or chat history ever leave your device.
          </p>
        </div>
      </div>
    </div>
  );
};
