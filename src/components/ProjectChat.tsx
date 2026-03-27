import { useState } from "react";
import { Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  sender: { name: string; avatar: string };
  timestamp: string;
}

const initialMessages: Message[] = [
  { id: "m1", text: "Hey team, I pushed the auth flow updates. Can someone review?", sender: { name: "Jordan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" }, timestamp: "10:32 AM" },
  { id: "m2", text: "On it! I'll check the PR after lunch.", sender: { name: "Alex", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" }, timestamp: "10:45 AM" },
  { id: "m3", text: "Also, the database schema looks good. Ready to move forward.", sender: { name: "Sam", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam" }, timestamp: "11:02 AM" },
];

const currentUser = { name: "You", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You" };

const ProjectChat = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      text: input.trim(),
      sender: currentUser,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <div className="glass-card rounded-xl flex flex-col h-[400px]">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-mono font-semibold text-sm">Team Chat</h3>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const isMe = msg.sender.name === "You";
            return (
              <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${isMe ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={msg.sender.avatar} />
                  <AvatarFallback className="text-[10px]">{msg.sender.name[0]}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    {!isMe && <span className="text-xs font-medium">{msg.sender.name}</span>}
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className={`text-sm px-3 py-2 rounded-xl inline-block ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="text-sm"
        />
        <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProjectChat;
