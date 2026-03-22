import { IMessage, MessageRole } from '../../domain/models';
import { logger } from './logger';

interface WindowOptions {
  /** Maximum number of messages to keep (default: 40) */
  maxMessages?: number;
  /** Maximum estimated token count for the message window (default: 8000) */
  maxTokens?: number;
  /** Always preserve the first N user messages for context (default: 1) */
  preserveFirstUserMessages?: number;
}

const DEFAULT_OPTIONS: Required<WindowOptions> = {
  maxMessages: 40,
  maxTokens: 8000,
  preserveFirstUserMessages: 1,
};

/**
 * Rough token estimation (~4 chars per token for English text).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessageTokens(msg: IMessage): number {
  let tokens = estimateTokens(msg.content);
  // Account for role and metadata overhead
  tokens += 4; // role tokens
  if (msg.toolCalls) {
    tokens += estimateTokens(JSON.stringify(msg.toolCalls));
  }
  if (msg.metadata) {
    tokens += estimateTokens(JSON.stringify(msg.metadata));
  }
  return tokens;
}

/**
 * Applies a sliding window to conversation messages to limit token usage.
 *
 * Strategy:
 * 1. Always preserves the first N user messages (for conversation context)
 * 2. Always preserves tool call/result pairs (breaking them causes errors)
 * 3. Trims from the middle, keeping the most recent messages
 * 4. This maximizes DeepSeek's prefix cache hits because:
 *    - The system prompt (sent separately) is always the first element = stable prefix
 *    - Recent messages at the end naturally change = no wasted cache computation
 *
 * By reducing total tokens sent, we also reduce costs for the non-cached portion
 * of each request.
 */
export function applyMessageWindow(messages: IMessage[], options?: WindowOptions): IMessage[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (messages.length <= opts.maxMessages) {
    const totalTokens = messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
    if (totalTokens <= opts.maxTokens) {
      return messages; // No trimming needed
    }
  }

  // Identify the first N user messages to preserve
  const preservedIndices = new Set<number>();
  let userCount = 0;
  for (let i = 0; i < messages.length && userCount < opts.preserveFirstUserMessages; i++) {
    const msg = messages[i];
    if (msg && msg.role === MessageRole.USER) {
      preservedIndices.add(i);
      userCount++;
    }
  }

  // Build the window: preserved messages + most recent messages
  const recentStartIndex = Math.max(0, messages.length - opts.maxMessages);

  const result: IMessage[] = [];
  const addedIndices = new Set<number>();

  // 1. Add preserved first messages
  for (const idx of preservedIndices) {
    const msg = messages[idx];
    if (idx < recentStartIndex && msg) {
      result.push(msg);
      addedIndices.add(idx);
    }
  }

  // 2. Add recent messages, ensuring tool call/result pairs are intact
  let startIdx = recentStartIndex;

  // If we're starting in the middle of a tool interaction, back up to include the full pair
  while (startIdx > 0 && messages[startIdx]?.role === MessageRole.TOOL) {
    startIdx--;
  }

  for (let i = startIdx; i < messages.length; i++) {
    const msg = messages[i];
    if (!addedIndices.has(i) && msg) {
      result.push(msg);
      addedIndices.add(i);
    }
  }

  // 3. Now enforce token limit by trimming from the front (after preserved messages)
  let totalTokens = result.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
  const preservedCount = preservedIndices.size;

  while (totalTokens > opts.maxTokens && result.length > preservedCount + 2) {
    // Remove from after the preserved messages
    const removeIdx = preservedCount;
    const removed = result.splice(removeIdx, 1)[0];
    if (!removed) break;
    totalTokens -= estimateMessageTokens(removed);

    // If we removed an assistant message with tool calls, also remove the following tool results
    if (removed.role === MessageRole.ASSISTANT && removed.toolCalls?.length) {
      while (result.length > removeIdx && result[removeIdx]?.role === MessageRole.TOOL) {
        const toolMsg = result.splice(removeIdx, 1)[0];
        if (toolMsg) {
          totalTokens -= estimateMessageTokens(toolMsg);
        }
      }
    }
  }

  const trimmed = messages.length - result.length;
  if (trimmed > 0) {
    logger.info('Message window applied', {
      originalCount: messages.length,
      windowedCount: result.length,
      trimmedMessages: trimmed,
      estimatedTokens: totalTokens,
    });
  }

  return result;
}
