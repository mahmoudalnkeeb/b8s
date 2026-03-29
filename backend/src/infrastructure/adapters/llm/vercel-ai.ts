import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import {
  generateText,
  streamText,
  LanguageModel,
  ToolSet,
  dynamicTool,
  ProviderMetadata,
  ModelMessage,
} from 'ai';
import { JSONSchema7 } from 'json-schema';
import { z } from 'zod';
import { ILLMProvider } from '../../../domain/ports/llm-provider';
import { IMessage, IToolDefinition, IToolCall, MessageRole } from '../../../domain/models';
import { LLMProviderError, QuotaExceededError } from '../../../domain/errors';
import { env } from '../../loaders/env';
import { logger } from '../../utils/logger';
import { PromptCache } from '../../utils/prompt-cache';
import { applyMessageWindow } from '../../utils/message-window';
import { createDeepSeek } from '@ai-sdk/deepseek';

interface JsonSchemaNode {
  type?: string | undefined;
  properties?: Record<string, JsonSchemaNode> | undefined;
  items?: JsonSchemaNode | undefined;
  required?: string[] | undefined;
  description?: string | undefined;
  [key: string]: unknown;
}

interface DeepSeekToolPayload {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: JsonSchemaNode | undefined;
  };
}

interface QuotaErrorLike {
  statusCode?: number;
  message?: string;
  lastError?: { statusCode?: number };
  reason?: string;
  errors?: Array<{ statusCode?: number; message?: string }>;
}

interface MappedToolResultContent {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  output: { type: 'json'; value: unknown };
}

interface MappedToolCallContent {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  providerOptions?: { google?: { thoughtSignature?: string } };
}

interface MappedTextContent {
  type: 'text';
  text: string;
  providerOptions?: { google?: { thoughtSignature?: string } };
}

type MappedAssistantContent = MappedTextContent | MappedToolCallContent;

interface MappedUserMessage {
  role: 'user';
  content: string;
}

interface MappedAssistantMessage {
  role: 'assistant';
  content: MappedAssistantContent[];
  providerOptions?: { google?: { thoughtSignature?: string } };
}

interface MappedToolMessage {
  role: 'tool';
  content: MappedToolResultContent[];
  providerOptions?: { google?: { thoughtSignature?: string } };
}

type MappedMessage = MappedUserMessage | MappedAssistantMessage | MappedToolMessage;

interface GenerateResponse {
  content: string;
  toolCalls?: IToolCall[];
  thoughtSignature?: string;
  usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Recursively walks a JSON Schema object and ensures every object-typed
 * node has an explicit `type: "object"`. The @ai-sdk/deepseek serializer
 * sometimes drops or nullifies the `type` field, causing DeepSeek to reject
 * requests with: "schema must be a JSON Schema of 'type: "object"', got 'type: null'"
 */
function sanitizeToolSchema(schema: JsonSchemaNode | undefined): JsonSchemaNode | undefined {
  if (!schema || typeof schema !== 'object') return schema;

  const fixed: JsonSchemaNode = { ...schema };

  // If type is missing, null, or not a string, default to 'object'
  if (!fixed.type || typeof fixed.type !== 'string') {
    fixed.type = 'object';
  }

  // Recursively fix nested properties
  if (fixed.properties && typeof fixed.properties === 'object') {
    const props: Record<string, JsonSchemaNode> = {};
    for (const [key, val] of Object.entries(fixed.properties)) {
      const sanitized = sanitizeToolSchema(val);
      if (sanitized) props[key] = sanitized;
    }
    fixed.properties = props;
  }

  // Recursively fix array items
  if (fixed.items) {
    fixed.items = sanitizeToolSchema(fixed.items);
  }

  return fixed;
}

/**
 * A custom fetch wrapper that intercepts outgoing requests to DeepSeek and
 * sanitizes any tool/function schemas in the request body before they are sent.
 * This is the most reliable fix because it operates at the HTTP layer,
 * after all SDK serialization has occurred.
 */
function createSanitizingFetch(baseFetch: typeof fetch = globalThis.fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (init?.body && typeof init.body === 'string') {
      try {
        const body: { tools?: DeepSeekToolPayload[] } = JSON.parse(init.body);

        if (Array.isArray(body.tools)) {
          let modified = false;

          body.tools = body.tools.map((t) => {
            // DeepSeek uses { type: 'function', function: { name, description, parameters } }
            if (t?.function?.parameters) {
              const original = JSON.stringify(t.function.parameters);
              const sanitized = sanitizeToolSchema(t.function.parameters);
              t.function.parameters = sanitized ?? t.function.parameters;
              if (JSON.stringify(t.function.parameters) !== original) modified = true;
            }
            return t;
          });

          if (modified) {
            logger.debug('Sanitized tool schemas in outgoing DeepSeek request');
            init = { ...init, body: JSON.stringify(body) };
          }
        }
      } catch {
        // Not JSON or unexpected shape — pass through unchanged
      }
    }

    return baseFetch(input, init);
  };
}

