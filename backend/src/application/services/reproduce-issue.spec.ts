import { AgentOrchestratorService } from './agent-orchestrator';
import { ILLMProvider, IToolExecutor } from '../../domain/ports';
import { IMessage, MessageRole, IToolDefinition } from '../../domain/models';

describe('AgentOrchestratorService Reproduction', () => {
  let llmProvider: jest.Mocked<ILLMProvider>;
  let toolExecutor: jest.Mocked<IToolExecutor>;
  let orchestrator: AgentOrchestratorService;

  beforeEach(() => {
    llmProvider = {
      bindTools: jest.fn(),
      generateText: jest.fn(),
      streamText: jest.fn(),
    };
    toolExecutor = {
      execute: jest.fn(),
    };
    orchestrator = new AgentOrchestratorService(llmProvider, toolExecutor);
  });

  it('should continue generating after a tool call in runStream', async () => {
    const messages: IMessage[] = [
      { role: MessageRole.USER, content: 'search for something', timestamp: new Date() },
    ];
    const tools: IToolDefinition[] = [
      { name: 'rag_query', description: 'query KB', apiSchema: {} } as any,
    ];
    const context = { agentId: '1', userId: '1', conversationId: '1' };

    // First call returns a tool call
    const firstStream = (async function* () {
      yield {
        content: '',
        toolCalls: [{ id: 'call1', name: 'rag_query', arguments: { query: 'something' } }],
      };
    })();

    // Second call returns final text
    const secondStream = (async function* () {
      yield { content: 'I found something' };
    })();

    llmProvider.streamText.mockReturnValueOnce(firstStream).mockReturnValueOnce(secondStream);
    toolExecutor.execute.mockResolvedValue({ ok: true, context: [{ text: 'some knowledge' }] });

    const chunks = [];
    for await (const chunk of orchestrator.runStream(messages, tools, 'system', context)) {
      chunks.push(chunk);
    }

    // Currently it fails because it only does one call.
    // It should have at least 2 chunks with content (empty or text) and 2 chunks with newMessages.

    const finalContent = chunks.map((c) => c.content).join('');
    expect(finalContent).toContain('I found something');

    // Check if newMessages contains the final assistant response
    const allNewMessages = chunks.flatMap((c) => c.newMessages || []);
    expect(
      allNewMessages.some(
        (m) => m.role === MessageRole.ASSISTANT && m.content === 'I found something',
      ),
    ).toBe(true);
    expect(allNewMessages.some((m) => m.role === MessageRole.TOOL)).toBe(true);

    expect(llmProvider.streamText).toHaveBeenCalledTimes(2);
  });
});
