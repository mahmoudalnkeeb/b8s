import { useState, useCallback } from 'react';
import { conversationsApi } from '../api/conversations';
import type { MessageProps } from '../components/ui/message-bubble';
import { toast } from 'sonner';

interface UseChatStreamOptions {
  conversationId?: string;
  initialMessages?: MessageProps[];
  onRefetch?: () => void;
  onStreamComplete?: (conversationId?: string) => void;
  createConversation?: (firstMessage: string) => Promise<{ conversationId: string }>;
}

export function useChatStream({
  conversationId: initialConversationId,
  initialMessages = [],
  onRefetch,
  onStreamComplete,
  createConversation,
}: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<MessageProps[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isStreaming) return;

    const currentInput = input;
    setInput('');
    setIsStreaming(true);
    setIsWaiting(true);

    const userMessage: MessageProps = { role: 'user', content: currentInput, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      let activeConversationId = initialConversationId;

      if (!activeConversationId && createConversation) {
        const conv = await createConversation(currentInput);
        activeConversationId = conv.conversationId;
      }

      if (!activeConversationId) {
        throw new Error('No conversation ID available');
      }

      const response = await conversationsApi.streamMessage(activeConversationId, currentInput);

      if (!response.body) {
        setIsStreaming(false);
        setIsWaiting(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: MessageProps | null = null;

      let buffer = '';

      const processBuffer = (text: string) => {
        buffer += text;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6).trim();

            if (data === '[DONE]') {
              setIsStreaming(false);
              setIsWaiting(false);
              onRefetch?.();
              if (onStreamComplete && activeConversationId) {
                onStreamComplete(activeConversationId);
              }
              return true;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error || parsed.chunk) {
                setIsWaiting(false);
                if (!assistantMessage) {
                  assistantMessage = { role: 'assistant', content: '', timestamp: new Date() };
                  setMessages((prev) => [...prev, assistantMessage!]);
                }
              }

              if (parsed.error) {
                assistantMessage!.content = parsed.error;
                updateLastMessage();
                setIsStreaming(false);
                return true;
              }
              if (parsed.chunk) {
                assistantMessage!.content += parsed.chunk;
                updateLastMessage();
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
        return false;
      };

      const updateLastMessage = () => {
        if (!assistantMessage) return;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...assistantMessage! };
          return updated;
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        if (processBuffer(text)) break;
      }
    } catch (err: any) {
      toast.error('Streaming failed', { description: err.message });
      console.error('Streaming failed', err);
      setIsStreaming(false);
    }
  }, [input, isStreaming, initialConversationId, createConversation, onRefetch, onStreamComplete]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isStreaming,
    isWaiting,
    handleSend,
  };
}
