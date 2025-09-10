import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';

import type { Match, UserProfile, Message, SendMessageInput } from '../../../server/src/schema';

interface ChatViewProps {
  matches: (Match & { user: UserProfile })[];
  currentUserId: number;
}

// NOTE: Using stub data for demonstration - replace with actual API data
const STUB_MESSAGES: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      match_id: 1,
      sender_id: 2,
      content: "Hey! I saw your profile and loved your React projects. Would love to collaborate on something together! 🚀",
      created_at: new Date('2024-01-20T10:30:00'),
      read_at: new Date('2024-01-20T10:35:00')
    },
    {
      id: 2,
      match_id: 1,
      sender_id: 1,
      content: "Hi Sarah! Thanks for reaching out. I'd definitely be interested in collaborating. What kind of project did you have in mind?",
      created_at: new Date('2024-01-20T10:45:00'),
      read_at: null
    },
    {
      id: 3,
      match_id: 1,
      sender_id: 2,
      content: "I'm thinking about building a developer portfolio showcase app - something that helps devs present their projects in a really engaging way. I noticed you have great design sense from your portfolio!",
      created_at: new Date('2024-01-20T11:00:00'),
      read_at: null
    },
    {
      id: 4,
      match_id: 1,
      sender_id: 1,
      content: "That sounds amazing! I've actually been wanting to work on something similar. We could use React with some nice animations and maybe integrate with GitHub API?",
      created_at: new Date('2024-01-20T11:15:00'),
      read_at: null
    },
    {
      id: 5,
      match_id: 1,
      sender_id: 2,
      content: "Perfect! GitHub integration would be awesome. Should we set up a quick call this week to discuss the architecture and divide up the work?",
      created_at: new Date('2024-01-20T11:30:00'),
      read_at: null
    }
  ]
};

export function ChatView({ matches, currentUserId }: ChatViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<(Match & { user: UserProfile }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async (matchId: number) => {
    try {
      // NOTE: Using stub data for demonstration - replace with actual API calls
      const matchMessages = STUB_MESSAGES[matchId] || [];
      setMessages(matchMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      loadMessages(selectedMatch.id);
    }
  }, [selectedMatch, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch) return;

    setIsLoading(true);
    try {
      const messageData: SendMessageInput = {
        match_id: selectedMatch.id,
        sender_id: currentUserId,
        content: newMessage.trim()
      };

      // NOTE: Using stub data for demonstration - replace with actual API calls
      console.log('Sending message:', messageData);

      // Add message to local state for demonstration
      const newMsg: Message = {
        id: messages.length + 1,
        match_id: selectedMatch.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        created_at: new Date(),
        read_at: null
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestMessage = (matchId: number) => {
    const matchMessages = STUB_MESSAGES[matchId] || [];
    return matchMessages.length > 0 ? matchMessages[matchMessages.length - 1] : null;
  };

  const getUnreadCount = (matchId: number) => {
    const matchMessages = STUB_MESSAGES[matchId] || [];
    return matchMessages.filter(msg => msg.sender_id !== currentUserId && !msg.read_at).length;
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (matches.length === 0) {
    return (
      <Card className="max-w-md mx-auto text-center p-8">
        <CardContent>
          <div className="text-6xl mb-4">💬</div>
          <CardTitle className="mb-2">No conversations yet</CardTitle>
          <CardDescription>
            Start swiping to find matches and begin conversations!
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (!selectedMatch) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversations
            </CardTitle>
            <CardDescription>
              Select a match to start chatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches.map((match) => {
                const latestMessage = getLatestMessage(match.id);
                const unreadCount = getUnreadCount(match.id);
                
                return (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={match.user.profile_image_url || ''} />
                      <AvatarFallback>
                        {match.user.first_name[0]}{match.user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {match.user.first_name} {match.user.last_name}
                        </h3>
                        {latestMessage && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(latestMessage.created_at)}
                          </span>
                        )}
                      </div>
                      
                      {latestMessage ? (
                        <p className="text-sm text-gray-600 truncate">
                          {latestMessage.sender_id === currentUserId ? 'You: ' : ''}
                          {latestMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Start a conversation...
                        </p>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <Badge className="bg-blue-500 text-white min-w-[1.5rem] h-6 flex items-center justify-center rounded-full">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMatch(null)}
              className="lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedMatch.user.profile_image_url || ''} />
              <AvatarFallback>
                {selectedMatch.user.first_name[0]}{selectedMatch.user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <CardTitle className="text-lg">
                {selectedMatch.user.first_name} {selectedMatch.user.last_name}
              </CardTitle>
              <CardDescription>@{selectedMatch.user.username}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewMessage(e.target.value)
                }
                placeholder="Type your message..."
                className="flex-1"
                maxLength={2000}
                disabled={isLoading}
              />
              <Button type="submit" disabled={!newMessage.trim() || isLoading} size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="text-xs text-gray-500 mt-1">
              {newMessage.length}/2000 characters
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}