import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAgent } from '../../../api/agents';
import { useCreateConversation } from '../../../api/conversations';
import { useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, ArrowLeft, Loader2 } from 'lucide-react';
import { MessageBubble } from '@/components/ui/message-bubble';
import { useChatStream } from '@/hooks/use-chat-stream';

export const Route = createFileRoute('/chat/new/$agentId')({
  component: NewChat,
});

function NewChat() {
  const { agentId } = Route.useParams();
  const { data: agent, isLoading: isAgentLoading } = useAgent(agentId);
  const createConversation = useCreateConversation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCreateConv = useCallback(
    async (firstMessage: string) => {
      return await createConversation.mutateAsync({ agentId, firstMessage });
    },
    [agentId, createConversation]
  );

  const handleStreamComplete = useCallback(
    (conversationId?: string) => {
      if (conversationId) {
        navigate({ to: '/chat/$conversationId', params: { conversationId } });
      }
    },
    [navigate]
  );

  const { messages, input, setInput, isStreaming, isWaiting, handleSend } = useChatStream({
    createConversation: handleCreateConv,
    onStreamComplete: handleStreamComplete,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isAgentLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading agent...</div>;

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      <div className="p-4 border-b flex items-center justify-between bg-background/50 sticky top-0 z-10 backdrop-blur-md border-border/40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/discover">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Bot className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm">New Chat with {agent?.name || 'Agent'}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              Draft
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
            <div className="p-6 bg-secondary/20 rounded-3xl">
              <Bot className="h-16 w-16 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-white">Start a new conversation</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Send your first message to initialize this chat and generate a unique title for your
                session.
              </p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {isWaiting && (
          <MessageBubble
            message={{
              role: 'assistant',
              content: '...',
              timestamp: new Date(),
            }}
          />
        )}
        {isStreaming && !isWaiting && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic animate-pulse ml-12">
            <Loader2 className="h-3 w-3 animate-spin" />
            Initializing conversation...
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>

      <div className="p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto group">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Send a message..."
            className="h-14 pl-4 pr-14 bg-secondary/20 border-border/60 rounded-2xl focus-visible:ring-blue-500/50 text-base shadow-xl"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 rounded-xl transition-all"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
