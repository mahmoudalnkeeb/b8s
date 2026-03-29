import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import { generateText, streamText, LanguageModel, ToolSet, tool } from 'ai';
import { z } from 'zod';
import { ILLMProvider } from '../../../domain/ports/llm-provider';
import { IMessage, IToolDefinition, IToolCall, MessageRole } from '../../../domain/models';
import { LLMProviderError, QuotaExceededError } from '../../../domain/errors';
import { env } from '../../loaders/env';
import { logger } from '../../utils/logger';
import { PromptCache } from '../../utils/prompt-cache';
import { applyMessageWindow } from '../../utils/message-window';
import { createDeepSeek } from '@ai-sdk/deepseek';

/**
 * Recursively walks a JSON Schema object and ensures every object-typed
 * node has an explicit `type: "object"`. The @ai-sdk/deepseek serializer
 * sometimes drops or nullifies the `type` field, causing DeepSeek to reject
 * requests with: "schema must be a JSON Schema of 'type: "object"', got 'type: null'"
 */
function sanitizeToolSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;

  const fixed: any = { ...schema };

  // If type is missing, null, or not a string, default to 'object'
  if (!fixed.type || typeof fixed.type !== 'string') {
    fixed.type = 'object';
  }

  // Recursively fix nested properties
  if (fixed.properties && typeof fixed.properties === 'object') {
    fixed.properties = Object.fromEntries(
      Object.entries(fixed.properties).map(([key, val]) => [key, sanitizeToolSchema(val)]),
    );
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
        const body = JSON.parse(init.body);

        if (Array.isArray(body.tools)) {
          let modified = false;

          body.tools = body.tools.map((t: any) => {
            // DeepSeek uses { type: 'function', function: { name, description, parameters } }
            if (t?.function?.parameters) {
              const original = JSON.stringify(t.function.parameters);
              t.function.parameters = sanitizeToolSchema(t.function.parameters);
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

export class VercelAiAdapter implements ILLMProvider {
  private tools: IToolDefinition[] = [];
  private provider: LanguageModel;

  /**
   * Shared prompt cache across all adapter instances.
   * Caches full LLM responses for identical prompts (non-streaming only).
   * TTL: 5 minutes (matches DeepSeek's server-side cache window).
   */
  private static promptCache = new PromptCache<{
    content: string;
    toolCalls?: IToolCall[];
    thoughtSignature?: string;
  }>(200, 5 * 60 * 1000);

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

  private mapMessages(messages: IMessage[]): any[] {
    return messages
      .filter((m) => m.role !== MessageRole.SYSTEM)
      .map((m) => {
        const thoughtSignature = m.metadata?.['thoughtSignature'] as string | undefined;
        const providerOptions = thoughtSignature ? { google: { thoughtSignature } } : undefined;

        // --- Tool Result Message ---
        if (m.role === MessageRole.TOOL) {
          let resultData = m.content;
          try {
            resultData = JSON.parse(m.content);
          } catch {
            // Keep as string if not JSON
          }

          const toolCallId = (m.metadata?.['toolCallId'] as string) || 'unknown';
          const toolName = (m.metadata?.['toolName'] as string) || 'unknown';

          return {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId,
                toolName,
                output: { type: 'json', value: resultData },
              },
            ],
            providerOptions,
          };
        }

        // --- Assistant Message ---
        if (m.role === MessageRole.ASSISTANT) {
          const hasToolCalls = m.toolCalls && m.toolCalls.length > 0;
          const hasText = m.content && m.content.trim() !== '';

          if (!hasToolCalls && !hasText && !thoughtSignature) {
            return null;
          }

          if (hasToolCalls) {
            const content: any[] = [];

            content.push({
              type: 'text',
              text: m.content || ' ',
            });

            content.push(
              ...m.toolCalls!.map((tc) => {
                const tcThoughtSignature = tc.thoughtSignature || thoughtSignature;
                return {
                  type: 'tool-call',
                  toolCallId: tc.id || 'unknown',
                  toolName: tc.name || 'unknown',
                  input: tc.arguments || {},
                  providerOptions: tcThoughtSignature
                    ? { google: { thoughtSignature: tcThoughtSignature } }
                    : undefined,
                };
              }),
            );

            return {
              role: 'assistant',
              content,
              providerOptions,
            };
          }

          return {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: m.content || ' ',
                providerOptions,
              },
            ],
            providerOptions,
          };
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
      .filter(Boolean);
  }

  private mapJsonSchemaToZod(schema: any): z.ZodObject<any> {
    const properties = schema?.properties || {};
    const required = schema?.required || [];
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const [key, value] of Object.entries(properties) as [string, any][]) {
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
    const tools: ToolSet = {};
    for (const t of toolsToMap) {
      const zodSchema = this.mapJsonSchemaToZod(t.apiSchema);

      tools[t.name] = tool({
        description: t.description,
        parameters: zodSchema,
        execute: async (args: any) => {
          // Execution is handled manually in AgentOrchestratorService.
          return args;
        },
      } as any);
    }
    return tools;
  }

  private logCacheStats(): void {
    VercelAiAdapter.requestCount++;
    if (VercelAiAdapter.requestCount % VercelAiAdapter.STATS_LOG_INTERVAL === 0) {
      const stats = VercelAiAdapter.promptCache.getStats();
      logger.info('📊 Prompt cache stats', {
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
  ): Promise<{
    content: string;
    toolCalls?: IToolCall[];
    thoughtSignature?: string;
    usage?: { promptTokens: number; completionTokens: number };
  }> {
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
      const result = await generateText({
        model: this.provider,
        messages: this.mapMessages(windowedMessages),
        tools: this.mapTools(tools),
        ...(systemInstruction ? { system: systemInstruction } : {}),
      });

      let thoughtSignature: string | undefined;
      for (const part of result.content) {
        const ts = (part as any).providerMetadata?.google?.thoughtSignature;
        if (ts) {
          thoughtSignature = ts;
          break;
        }
      }

      const response = {
        content: result.text,
        toolCalls: result.toolCalls?.map((tc) => {
          const tcPart = result.content.find(
            (p) => p.type === 'tool-call' && p.toolCallId === tc.toolCallId,
          );
          const tcTs = (tcPart as any)?.providerMetadata?.google?.thoughtSignature;

          return {
            id: tc.toolCallId,
            name: tc.toolName,
            arguments: (tc as any).args as Record<string, unknown>,
            ...(tcTs || thoughtSignature ? { thoughtSignature: tcTs || thoughtSignature } : {}),
          };
        }),
        ...(thoughtSignature ? { thoughtSignature } : {}),
        ...(result.usage
          ? {
              usage: {
                promptTokens: (result.usage as any).promptTokens || 0,
                completionTokens: (result.usage as any).completionTokens || 0,
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
    } catch (error: any) {
      const errorString = error.message + ' ' + JSON.stringify(error);
      const isQuotaError =
        error.statusCode === 429 ||
        errorString.includes('Quota exceeded') ||
        errorString.includes('RESOURCE_EXHAUSTED') ||
        error.lastError?.statusCode === 429 ||
        error.reason === 'maxRetriesExceeded' ||
        (error.errors &&
          error.errors.some(
            (e: any) =>
              e.statusCode === 429 ||
              e.message?.includes('Quota exceeded') ||
              e.message?.includes('RESOURCE_EXHAUSTED'),
          ));

      if (isQuotaError) {
        throw new QuotaExceededError();
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMProviderError(message, 'LLM_GENERATE_ERROR');
    }
  }

  async *streamText(
    messages: IMessage[],
    tools?: IToolDefinition[],
    systemInstruction?: string,
  ): AsyncGenerator<
    {
      content: string;
      toolCalls?: IToolCall[];
      thoughtSignature?: string;
      usage?: { promptTokens: number; completionTokens: number };
    },
    void,
    unknown
  > {
    // Apply message windowing to reduce tokens
    const windowedMessages = applyMessageWindow(messages);

    this.logCacheStats();

    try {
      const result = await streamText({
        model: this.provider,
        messages: this.mapMessages(windowedMessages),
        tools: this.mapTools(tools),
        ...(systemInstruction ? { system: systemInstruction } : {}),
      });

      for await (const part of result.fullStream) {
        const thoughtSignature =
          (part as any).providerMetadata?.google?.thoughtSignature ||
          (part as any).thoughtSignature;

        if (thoughtSignature) {
          yield { content: '', thoughtSignature };
        }

        if (part.type === 'text-delta' && part.text) {
          yield { content: part.text };
        } else if (part.type === 'tool-call') {
          const toolPart = part as any;
          const tcThoughtSignature =
            toolPart.providerMetadata?.google?.thoughtSignature || thoughtSignature;

          yield {
            content: '',
            toolCalls: [
              {
                id: toolPart.toolCallId,
                name: toolPart.toolName,
                arguments: toolPart.args || {},
                thoughtSignature: tcThoughtSignature,
              },
            ],
          };
        } else if (part.type === 'finish' && (part as any).totalUsage) {
          const usage = (part as any).totalUsage || (part as any).usage;
          yield {
            content: '',
            ...(usage
              ? {
                  usage: {
                    promptTokens: usage.promptTokens || 0,
                    completionTokens: usage.completionTokens || 0,
                  },
                }
              : {}),
          };
        }
      }
    } catch (error: any) {
      const errorString = error.message + ' ' + JSON.stringify(error);
      const isQuotaError =
        error.statusCode === 429 ||
        errorString.includes('Quota exceeded') ||
        errorString.includes('RESOURCE_EXHAUSTED') ||
        error.lastError?.statusCode === 429 ||
        error.reason === 'maxRetriesExceeded' ||
        (error.errors &&
          error.errors.some(
            (e: any) =>
              e.statusCode === 429 ||
              e.message?.includes('Quota exceeded') ||
              e.message?.includes('RESOURCE_EXHAUSTED'),
          ));

      if (isQuotaError) {
        throw new QuotaExceededError();
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMProviderError(message, 'LLM_STREAM_ERROR');
    }
  }
}