function getProviderThoughtSignature(metadata: ProviderMetadata | undefined): string | undefined {
  if (!metadata) return undefined;
  const google = metadata['google'] as { thoughtSignature?: string } | undefined;
  return google?.thoughtSignature;
}

function isQuotaError(error: unknown): boolean {
  const err = error as QuotaErrorLike;
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = errorMessage + ' ' + JSON.stringify(error);

  return (
    err.statusCode === 429 ||
    errorString.includes('Quota exceeded') ||
    errorString.includes('RESOURCE_EXHAUSTED') ||
    err.lastError?.statusCode === 429 ||
    err.reason === 'maxRetriesExceeded' ||
    (err.errors !== undefined &&
      err.errors.some(
        (e) =>
          e.statusCode === 429 ||
          e.message?.includes('Quota exceeded') ||
          e.message?.includes('RESOURCE_EXHAUSTED'),
      ))
  );
}

export class VercelAiAdapter implements ILLMProvider {
  private tools: IToolDefinition[] = [];
  private provider: LanguageModel;

  /**
   * Shared prompt cache across all adapter instances.
   * Caches full LLM responses for identical prompts (non-streaming only).
   * TTL: 5 minutes (matches DeepSeek's server-side cache window).
   */
  private static promptCache = new PromptCache<GenerateResponse>(200, 5 * 60 * 1000);

  private static requestCount = 0;
  private static readonly STATS_LOG_INTERVAL = 50; // Log cache stats every 50 requests

  constructor(config: {
    googleApiKey?: string;
    ollamaUrl?: string;
    useProvider: 'google' | 'deepseek' | 'ollama';
  }) {
    if (config.useProvider === 'google') {
      if (!config.googleApiKey)
        throw new LLMProviderError('Google API Key required', 'MISSING_CONFIG');

      logger.debug('Initializing VercelAiAdapter with Google provider', {
        hasKey: !!config.googleApiKey,
        keyLength: config.googleApiKey.length,
      });

      const googleProvider = createGoogleGenerativeAI({
        apiKey: config.googleApiKey,
      });
      this.provider = googleProvider(env.GENAI_MODEL);
    } else if (config.useProvider === 'deepseek') {
      const deepseekProvider = createDeepSeek({
        apiKey: env.DEEPSEEK_API_KEY || '',
        baseURL: 'https://api.deepseek.com',
        // Intercept fetch at the provider level to sanitize schemas after SDK serialization
        fetch: createSanitizingFetch(),
      });
      this.provider = deepseekProvider(env.DEEPSEEK_MODEL) as unknown as LanguageModel;
    } else {
      const ollamaProvider = createOllama({
        baseURL: config.ollamaUrl || 'http://localhost:11434/api',
      });
      this.provider = ollamaProvider('llama3') as unknown as LanguageModel;
    }
  }

  bindTools(tools: IToolDefinition[]): void {
    this.tools = tools;
  }

