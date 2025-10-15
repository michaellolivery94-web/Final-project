import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { GradeSelector } from '@/components/GradeSelector';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const motivationalQuotes = [
  "Keep going, you're doing great! Nzuri sana! 🌟",
  "Every question brings you closer to mastery! Hongera! 📚",
  "Learning is a journey, not a race! Endelea! 🚀",
  "You're making amazing progress! Vizuri! 🎓",
  "Curiosity is the key to knowledge! 🔑",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Habari! I'm Happy, your friendly CBC tutor! 😊 I'm here to help you learn using the Kenyan Competency-Based Curriculum. What would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { progress, incrementQuestions, setGradeAndSubject } = useProgress();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [randomQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare message window (last 12 messages for context)
      const messageWindow = [...messages, userMessage].slice(-12);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messageWindow,
          grade: progress.grade,
          subject: progress.subject,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to get response from Happy');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let buffer = '';

      if (!reader) {
        throw new Error('No response stream available');
      }

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }

      // Increment questions counter
      incrementQuestions();

      toast({
        title: "Response received!",
        description: "Happy has answered your question.",
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I couldn't respond right now. Please try again in a moment.",
        },
      ]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Focus back on textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex-1 flex flex-col min-h-0">
        <Card className="mb-4">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Chat with Happy
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your CBC learning companion - Ask questions, explore topics!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <GradeSelector
                  initialGrade={progress.grade}
                  initialSubject={progress.subject}
                  onSelectionChange={(grade, subject) => {
                    setGradeAndSubject(grade, subject);
                    toast({
                      title: "Settings updated",
                      description: `Now learning ${subject} for ${grade}`,
                    });
                  }}
                  compact
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 animate-fade-in ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {message.content}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 sm:gap-3 animate-fade-in">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Happy is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3 sm:p-4 bg-background">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
                disabled={loading}
                className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm sm:text-base"
                aria-label="Chat input"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="icon"
                className="h-10 w-10 sm:h-11 sm:w-11"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">{randomQuote}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
