
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Driver {
  id: string;
  users: {
    name: string;
  };
}

interface Message {
  id: string;
  sender: 'passenger' | 'driver';
  message: string;
  timestamp: string;
  sender_name: string;
}

interface ChatModalProps {
  driver: Driver;
  onClose: () => void;
}

const ChatModal = ({ driver, onClose }: ChatModalProps) => {
  const [passengerName, setPassengerName] = useState("");
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passengerName.trim()) {
      setHasEnteredName(true);
      toast.success(`Olá, ${passengerName}! Agora você pode conversar com ${driver.users.name}.`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'passenger',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      sender_name: passengerName
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simular resposta do motorista (em uma implementação real, isso viria do Supabase Realtime)
    setTimeout(() => {
      const driverResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'driver',
        message: "Obrigado pela mensagem! Estou disponível para sua corrida.",
        timestamp: new Date().toISOString(),
        sender_name: driver.users.name
      };
      setMessages(prev => [...prev, driverResponse]);
    }, 1500);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.users.name}`} />
              <AvatarFallback>
                {driver.users.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{driver.users.name}</CardTitle>
              <p className="text-sm text-green-600">Online</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {!hasEnteredName ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <form onSubmit={handleNameSubmit} className="w-full space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Para começar a conversar
                  </h3>
                  <p className="text-sm text-gray-600">
                    Digite seu nome para que o motorista saiba quem você é
                  </p>
                </div>
                
                <Input
                  placeholder="Seu nome"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="text-center"
                  maxLength={50}
                />
                
                <Button type="submit" className="w-full">
                  Começar Conversa
                </Button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Nenhuma mensagem ainda.</p>
                    <p className="text-sm">Envie uma mensagem para começar!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'passenger' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === 'passenger'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${
                            message.sender === 'passenger' ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {message.sender_name}
                          </span>
                          <span className={`text-xs ${
                            message.sender === 'passenger' ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatModal;
