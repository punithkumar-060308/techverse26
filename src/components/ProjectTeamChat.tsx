import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  projectId: string;
  isMember: boolean;
}

interface ChatMsg {
  id: string;
  user_id: string;
  channel: string;
  content: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ProjectTeamChat = ({ projectId, isMember }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelName = `project-${projectId}`;

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .then(({ data }) => {
        if (data) setProfiles(data);
      });
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, user_id, channel, content, created_at")
      .eq("channel", channelName)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
    setLoading(false);
  }, [channelName]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    const sub = supabase
      .channel(`project-chat-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel=eq.${channelName}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMsg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [projectId, channelName]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getDisplayName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.display_name || "User";
  };

  const getAvatar = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      channel: channelName,
      content: input.trim(),
      mentions: [],
    });
    if (error) toast.error("Failed to send message");
    else setInput("");
  };

  if (!isMember) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm font-mono">Join the project to access team chat</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl flex flex-col h-[400px]">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-mono font-semibold text-sm">Team Chat</h3>
        <span className="text-xs text-muted-foreground ml-auto">{messages.length} messages</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex flex-col gap-3">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center py-10 text-muted-foreground text-sm font-mono">
              No messages yet. Start the conversation!
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                  <AvatarImage src={getAvatar(msg.user_id)} />
                  <AvatarFallback className="text-[10px]">{getDisplayName(msg.user_id)[0]}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "justify-end" : ""}`}>
                    {!isMe && <span className="text-xs font-mono font-medium">{getDisplayName(msg.user_id)}</span>}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`text-sm rounded-xl inline-block px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-border flex gap-2 items-center">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="text-sm rounded-xl"
        />
        <Button size="icon" onClick={sendMessage} disabled={!input.trim()} className="shrink-0 rounded-xl">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProjectTeamChat;
