import {
  KiroSessionMetadata,
  NormalizedMessage,
  ConversionOptions,
} from '../types/kiro';

function formatTimestamp(d: Date | null, format: ConversionOptions['timestampFormat']): string {
  if (!d) return '';
  if (format === 'none') return '';
  if (format === 'iso') {
    return d.toISOString();
  }
  // Local readable: e.g. "May 12, 2025, 10:15:30 AM UTC"
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

function escapeMarkdown(text: string): string {
  // Only escape if necessary for inline titles
  return text.replace(/([\\`*_{}[\]()#+-.!])/g, '\\$1');
}

/**
 * Generate a single comprehensive markdown document from normalized messages and metadata
 */
export function generateMarkdown(
  messages: NormalizedMessage[],
  session: KiroSessionMetadata | null,
  options: ConversionOptions
): string {
  const parts: string[] = [];

  // 1. Header / Metadata Section
  if (options.includeMetadataHeader) {
    const title =
      session?.title ||
      session?.name ||
      (messages.find((m) => m.role === 'user')?.text.slice(0, 60).replace(/\n/g, ' ') || 'Kiro IDE Chat Export');

    parts.push(`# ${title.trim()}`);
    parts.push('');

    const metaItems: string[] = [];

    if (session?.sessionId || session?.id) {
      metaItems.push(`- **Session ID:** \`${session.sessionId || session.id}\``);
    }
    if (session?.workspace || session?.workspacePath) {
      metaItems.push(`- **Workspace:** \`${session.workspace || session.workspacePath}\``);
    }
    if (session?.model) {
      metaItems.push(`- **Model:** \`${session.model}\``);
    }
    if (session?.createdAt) {
      const createdDate = new Date(session.createdAt);
      if (!isNaN(createdDate.getTime())) {
        metaItems.push(`- **Session Created:** ${createdDate.toLocaleString()}`);
      }
    }

    // Message counts
    const userMsgCount = messages.filter((m) => m.role === 'user').length;
    const asstMsgCount = messages.filter((m) => m.role === 'assistant' || m.role === 'subagent').length;
    const subExecIds = new Set(messages.filter((m) => m.source === 'sub-execution').map((m) => m.subExecutionId).filter(Boolean));

    metaItems.push(`- **Total Messages:** ${messages.length} (${userMsgCount} user, ${asstMsgCount} assistant)`);
    if (subExecIds.size > 0) {
      metaItems.push(`- **Sub-Agent Executions:** ${subExecIds.size} integrated`);
    }

    if (metaItems.length > 0) {
      parts.push(`> **Session Metadata**`);
      parts.push(metaItems.join('\n'));
      parts.push('');
    }

    parts.push('---');
    parts.push('');
  }

  // 2. Optional Table of Contents (for long conversations)
  if (options.includeTableOfContents && messages.length > 6) {
    parts.push('## Table of Contents');
    let userMsgNum = 1;
    for (const msg of messages) {
      if (msg.role === 'user') {
        const snippet = msg.text.trim().slice(0, 45).replace(/[#*`[\]]/g, '') || `User Prompt ${userMsgNum}`;
        const anchor = `user-prompt-${userMsgNum}`;
        parts.push(`- [Prompt ${userMsgNum}: ${snippet}](#${anchor})`);
        userMsgNum++;
      }
    }
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  // 3. Chronological Conversation Messages
  let userTurnCount = 1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const timeStr = formatTimestamp(msg.timestamp, options.timestampFormat);
    const timeBadge = timeStr ? ` *(${timeStr})*` : '';

    // Message Header
    if (msg.role === 'user') {
      const anchorId = `user-prompt-${userTurnCount}`;
      parts.push(`### <a id="${anchorId}"></a>👤 User${timeBadge}`);
      userTurnCount++;
    } else if (msg.role === 'system') {
      parts.push(`### ⚙️ System${timeBadge}`);
    } else if (msg.role === 'tool') {
      parts.push(`### 🛠️ Tool Result${timeBadge}`);
    } else if (msg.source === 'sub-execution') {
      const subLabel = msg.subExecutionName || msg.subExecutionId || 'Sub-Agent';
      parts.push(`### 🤖 Assistant [Sub-Agent: \`${subLabel}\`]${timeBadge}`);
    } else {
      parts.push(`### 🤖 Assistant${timeBadge}`);
    }

    // Sub-execution context badge
    if (options.subExecutionBadges && msg.source === 'sub-execution') {
      const subId = msg.subExecutionId || 'sub-execution';
      parts.push(`> ⚡ *Executed via Sub-Agent: \`${subId}\`*`);
      parts.push('');
    }

    // Thinking / reasoning block
    if (options.includeThinking && msg.thinking) {
      if (options.collapsibleTools) {
        parts.push('<details>');
        parts.push('<summary>💭 <em>Thinking process</em></summary>\n');
        parts.push(`> ${msg.thinking.trim().replace(/\n/g, '\n> ')}`);
        parts.push('\n</details>\n');
      } else {
        parts.push(`> 💭 **Thinking:**`);
        parts.push(`> ${msg.thinking.trim().replace(/\n/g, '\n> ')}`);
        parts.push('');
      }
    }

    // Main Text content
    if (msg.text && msg.text.trim()) {
      parts.push(msg.text.trim());
      parts.push('');
    }

    // Tool Calls
    if (options.includeToolCalls && msg.toolCalls && msg.toolCalls.length > 0) {
      for (const tc of msg.toolCalls) {
        const toolName = tc.name || 'tool';
        let formattedArgs = '';
        if (typeof tc.input === 'string') {
          formattedArgs = tc.input;
        } else if (tc.input !== undefined && tc.input !== null) {
          formattedArgs = JSON.stringify(tc.input, null, 2);
        }

        if (options.collapsibleTools) {
          parts.push('<details>');
          parts.push(`<summary>🔧 <strong>Tool Call:</strong> <code>${toolName}</code></summary>\n`);
          if (formattedArgs) {
            parts.push('```json');
            parts.push(formattedArgs);
            parts.push('```');
          }
          parts.push('\n</details>\n');
        } else {
          parts.push(`**Tool Call:** \`${toolName}\``);
          if (formattedArgs) {
            parts.push('```json');
            parts.push(formattedArgs);
            parts.push('```');
          }
          parts.push('');
        }
      }
    }

    // Tool Results
    if (options.includeToolCalls && msg.toolResults && msg.toolResults.length > 0) {
      for (const tr of msg.toolResults) {
        const toolName = tr.name || 'Output';
        const isErr = tr.isError ? ' (Failed)' : '';
        const contentStr = tr.content.trim();

        if (options.collapsibleTools) {
          parts.push('<details>');
          parts.push(`<summary>📋 <strong>Tool Output:</strong> <code>${toolName}</code>${isErr}</summary>\n`);
          // Choose code block language based on content
          const lang = contentStr.startsWith('{') || contentStr.startsWith('[') ? 'json' : '';
          parts.push('```' + lang);
          parts.push(contentStr);
          parts.push('```');
          parts.push('\n</details>\n');
        } else {
          parts.push(`**Tool Output (\`${toolName}\`):**`);
          parts.push('```');
          parts.push(contentStr);
          parts.push('```');
          parts.push('');
        }
      }
    }

    // Divider between turns
    parts.push('---');
    parts.push('');
  }

  // 4. Document Footer
  parts.push('');
  parts.push(`*Exported using Kiro Chat to Markdown Converter on ${new Date().toLocaleDateString()}*`);

  return parts.join('\n');
}
