import { RagResult } from './index';
import { logger } from '../../utils/logger';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText, LanguageModel } from 'ai';
import { env } from '../../loaders/env';

export interface ValidatedRagResult extends RagResult {
  isRelevant: boolean;
  relevanceScore: number;
  validatedAt: string;
}

export interface RagValidationResponse {
  validatedResults: ValidatedRagResult[];
  hasRelevantResults: boolean;
  validationSummary: string;
}

export class RagValidationService {
  private model: LanguageModel;

  constructor() {
    const deepseekProvider = createDeepSeek({
      apiKey: env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com',
    });
    this.model = deepseekProvider('deepseek-chat');
  }

  async validateResults(query: string, results: RagResult[]): Promise<RagValidationResponse> {
    if (results.length === 0) {
      return {
        validatedResults: [],
        hasRelevantResults: false,
        validationSummary: 'No results to validate.',
      };
    }

    try {
      // Build the validation prompt
      const resultsContext = results
        .map(
          (r, i) => `
[Result ${i + 1}]
Source: ${r.citation.fileName} (chunk ${r.citation.chunkIndex + 1})
Content: ${r.text.substring(0, 500)}${r.text.length > 500 ? '...' : ''}
Score: ${r.score.toFixed(4)}
`,
        )
        .join('\n');

      const validationPrompt = `You are a RAG result validator. Your task is to determine if the retrieved document chunks are relevant to the user's query.

## User Query
"${query}"

## Retrieved Results
${resultsContext}

## Instructions
For each result, determine:
1. Is it directly relevant to answering the query? (true/false)
2. A relevance score from 0.0 to 1.0 (1.0 = highly relevant)

Respond ONLY with a JSON array in this exact format:
[
  {"index": 1, "isRelevant": true/false, "relevanceScore": 0.0-1.0},
  {"index": 2, "isRelevant": true/false, "relevanceScore": 0.0-1.0},
  ...
]

Rules:
- A result is relevant if it contains information that helps answer the query
- Be strict: only mark as relevant if the chunk actually contains useful information
- Consider partial relevance (e.g., chunk mentions "github" but doesn't have the actual URL)
- If a chunk contains the specific data being asked about, mark it highly relevant (0.8-1.0)
- If a chunk only mentions related terms but lacks the actual data, mark it low relevance (0.2-0.5)`;

      const response = await generateText({
        model: this.model,
        messages: [{ role: 'user', content: validationPrompt }],
      });

      // Parse the validation response
      const validationScores = this.parseValidationResponse(response.text, results.length);

      // Apply validation scores to results
      const validatedResults: ValidatedRagResult[] = results.map((result, index) => {
        const validation = validationScores[index] || {
          isRelevant: false,
          relevanceScore: 0,
        };

        return {
          ...result,
          isRelevant: validation.isRelevant,
          relevanceScore: validation.relevanceScore,
          validatedAt: new Date().toISOString(),
        };
      });

      // Sort by relevance score descending
      validatedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const relevantCount = validatedResults.filter((r) => r.isRelevant).length;

      logger.info('RAG validation completed', {
        query: query.substring(0, 100),
        totalResults: results.length,
        relevantResults: relevantCount,
      });

      return {
        validatedResults,
        hasRelevantResults: relevantCount > 0,
        validationSummary: `${relevantCount} of ${results.length} results are relevant to the query.`,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('RAG validation failed:', message);

      // Fallback: return all results as relevant if validation fails
      return {
        validatedResults: results.map((r) => ({
          ...r,
          isRelevant: true,
          relevanceScore: r.score,
          validatedAt: new Date().toISOString(),
        })),
        hasRelevantResults: true,
        validationSummary: 'Validation unavailable, returning all results.',
      };
    }
  }

  private parseValidationResponse(
    response: string,
    expectedCount: number,
  ): Array<{ isRelevant: boolean; relevanceScore: number }> {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.map((item: any) => ({
        isRelevant: Boolean(item.isRelevant),
        relevanceScore: Math.max(0, Math.min(1, Number(item.relevanceScore) || 0)),
      }));
    } catch (error) {
      logger.warn('Failed to parse validation response, using defaults', {
        response: response.substring(0, 200),
        error,
      });

      // Return default values if parsing fails
      return Array(expectedCount).fill({
        isRelevant: true,
        relevanceScore: 0.5,
      });
    }
  }
}
