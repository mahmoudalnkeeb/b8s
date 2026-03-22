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
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="lg:hidden text-white/50 hover:text-white hover:bg-white/5 rounded-none border border-transparent">
            <Link to="/discover">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="p-2 border border-[#3D81CC]/30 bg-[#3D81CC]/10">
            <Bot className="h-5 w-5 text-[#3D81CC]" />
          </div>
          <div>
            <h3 className="font-sans font-black text-sm text-white uppercase tracking-tight">New Chat with {agent?.name || 'Agent'}</h3>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">
              Draft
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
            <div className="p-6 border border-[#3D81CC]/30 bg-[#3D81CC]/5">
              <Bot className="h-16 w-16 text-[#3D81CC]" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-sans font-black text-white uppercase tracking-tight">Start a new conversation</h3>
              <p className="font-sans text-sm text-white/50 font-light max-w-sm mx-auto">
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
          <div className="flex items-center gap-2 font-mono text-[10px] text-white/40 uppercase tracking-widest animate-pulse ml-12">
            <Loader2 className="h-3 w-3 animate-spin text-[#3D81CC]" />
            Initializing conversation...
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>

      <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-10 sticky bottom-0">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto w-full group">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="TYPE A MESSAGE..."
            className="h-14 pl-4 pr-16 bg-[#0a0a0a] border border-white/10 rounded-none focus-visible:ring-1 focus-visible:ring-[#3D81CC] text-sm text-white font-mono placeholder:text-white/20 uppercase tracking-widest"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-12 bg-[#3D81CC] hover:bg-white text-white hover:text-black transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer rounded-none"
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin text-white flex-shrink-0" />
            ) : (
              <Send className="h-4 w-4 flex-shrink-0" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