  private mapMessages(messages: IMessage[]): ModelMessage[] {
    return messages
      .filter((m) => m.role !== MessageRole.SYSTEM)
      .map((m): MappedMessage | null => {
        const thoughtSignature =
          typeof m.metadata?.['thoughtSignature'] === 'string'
            ? (m.metadata['thoughtSignature'] as string)
            : undefined;
        const providerOptions = thoughtSignature ? { google: { thoughtSignature } } : undefined;

        // --- Tool Result Message ---
        if (m.role === MessageRole.TOOL) {
          let resultData: unknown = m.content;
          try {
            resultData = JSON.parse(m.content);
          } catch {
            // Keep as string if not JSON
          }

          const toolCallId =
            typeof m.metadata?.['toolCallId'] === 'string'
              ? (m.metadata['toolCallId'] as string)
              : 'unknown';
          const toolName =
            typeof m.metadata?.['toolName'] === 'string'
              ? (m.metadata['toolName'] as string)
              : 'unknown';

          const toolMsg: MappedToolMessage = {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId,
                toolName,
                output: { type: 'json', value: resultData },
              },
            ],
          };
          if (providerOptions) toolMsg.providerOptions = providerOptions;
          return toolMsg;
        }

        // --- Assistant Message ---
        if (m.role === MessageRole.ASSISTANT) {
          const hasToolCalls = m.toolCalls && m.toolCalls.length > 0;
          const hasText = m.content && m.content.trim() !== '';

          if (!hasToolCalls && !hasText && !thoughtSignature) {
            return null;
          }

          if (hasToolCalls && m.toolCalls) {
            const content: MappedAssistantContent[] = [];

            content.push({
              type: 'text',
              text: m.content || ' ',
            });

            content.push(
              ...m.toolCalls.map((tc): MappedToolCallContent => {
                const tcThoughtSignature = tc.thoughtSignature || thoughtSignature;
                const tcContent: MappedToolCallContent = {
                  type: 'tool-call',
                  toolCallId: tc.id || 'unknown',
                  toolName: tc.name || 'unknown',
                  input: tc.arguments || {},
                };
                if (tcThoughtSignature) {
                  tcContent.providerOptions = { google: { thoughtSignature: tcThoughtSignature } };
                }
                return tcContent;
              }),
            );

            const assistantMsg: MappedAssistantMessage = {
              role: 'assistant',
              content,
            };
            if (providerOptions) assistantMsg.providerOptions = providerOptions;
            return assistantMsg;
          }

          const textContent: MappedTextContent = {
            type: 'text',
            text: m.content || ' ',
          };
          if (providerOptions) textContent.providerOptions = providerOptions;

          const assistantMsg: MappedAssistantMessage = {
            role: 'assistant',
            content: [textContent],
          };
          if (providerOptions) assistantMsg.providerOptions = providerOptions;
          return assistantMsg;
        }

        // --- User Message ---
        if (m.role === MessageRole.USER) {
          return {
            role: 'user',
            content: m.content || '',
          };
        }

        return null;
      })
      .filter((m): m is MappedMessage => m !== null) as ModelMessage[];
  }

  private mapJsonSchemaToZod(
    schema: JSONSchema7 | undefined,
  ): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const properties = (schema?.properties ?? {}) as Record<string, JSONSchema7>;
    const required: string[] = (schema?.required as string[]) ?? [];
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const [key, value] of Object.entries(properties)) {
      let zodType: z.ZodTypeAny;

      switch (value.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'object':
          zodType = this.mapJsonSchemaToZod(value);
          break;
        case 'array':
          zodType = z.array(z.any());
          break;
        default:
          zodType = z.string(); // Safe default — never emit z.any() which serializes to type: null
      }

      if (value.description) {
        zodType = zodType.describe(value.description);
      }

      if (!required.includes(key)) {
        zodType = zodType.optional();
      }

      shape[key] = zodType;
    }

    return z.object(shape);
  }

  /**
   * Sort tools deterministically by name to maximize prefix cache hits.
   * DeepSeek caches based on prefix matching — if tool order varies between
   * requests, it breaks the prefix and wastes cached KV matrices.
   */
  private sortTools(tools: IToolDefinition[]): IToolDefinition[] {
    return [...tools].sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapTools(toolsOverride?: IToolDefinition[]): ToolSet {
    const toolsToMap = this.sortTools(toolsOverride || this.tools);
    const toolSet: ToolSet = {};
    for (const t of toolsToMap) {
      const zodSchema = this.mapJsonSchemaToZod(t.apiSchema as JSONSchema7 | undefined);

      toolSet[t.name] = dynamicTool({
        description: t.description,
        inputSchema: zodSchema,
        execute: async (args: unknown) => {
          // Execution is handled manually in AgentOrchestratorService.
          return args;
        },
      });
    }
    return toolSet;
  }

  private logCacheStats(): void {
    VercelAiAdapter.requestCount++;
    if (VercelAiAdapter.requestCount % VercelAiAdapter.STATS_LOG_INTERVAL === 0) {
      const stats = VercelAiAdapter.promptCache.getStats();
      logger.info('Prompt cache stats', {
        cacheSize: stats.size,
        hitRate: stats.hitRate,
        hits: stats.hits,
        misses: stats.misses,
        evictions: stats.evictions,
        totalTokensSaved: stats.totalTokensSaved,
      });
    }
  }

  async generateText(
    messages: IMessage[],
    tools?: IToolDefinition[],
    systemInstruction?: string,
  ): Promise<GenerateResponse> {
    // Apply message windowing to reduce tokens
    const windowedMessages = applyMessageWindow(messages);

    // Check application-level cache for identical prompts
    const sortedToolNames = tools ? this.sortTools(tools).map((t) => t.name) : [];
    const cacheKey = PromptCache.generateKey({
      ...(systemInstruction ? { systemInstruction } : {}),
      messages: windowedMessages.map((m) => ({ role: m.role, content: m.content })),
      toolNames: sortedToolNames,
    });

    const cached = VercelAiAdapter.promptCache.get(cacheKey);
    if (cached) {
      this.logCacheStats();
      return cached;
    }

    try {
      const mappedMessages = this.mapMessages(windowedMessages);
      const result = await generateText({
        model: this.provider,
        messages: mappedMessages,
        tools: this.mapTools(tools),
        ...(systemInstruction ? { system: systemInstruction } : {}),
      });

      let thoughtSignature: string | undefined;
      for (const part of result.content) {
        if (part.type === 'text' || part.type === 'tool-call' || part.type === 'tool-result') {
          const ts = getProviderThoughtSignature(part.providerMetadata);
          if (ts) {
            thoughtSignature = ts;
            break;
          }
        }
      }

      const response: GenerateResponse = {
        content: result.text,
        toolCalls: result.toolCalls?.map((tc) => {
          const tcPart = result.content.find(
            (p): p is (typeof result.content)[number] & { type: 'tool-call' } =>
              p.type === 'tool-call' && p.toolCallId === tc.toolCallId,
          );
          const tcTs = tcPart ? getProviderThoughtSignature(tcPart.providerMetadata) : undefined;

          return {
            id: tc.toolCallId,
            name: tc.toolName,
            arguments: tc.input as Record<string, unknown>,
            ...(tcTs || thoughtSignature ? { thoughtSignature: tcTs || thoughtSignature } : {}),
          };
        }),
        ...(thoughtSignature ? { thoughtSignature } : {}),
        ...(result.usage
          ? {
              usage: {
                promptTokens: result.usage.inputTokens || 0,
                completionTokens: result.usage.outputTokens || 0,
              },
            }
          : {}),
      };

      // Cache responses WITHOUT tool calls (tool results vary between requests).
      // Responses with tool calls are part of the agent loop and shouldn't be cached.
      if (!response.toolCalls?.length) {
        VercelAiAdapter.promptCache.set(cacheKey, response);
      }

      this.logCacheStats();
      return response;
    } catch (error: unknown) {
      if (isQuotaError(error)) throw new QuotaExceededError();
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMProviderError(message, 'LLM_GENERATE_ERROR');
    }
  }

  async *streamText(
    messages: IMessage[],
    tools?: IToolDefinition[],
    systemInstruction?: string,
  ): AsyncGenerator<GenerateResponse, void, unknown> {
    // Apply message windowing to reduce tokens
    const windowedMessages = applyMessageWindow(messages);

    this.logCacheStats();

    try {
      const mappedMessages = this.mapMessages(windowedMessages);
      const result = await streamText({
        model: this.provider,
        messages: mappedMessages,
        tools: this.mapTools(tools),
        ...(systemInstruction ? { system: systemInstruction } : {}),
      });

      for await (const part of result.fullStream) {
        const thoughtSignature =
          'providerMetadata' in part
            ? getProviderThoughtSignature(part.providerMetadata)
            : undefined;

        if (thoughtSignature) {
          yield { content: '', thoughtSignature };
        }

        if (part.type === 'text-delta' && part.text) {
          yield { content: part.text };
        } else if (part.type === 'tool-call') {
          const tcThoughtSignature =
            getProviderThoughtSignature(part.providerMetadata) || thoughtSignature;

          yield {
            content: '',
            toolCalls: [
              {
                id: part.toolCallId,
                name: part.toolName,
                arguments: part.input as Record<string, unknown>,
                ...(tcThoughtSignature ? { thoughtSignature: tcThoughtSignature } : {}),
              },
            ],
          };
        } else if (part.type === 'finish') {
          const usage = part.totalUsage;
          yield {
            content: '',
            ...(usage
              ? {
                  usage: {
                    promptTokens: usage.inputTokens || 0,
                    completionTokens: usage.outputTokens || 0,
                  },
                }
              : {}),
          };
        }
      }
    } catch (error: unknown) {
      if (isQuotaError(error)) throw new QuotaExceededError();
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMProviderError(message, 'LLM_STREAM_ERROR');
    }
  }

  /**
   * Clean up resources (prompt cache interval, etc.)
   */
  destroy(): void {
    VercelAiAdapter.promptCache.destroy();
  }
}
