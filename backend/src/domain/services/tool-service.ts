import { IToolDefinition, IAgent } from '../models';

export const MEMORY_GET_TOOL: IToolDefinition = {
  name: 'memory_get',
  description:
    'Search through the agents long-term memory for specific information from past conversations.',
  apiSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query to find relevant memories.' },
    },
    required: ['query'],
  },
};

export const MEMORY_SET_TOOL: IToolDefinition = {
  name: 'memory_set',
  description:
    'Save important information or facts to the agents long-term memory for future reference.',
  apiSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The fact or information to remember.' },
      importance: {
        type: 'number',
        description: 'Importance level 1-10 (optional, default 1)',
        minimum: 1,
        maximum: 10,
      },
    },
    required: ['text'],
  },
};

export const RAG_QUERY_TOOL: IToolDefinition = {
  name: 'rag_query',
  description:
    'Search the agent\'s internal knowledge base/uploaded documents for specific technical details or information. REQUIRED: You MUST pass a "query" string argument with the search terms. Example: {"query": "contact information"}',
  apiSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The search query to find information in the knowledge base. This parameter is REQUIRED.',
      },
    },
    required: ['query'],
  },
};

export class DomainToolService {
  static getEffectiveTools(agent: IAgent): IToolDefinition[] {
    const tools: IToolDefinition[] = [];

    if (agent.config.memoryEnabled) {
      tools.push(MEMORY_GET_TOOL);
      tools.push(MEMORY_SET_TOOL);
    }

    if (agent.config.ragEnabled) {
      tools.push(RAG_QUERY_TOOL);
    }

    // Custom tools
    if (agent.config.tools && agent.config.tools.length > 0) {
      tools.push(...agent.config.tools);
    }

    return tools;
  }
}
