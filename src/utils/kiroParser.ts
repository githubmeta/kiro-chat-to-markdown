import JSZip from 'jszip';
import {
  KiroSessionMetadata,
  NormalizedMessage,
  MessageRole,
  ToolCallItem,
  ToolResultItem,
  ConversionOptions,
  ConversionResult,
} from '../types/kiro';
import { generateMarkdown } from './markdownGenerator';

export const defaultConversionOptions: ConversionOptions = {
  includeToolCalls: true,
  collapsibleTools: true,
  includeThinking: true,
  subExecutionBadges: true,
  timestampFormat: 'local',
  includeMetadataHeader: true,
  includeTableOfContents: false,
};

/**
 * Parse any date/timestamp representation into a JavaScript Date object
 */
export function parseTimestamp(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  if (typeof val === 'number') {
    // If it's seconds (10 digits around 1.7e9), convert to ms
    const ms = val < 1e11 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    // Check if numeric string
    if (/^\d{10,13}$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Extract text, thinking, and tool items from versatile content formats
 */
function extractContentComponents(
  rawContent: any,
  item: any
): {
  text: string;
  thinking?: string;
  toolCalls: ToolCallItem[];
  toolResults: ToolResultItem[];
} {
  let text = '';
  let thinking: string | undefined;
  const toolCalls: ToolCallItem[] = [];
  const toolResults: ToolResultItem[] = [];

  // 1. Direct tool_call / tool_use on item
  if (item.tool_calls && Array.isArray(item.tool_calls)) {
    for (const tc of item.tool_calls) {
      toolCalls.push({
        id: tc.id,
        name: tc.function?.name || tc.name || 'tool',
        input: tc.function?.arguments || tc.input || tc.args,
      });
    }
  }

  if (item.tool_call) {
    const tc = item.tool_call;
    toolCalls.push({
      id: tc.id,
      name: tc.function?.name || tc.name || 'tool',
      input: tc.function?.arguments || tc.input || tc.args,
    });
  }

  // 2. Direct string content
  if (typeof rawContent === 'string') {
    text = rawContent;
  } else if (Array.isArray(rawContent)) {
    // Array of blocks (Claude / OpenAI / Kiro style)
    const textParts: string[] = [];
    const thinkingParts: string[] = [];

    for (const block of rawContent) {
      if (!block) continue;
      if (typeof block === 'string') {
        textParts.push(block);
      } else if (typeof block === 'object') {
        const type = block.type || block.kind;

        if (type === 'text') {
          if (block.text) textParts.push(block.text);
          else if (block.content) textParts.push(String(block.content));
        } else if (type === 'thinking' || type === 'thought') {
          if (block.thinking) thinkingParts.push(block.thinking);
          else if (block.text) thinkingParts.push(block.text);
          else if (block.content) thinkingParts.push(String(block.content));
        } else if (type === 'tool_use' || type === 'tool_call') {
          toolCalls.push({
            id: block.id,
            name: block.name || block.tool_name || 'tool',
            input: block.input || block.tool_input || block.args,
          });
        } else if (type === 'tool_result' || type === 'tool_response') {
          let resultContent = '';
          if (typeof block.content === 'string') {
            resultContent = block.content;
          } else if (Array.isArray(block.content)) {
            resultContent = block.content
              .map((c: any) => (typeof c === 'string' ? c : c.text || JSON.stringify(c)))
              .join('\n');
          } else if (block.output !== undefined) {
            resultContent = typeof block.output === 'string' ? block.output : JSON.stringify(block.output, null, 2);
          } else {
            resultContent = JSON.stringify(block);
          }
          toolResults.push({
            id: block.tool_use_id || block.id,
            name: block.name,
            content: resultContent,
            isError: block.is_error || block.isError,
          });
        } else if (block.text) {
          textParts.push(block.text);
        } else if (block.content) {
          textParts.push(typeof block.content === 'string' ? block.content : JSON.stringify(block.content));
        }
      }
    }

    text = textParts.join('\n\n');
    if (thinkingParts.length > 0) {
      thinking = thinkingParts.join('\n\n');
    }
  } else if (typeof rawContent === 'object' && rawContent !== null) {
    if (rawContent.text) {
      text = String(rawContent.text);
    } else if (rawContent.message) {
      text = typeof rawContent.message === 'string' ? rawContent.message : JSON.stringify(rawContent.message, null, 2);
    } else {
      text = JSON.stringify(rawContent, null, 2);
    }
  }

  // Check top-level thinking if present
  if (!thinking && item.thinking) {
    thinking = typeof item.thinking === 'string' ? item.thinking : JSON.stringify(item.thinking, null, 2);
  }
  if (!thinking && item.thought) {
    thinking = typeof item.thought === 'string' ? item.thought : JSON.stringify(item.thought, null, 2);
  }

  return { text, thinking, toolCalls, toolResults };
}

/**
 * Normalize a single line from messages.jsonl or sub-executions/*.jsonl
 */
export function normalizeKiroMessage(
  lineObj: any,
  source: 'main' | 'sub-execution',
  fileOrigin: string,
  lineIndex: number,
  subExecutionId?: string
): NormalizedMessage | null {
  if (!lineObj || typeof lineObj !== 'object') return null;

  // Sometimes wrapped in payload or message property
  const payload = lineObj.payload || lineObj.data || lineObj;
  const messageData = lineObj.message || payload.message || payload;

  // Determine role
  let role: MessageRole = 'assistant';
  const rawRole = (
    messageData.role ||
    payload.role ||
    lineObj.role ||
    lineObj.type ||
    lineObj.eventType ||
    ''
  ).toLowerCase();

  if (rawRole.includes('user') || rawRole === 'human') {
    role = 'user';
  } else if (rawRole.includes('system')) {
    role = 'system';
  } else if (rawRole.includes('tool') || rawRole === 'function') {
    role = 'tool';
  } else if (rawRole.includes('subagent') || rawRole.includes('sub_agent') || rawRole.includes('sub-execution')) {
    role = 'subagent';
  } else {
    role = 'assistant';
  }

  // Determine timestamp
  const rawTimestamp =
    lineObj.timestamp ??
    lineObj.time ??
    lineObj.createdAt ??
    lineObj.created_at ??
    payload.timestamp ??
    payload.createdAt ??
    payload.created_at ??
    messageData.timestamp;

  const timestamp = parseTimestamp(rawTimestamp);

  // Content extraction
  const rawContent =
    messageData.content !== undefined
      ? messageData.content
      : payload.content !== undefined
      ? payload.content
      : lineObj.content !== undefined
      ? lineObj.content
      : lineObj.text !== undefined
      ? lineObj.text
      : payload.text !== undefined
      ? payload.text
      : '';

  const { text, thinking, toolCalls, toolResults } = extractContentComponents(rawContent, {
    ...lineObj,
    ...payload,
    ...messageData,
  });

  // If role is tool, ensure toolResult is registered
  if (role === 'tool' && toolResults.length === 0 && text) {
    toolResults.push({
      id: lineObj.tool_use_id || lineObj.id || payload.tool_use_id,
      name: lineObj.name || payload.name || 'tool',
      content: text,
      isError: lineObj.is_error || payload.is_error,
    });
  }

  // Sub-agent identification
  const resolvedSubId =
    subExecutionId ||
    lineObj.subExecutionId ||
    lineObj.sub_execution_id ||
    payload.subExecutionId ||
    payload.sub_execution_id;

  const subName =
    lineObj.agentName ||
    lineObj.subAgentName ||
    payload.agentName ||
    (resolvedSubId ? resolvedSubId.replace(/\.jsonl$/, '') : undefined);

  // Skip completely empty events if they have no text, tools, or thoughts
  if (!text.trim() && !thinking?.trim() && toolCalls.length === 0 && toolResults.length === 0) {
    // Check if it's an event with a name or type (e.g. system status)
    if (lineObj.type || lineObj.name) {
      return {
        id: lineObj.id || `msg-${fileOrigin}-${lineIndex}`,
        source,
        subExecutionId: resolvedSubId,
        subExecutionName: subName,
        fileOrigin,
        role: 'system',
        timestamp,
        timestampRaw: rawTimestamp ? String(rawTimestamp) : undefined,
        text: `*Event [${lineObj.type || lineObj.name}]*`,
        lineIndex,
        raw: lineObj,
      };
    }
    return null;
  }

  const id =
    lineObj.id ||
    payload.id ||
    messageData.id ||
    `${source}-${fileOrigin.replace(/[^a-zA-Z0-9]/g, '_')}-${lineIndex}`;

  return {
    id,
    source,
    subExecutionId: resolvedSubId,
    subExecutionName: subName,
    fileOrigin,
    role,
    timestamp,
    timestampRaw: rawTimestamp ? String(rawTimestamp) : undefined,
    text,
    thinking,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    lineIndex,
    raw: lineObj,
  };
}

/**
 * Parse a JSONL string into an array of objects
 */
export function parseJsonlLines(jsonlText: string): any[] {
  const lines = jsonlText.split(/\r?\n/);
  const records: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const parsed = JSON.parse(line);
      records.push({ data: parsed, lineIndex: i + 1 });
    } catch {
      // If line is not JSON, try to handle or skip gracefully
      console.warn(`[KiroParser] Skipped malformed JSON on line ${i + 1}`);
    }
  }

  return records;
}

/**
 * Process a set of extracted or uploaded files and build a unified chronological markdown
 */
export function processKiroFiles(
  files: { path: string; content: string; size: number }[],
  options: ConversionOptions = defaultConversionOptions
): ConversionResult {
  let sessionMeta: KiroSessionMetadata | null = null;
  const allMessages: NormalizedMessage[] = [];
  const filesProcessed: ConversionResult['filesProcessed'] = [];

  // Find session.json first
  const sessionFile = files.find((f) => f.path.endsWith('session.json'));
  if (sessionFile) {
    try {
      sessionMeta = JSON.parse(sessionFile.content);
      filesProcessed.push({
        name: sessionFile.path,
        type: 'session',
        messageCount: 0,
        sizeBytes: sessionFile.size,
      });
    } catch (err) {
      console.warn('Could not parse session.json', err);
    }
  }

  // Identify main messages.jsonl
  // Could be "messages.jsonl" or "<uuid>/messages.jsonl"
  const mainFile = files.find(
    (f) =>
      f.path.endsWith('messages.jsonl') &&
      !f.path.includes('sub-executions') &&
      !f.path.includes('sub_executions')
  );

  if (mainFile) {
    const records = parseJsonlLines(mainFile.content);
    let count = 0;
    for (const rec of records) {
      const msg = normalizeKiroMessage(rec.data, 'main', mainFile.path, rec.lineIndex);
      if (msg) {
        allMessages.push(msg);
        count++;
      }
    }
    filesProcessed.push({
      name: mainFile.path,
      type: 'main',
      messageCount: count,
      sizeBytes: mainFile.size,
    });
  }

  // Identify sub-execution files: in "sub-executions/" or with "sub-" in path or any other .jsonl
  const subFiles = files.filter(
    (f) =>
      f.path.endsWith('.jsonl') &&
      f !== mainFile &&
      (f.path.includes('sub-executions') || f.path.includes('sub_executions') || f.path.includes('sub-agent'))
  );

  // Also include any remaining .jsonl files that weren't captured
  const otherJsonlFiles = files.filter(
    (f) => f.path.endsWith('.jsonl') && f !== mainFile && !subFiles.includes(f)
  );

  const subExecutionFiles = [...subFiles, ...otherJsonlFiles];

  for (const subFile of subExecutionFiles) {
    const filename = subFile.path.split('/').pop() || subFile.path;
    const subExecutionId = filename.replace(/\.jsonl$/, '');
    const records = parseJsonlLines(subFile.content);
    let count = 0;

    for (const rec of records) {
      const msg = normalizeKiroMessage(
        rec.data,
        'sub-execution',
        subFile.path,
        rec.lineIndex,
        subExecutionId
      );
      if (msg) {
        allMessages.push(msg);
        count++;
      }
    }

    filesProcessed.push({
      name: subFile.path,
      type: 'sub-execution',
      messageCount: count,
      sizeBytes: subFile.size,
    });
  }

  // Sort messages in chronological order!
  // If timestamps are equal or missing, preserve relative original sequence order
  allMessages.sort((a, b) => {
    const timeA = a.timestamp ? a.timestamp.getTime() : null;
    const timeB = b.timestamp ? b.timestamp.getTime() : null;

    if (timeA !== null && timeB !== null) {
      if (timeA !== timeB) return timeA - timeB;
    } else if (timeA !== null && timeB === null) {
      return -1;
    } else if (timeA === null && timeB !== null) {
      return 1;
    }

    // Secondary sort: main messages take precedence over sub-executions if same millisecond,
    // or sort by fileOrigin and lineIndex
    if (a.source !== b.source) {
      return a.source === 'main' ? -1 : 1;
    }
    return a.lineIndex - b.lineIndex;
  });

  // Calculate stats
  let userCount = 0;
  let assistantCount = 0;
  let toolCallCount = 0;
  let subExecMessageCount = 0;
  const subExecIds = new Set<string>();

  for (const m of allMessages) {
    if (m.role === 'user') userCount++;
    if (m.role === 'assistant' || m.role === 'subagent') assistantCount++;
    if (m.toolCalls) toolCallCount += m.toolCalls.length;
    if (m.source === 'sub-execution') {
      subExecMessageCount++;
      if (m.subExecutionId) subExecIds.add(m.subExecutionId);
    }
  }

  const validTimestamps = allMessages
    .map((m) => m.timestamp?.getTime())
    .filter((t): t is number => typeof t === 'number');

  const startTime = validTimestamps.length > 0 ? new Date(Math.min(...validTimestamps)) : null;
  const endTime = validTimestamps.length > 0 ? new Date(Math.max(...validTimestamps)) : null;

  // Generate markdown output
  const markdown = generateMarkdown(allMessages, sessionMeta, options);

  return {
    session: sessionMeta,
    messages: allMessages,
    markdown,
    filesProcessed,
    stats: {
      totalMessages: allMessages.length,
      userMessages: userCount,
      assistantMessages: assistantCount,
      subExecutionCount: subExecIds.size,
      subExecutionMessages: subExecMessageCount,
      toolCallCount,
      startTime,
      endTime,
    },
  };
}

/**
 * Parse a ZIP file buffer (from FileReader or fetch)
 */
export async function parseKiroZip(
  zipData: ArrayBuffer | Blob,
  options: ConversionOptions = defaultConversionOptions
): Promise<ConversionResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipData);
  const files: { path: string; content: string; size: number }[] = [];

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, file) => {
    if (file.dir) return;
    // We only care about .json and .jsonl files in the archive
    if (relativePath.endsWith('.json') || relativePath.endsWith('.jsonl')) {
      const p = file.async('string').then((content) => {
        files.push({
          path: relativePath,
          content,
          size: content.length,
        });
      });
      filePromises.push(p);
    }
  });

  await Promise.all(filePromises);

  if (files.length === 0) {
    throw new Error('No .json or .jsonl files found in the uploaded zip archive.');
  }

  return processKiroFiles(files, options);
}
