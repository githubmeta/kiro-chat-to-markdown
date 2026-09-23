import React, { useState } from 'react';
import { Download, Copy, Check, SlidersHorizontal, Terminal, Users, Calendar, Layers, Archive } from 'lucide-react';
import { ConversionResult } from '../types/kiro';
import confetti from 'canvas-confetti';

interface SessionStatsBarProps {
  result: ConversionResult;
  batchCount?: number;
  onOpenSettings: () => void;
  onDownload: () => void;
  onDownloadAllZip?: () => void;
}

export const SessionStatsBar: React.FC<SessionStatsBarProps> = ({
  result,
  batchCount = 1,
  onOpenSettings,
  onDownload,
  onDownloadAllZip,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = result.markdown;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadWithConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Confetti is purely decorative
    }
    onDownload();
  };

  const { stats, session } = result;
  const title =
    session?.title ||
    session?.name ||
    (result.messages.find((m) => m.role === 'user')?.text.slice(0, 50) || 'Kiro Chat Session');

  return (
    <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Session metadata & badges */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-900 text-amber-400 font-mono">
              KIRO EXPORT
            </span>
            {session?.sessionId && (
              <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                ID: {session.sessionId.slice(0, 8)}...
              </span>
            )}
            {session?.workspace && (
              <span className="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium">
                📁 {session.workspace}
              </span>
            )}
            {session?.model && (
              <span className="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium">
                ⚡ {session.model}
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-stone-900 line-clamp-1">
            {title}
          </h2>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
            <span className="inline-flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span>
                <strong>{stats.totalMessages}</strong> messages ({stats.userMessages} user, {stats.assistantMessages} asst)
              </span>
            </span>

            <span className="text-stone-300">•</span>

            <span className="inline-flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>
                <strong>{stats.subExecutionCount}</strong> sub-executions ({stats.subExecutionMessages} msgs)
              </span>
            </span>

            {stats.toolCallCount > 0 && (
              <>
                <span className="text-stone-300">•</span>
                <span className="inline-flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    <strong>{stats.toolCallCount}</strong> tool actions
                  </span>
                </span>
              </>
            )}

            {stats.startTime && (
              <>
                <span className="text-stone-300">•</span>
                <span className="inline-flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>{stats.startTime.toLocaleDateString()}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            id="btn-settings-stats-bar"
            onClick={onOpenSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Options</span>
          </button>

          <button
            id="btn-copy-markdown"
            onClick={handleCopy}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="whitespace-nowrap">Copied Markdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span className="whitespace-nowrap">Copy Markdown</span>
              </>
            )}
          </button>

          <button
            id="btn-download-markdown"
            onClick={handleDownloadWithConfetti}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="whitespace-nowrap">
              {batchCount > 1 ? 'Download Current .md' : 'Export .md File'}
            </span>
          </button>

          {batchCount > 1 && onDownloadAllZip && (
            <button
              id="btn-download-batch-zip-stats"
              onClick={onDownloadAllZip}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Download All ({batchCount} .md in .zip)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
