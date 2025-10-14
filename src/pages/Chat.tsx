import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Sparkles } from 'lucide-react';

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
  const { progress } = useProgress();

  const [randomQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response for now (you'll need to create an edge function later)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I understand you're asking about "${input}". This is a placeholder response. To enable real AI tutoring, you'll need to set up an edge function with AI integration. I can help with ${progress.grade} - ${progress.subject}!`,
        },
      ]);
      setLoading(false);
    }, 1000);
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
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Chat with Happy
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your CBC learning companion - Ask questions, explore topics!
                </p>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Grade:</span>
                  <span className="text-primary">{progress.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Subject:</span>
                  <span className="text-primary">{progress.subject}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-fade-in ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2 text-sm text-muted-foreground">Happy is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-background">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
                disabled={loading}
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                aria-label="Chat input"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="icon"
                title="Send message"
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
