export interface KiroSessionMetadata {
  sessionId?: string;
  id?: string;
  title?: string;
  name?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  workspace?: string;
  workspacePath?: string;
  model?: string;
  description?: string;
  [key: string]: any;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'subagent';

export interface ToolCallItem {
  id?: string;
  name: string;
  input?: any;
}

export interface ToolResultItem {
  id?: string;
  name?: string;
  content: string;
  isError?: boolean;
}

export interface NormalizedMessage {
  id: string;
  source: 'main' | 'sub-execution';
  subExecutionId?: string;
  subExecutionName?: string;
  fileOrigin: string;
  role: MessageRole;
  timestamp: Date | null;
  timestampRaw?: string;
  text: string;
  thinking?: string;
  toolCalls?: ToolCallItem[];
  toolResults?: ToolResultItem[];
  lineIndex: number;
  raw?: any;
}

export interface ConversionOptions {
  includeToolCalls: boolean;
  collapsibleTools: boolean;
  includeThinking: boolean;
  subExecutionBadges: boolean;
  timestampFormat: 'local' | 'iso' | 'relative' | 'none';
  includeMetadataHeader: boolean;
  includeTableOfContents: boolean;
}

export interface ConversionResult {
  session: KiroSessionMetadata | null;
  messages: NormalizedMessage[];
  markdown: string;
  filesProcessed: {
    name: string;
    type: 'main' | 'sub-execution' | 'session' | 'other';
    messageCount: number;
    sizeBytes: number;
  }[];
  stats: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    subExecutionCount: number;
    subExecutionMessages: number;
    toolCallCount: number;
    startTime: Date | null;
    endTime: Date | null;
  };
}

export interface BatchConversionItem {
  id: string;
  sourceFileName: string;
  markdownFileName: string;
  result: ConversionResult;
}
