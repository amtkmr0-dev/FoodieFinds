import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, Send } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminBroadcast() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState({
    users: true,
    creators: true,
    agencies: true,
  });

  const handleSend = () => {
    // TODO: Implement actual broadcast API call
    // For now, this is a placeholder for the broadcast functionality
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin")}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Broadcast Message</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card className="p-6 space-y-6">
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your broadcast message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 min-h-32"
              data-testid="textarea-message"
            />
          </div>

          <div>
            <Label className="mb-3 block">Send To:</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="users"
                  checked={recipients.users}
                  onCheckedChange={(checked) =>
                    setRecipients({ ...recipients, users: !!checked })
                  }
                  data-testid="checkbox-users"
                />
                <label htmlFor="users" className="cursor-pointer">
                  All Users
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="creators"
                  checked={recipients.creators}
                  onCheckedChange={(checked) =>
                    setRecipients({ ...recipients, creators: !!checked })
                  }
                  data-testid="checkbox-creators"
                />
                <label htmlFor="creators" className="cursor-pointer">
                  All Creators
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="agencies"
                  checked={recipients.agencies}
                  onCheckedChange={(checked) =>
                    setRecipients({ ...recipients, agencies: !!checked })
                  }
                  data-testid="checkbox-agencies"
                />
                <label htmlFor="agencies" className="cursor-pointer">
                  All Agencies
                </label>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSend}
            disabled={!message || (!recipients.users && !recipients.creators && !recipients.agencies)}
            data-testid="button-send-broadcast"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Broadcast
          </Button>
        </Card>
      </main>
    </div>
  );
}
