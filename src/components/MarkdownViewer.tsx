import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import {
  FileText,
  Code2,
  ListTree,
  Search,
  User,
  Bot,
  Zap,
  Terminal,
  Clock,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ConversionResult, NormalizedMessage } from '../types/kiro';

interface MarkdownViewerProps {
  result: ConversionResult;
}

type ActiveTab = 'preview' | 'raw' | 'timeline';

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'main' | 'sub-execution'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'assistant'>('all');

  // Configure marked safely
  const renderedHtml = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(result.markdown) as string;
    } catch (e) {
      console.error('Error parsing markdown with marked:', e);
      return `<pre class="whitespace-pre-wrap">${result.markdown}</pre>`;
    }
  }, [result.markdown]);

  // Filter messages for timeline
  const filteredMessages = useMemo(() => {
    return result.messages.filter((msg) => {
      if (filterSource !== 'all' && msg.source !== filterSource) return false;
      if (filterRole === 'user' && msg.role !== 'user') return false;
      if (filterRole === 'assistant' && msg.role !== 'assistant' && msg.role !== 'subagent') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = msg.text.toLowerCase().includes(query);
        const subIdMatch = msg.subExecutionId?.toLowerCase().includes(query);
        const toolMatch = msg.toolCalls?.some((tc) => tc.name.toLowerCase().includes(query));
        return textMatch || subIdMatch || toolMatch;
      }

      return true;
    });
  }, [result.messages, filterSource, filterRole, searchQuery]);

  const rawLineCount = useMemo(() => result.markdown.split('\n').length, [result.markdown]);
  const rawWordCount = useMemo(
    () => result.markdown.trim().split(/\s+/).filter(Boolean).length,
    [result.markdown]
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        {/* Left Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-stone-100 rounded-xl w-fit">
          <button
            id="tab-preview-btn"
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Document Preview</span>
          </button>

          <button
            id="tab-raw-btn"
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Raw Markdown</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700">
              {rawLineCount} lines
            </span>
          </button>

          <button
            id="tab-timeline-btn"
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Chronological Flow</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700">
              {result.messages.length}
            </span>
          </button>
        </div>

        {/* Right Search Input (active for preview & timeline) */}
        {activeTab !== 'raw' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-filter-input"
              type="text"
              placeholder="Search conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400"
            />
          </div>
        )}
      </div>

      {/* TAB 1: Rendered Markdown Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div
            id="rendered-markdown-container"
            className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto"
          >
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: Raw Markdown Editor/Viewer */}
      {activeTab === 'raw' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Standard GitHub-Flavored Markdown (GFM)</span>
            <div className="flex items-center space-x-3">
              <span>{rawWordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>{result.markdown.length.toLocaleString()} characters</span>
              <span>•</span>
              <span>{rawLineCount.toLocaleString()} lines</span>
            </div>
          </div>

          <div className="relative bg-stone-900 text-stone-100 rounded-2xl p-4 sm:p-6 border border-stone-800 shadow-md">
            <pre className="font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-[75vh] whitespace-pre-wrap selection:bg-amber-400/30 selection:text-amber-100">
              <code>{result.markdown}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: Chronological Flow & Message Cards */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-stone-600">Source:</span>
              <button
                onClick={() => setFilterSource('all')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  filterSource === 'all' ? 'bg-stone-900 text-white font-semibold' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Sources ({result.messages.length})
              </button>
              <button
                onClick={() => setFilterSource('main')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  filterSource === 'main' ? 'bg-stone-900 text-white font-semibold' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Main Chat Only ({result.messages.filter((m) => m.source === 'main').length})
              </button>
              <button
                onClick={() => setFilterSource('sub-execution')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  filterSource === 'sub-execution' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Sub-Executions ({result.stats.subExecutionMessages})
              </button>
            </div>

            <div className="text-stone-500">
              Showing {filteredMessages.length} of {result.messages.length} sorted messages
            </div>
          </div>

          {/* Chronological List of Messages */}
          <div className="space-y-3">
            {filteredMessages.map((msg, idx) => (
              <MessageTimelineCard key={msg.id || idx} message={msg} index={idx + 1} />
            ))}

            {filteredMessages.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-500 text-sm">
                No messages match the current filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface MessageTimelineCardProps {
  message: NormalizedMessage;
  index: number;
}

const MessageTimelineCard: React.FC<MessageTimelineCardProps> = ({ message, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === 'user';
  const isSubAgent = message.source === 'sub-execution';

  return (
    <div
      id={`timeline-card-${message.id}`}
      className={`rounded-xl border p-4 transition-all ${
        isUser
          ? 'bg-white border-stone-200 shadow-xs'
          : isSubAgent
          ? 'bg-amber-50/40 border-amber-200 shadow-xs'
          : 'bg-stone-50 border-stone-200'
      }`}
    >
      {/* Top Header info */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          {isUser ? (
            <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
          ) : isSubAgent ? (
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
              <Zap className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-stone-700 text-white flex items-center justify-center text-xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-stone-900">
              {isUser ? 'User' : isSubAgent ? 'Sub-Agent' : 'Assistant'}
            </span>
            <span className="text-[11px] text-stone-400 font-mono">#{index}</span>
          </div>

          {/* Sub execution tag */}
          {isSubAgent && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>{message.subExecutionName || message.subExecutionId?.slice(0, 8)}</span>
            </span>
          )}

          {message.toolCalls && message.toolCalls.length > 0 && (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-200 text-stone-700">
              <Terminal className="w-2.5 h-2.5" />
              <span>{message.toolCalls.length} tool</span>
            </span>
          )}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <div className="flex items-center space-x-1 text-[11px] text-stone-500 font-mono">
            <Clock className="w-3 h-3 text-stone-400" />
            <span>{message.timestamp.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="text-xs sm:text-sm text-stone-800 leading-relaxed space-y-2">
        {message.thinking && (
          <div className="p-2.5 bg-stone-100 rounded-lg text-stone-600 text-xs italic border-l-2 border-stone-400">
            <span className="font-semibold not-italic block mb-0.5">Thinking:</span>
            {message.thinking}
          </div>
        )}

        {message.text && (
          <div className="whitespace-pre-wrap break-words">
            {isExpanded || message.text.length < 350
              ? message.text
              : `${message.text.slice(0, 350)}...`}
          </div>
        )}

        {message.text && message.text.length >= 350 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center space-x-1 cursor-pointer"
          >
            <span>{isExpanded ? 'Show less' : 'Show full text'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {message.toolCalls.map((tc, idx) => (
              <div
                key={idx}
                className="bg-stone-900 text-stone-200 rounded-lg p-2.5 text-xs font-mono overflow-x-auto"
              >
                <div className="text-amber-400 font-semibold mb-1">
                  🔧 Tool: {tc.name}
                </div>
                {tc.input && (
                  <pre className="text-[11px] text-stone-300">
                    {typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
