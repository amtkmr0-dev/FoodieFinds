import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, ChevronLeft } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "admin";
  timestamp: string;
}

interface SupportChatProps {
  onClose?: () => void;
  hasHadFirstCall?: boolean;
}

export function SupportChat({ onClose, hasHadFirstCall = false }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! How can I help you today?",
      sender: "admin",
      timestamp: "10:30 AM",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  if (!hasHadFirstCall) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="p-6 text-center max-w-md">
          <h3 className="font-semibold mb-2">Support Chat Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            Support chat is enabled after your first successful recharge. Complete a recharge to unlock this feature.
          </p>
          {onClose && (
            <Button variant="outline" className="mt-4" onClick={onClose} data-testid="button-close-support">
              Go Back
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center gap-3">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-back-support">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <h3 className="font-semibold flex-1">Support Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : ""}`}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback>{message.sender === "user" ? "U" : "A"}</AvatarFallback>
            </Avatar>
            <div className={`flex flex-col ${message.sender === "user" ? "items-end" : ""}`}>
              <div
                className={`rounded-lg p-3 max-w-xs ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            data-testid="input-message"
          />
          <Button onClick={handleSend} data-testid="button-send-message">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
