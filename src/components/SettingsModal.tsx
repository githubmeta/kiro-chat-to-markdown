import React from 'react';
import { X, Check } from 'lucide-react';
import { ConversionOptions } from '../types/kiro';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ConversionOptions;
  onChange: (newOptions: ConversionOptions) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChange,
}) => {
  if (!isOpen) return null;

  const updateOption = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div
        id="settings-modal"
        className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Markdown Formatting Options</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options list */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Sub-execution Badges */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className="text-sm font-semibold text-stone-900 block cursor-pointer" htmlFor="toggle-subexec-badge">
                Highlight Sub-Agent Executions
              </label>
              <p className="text-xs text-stone-500 mt-0.5">
                Adds a blockquote badge on messages that originated from <code className="bg-stone-100 px-1 py-0.2 rounded font-mono text-[11px]">sub-executions/</code>.
              </p>
            </div>
            <input
              id="toggle-subexec-badge"
              type="checkbox"
              checked={options.subExecutionBadges}
              onChange={(e) => updateOption('subExecutionBadges', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
            />
          </div>

          <hr className="border-stone-100" />

          {/* Include Tool Executions */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className="text-sm font-semibold text-stone-900 block cursor-pointer" htmlFor="toggle-tool-calls">
                Include Tool Calls & Outputs
              </label>
              <p className="text-xs text-stone-500 mt-0.5">
                Include file reads, bash commands, and tool responses in the transcript.
              </p>
            </div>
            <input
              id="toggle-tool-calls"
              type="checkbox"
              checked={options.includeToolCalls}
              onChange={(e) => updateOption('includeToolCalls', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
            />
          </div>

          {/* Collapsible Tool Calls */}
          {options.includeToolCalls && (
            <div className="flex items-start justify-between gap-3 pl-4 border-l-2 border-amber-200">
              <div>
                <label className="text-sm font-semibold text-stone-900 block cursor-pointer" htmlFor="toggle-collapsible">
                  Collapsible Details Tags (&lt;details&gt;)
                </label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Wrap verbose tool payloads inside collapsible HTML dropdowns for a cleaner reading experience.
                </p>
              </div>
              <input
                id="toggle-collapsible"
                type="checkbox"
                checked={options.collapsibleTools}
                onChange={(e) => updateOption('collapsibleTools', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
              />
            </div>
          )}

          <hr className="border-stone-100" />

          {/* Include Thinking / Reasoning */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className="text-sm font-semibold text-stone-900 block cursor-pointer" htmlFor="toggle-thinking">
                Include AI Thinking & Reasoning
              </label>
              <p className="text-xs text-stone-500 mt-0.5">
                Include internal model thoughts if present in the export.
              </p>
            </div>
            <input
              id="toggle-thinking"
              type="checkbox"
              checked={options.includeThinking}
              onChange={(e) => updateOption('includeThinking', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
            />
          </div>

          <hr className="border-stone-100" />

          {/* Metadata Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className="text-sm font-semibold text-stone-900 block cursor-pointer" htmlFor="toggle-meta-header">
                Include Session Header & Info
              </label>
              <p className="text-xs text-stone-500 mt-0.5">
                Renders document H1 title, workspace, session ID, and message statistics at the top.
              </p>
            </div>
            <input
              id="toggle-meta-header"
              type="checkbox"
              checked={options.includeMetadataHeader}
              onChange={(e) => updateOption('includeMetadataHeader', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
            />
          </div>

          <hr className="border-stone-100" />

          {/* Timestamp formatting */}
          <div>
            <label className="text-sm font-semibold text-stone-900 block mb-1">
              Timestamp Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['local', 'iso', 'none'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => updateOption('timestampFormat', fmt)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                    options.timestampFormat === fmt
                      ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {fmt === 'local' && 'Readable Local'}
                  {fmt === 'iso' && 'ISO-8601 (UTC)'}
                  {fmt === 'none' && 'None (Hidden)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
