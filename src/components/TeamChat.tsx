import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Reply,
  AtSign,
  Code2,
  ListTodo,
  Sparkles,
  MessageSquare,
  X,
  Loader2,
  Hash,
  ShieldCheck,
  Circle,
  CheckCheck,
  Check,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { usePresence } from "@/hooks/usePresence";
import { useReadReceipts } from "@/hooks/useReadReceipts";

interface ChatMessage {
  id: string;
  user_id: string;
  channel: string;
  content: string;
  reply_to: string | null;
  thread_id: string | null;
  mentions: string[];
  is_code: boolean;
  code_language: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const channels = [
  { id: "general", label: "General" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "design", label: "Design" },
];

const languages = ["javascript", "typescript", "python", "html", "css", "sql", "json", "bash"];

const TeamChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [channel, setChannel] = useState("general");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [threadView, setThreadView] = useState<string | null>(null);
  const [codeMode, setCodeMode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskMessage, setTaskMessage] = useState<ChatMessage | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCreating, setTaskCreating] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Presence hook for typing indicators and online status
  const { onlineUsers, typingUsers, setTyping } = usePresence(channel);

  // Read receipts
  const messageIds = messages.map((m) => m.id);
  const { markAsRead, getReadBy } = useReadReceipts(messageIds);

  // Mark visible messages as read
  useEffect(() => {
    if (messages.length > 0 && user) {
      const otherMessages = messages
        .filter((m) => m.user_id !== user.id)
        .map((m) => m.id);
      markAsRead(otherMessages);
    }
  }, [messages, user, markAsRead]);

  // Fetch profiles and admin roles
  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .then(({ data }) => {
        if (data) setProfiles(data);
      });
    supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .then(({ data }) => {
        if (data) setAdminUserIds(new Set(data.map((r) => r.user_id)));
      });
  }, []);

  // Fetch messages for channel
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("channel", channel)
      .is("thread_id", null)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
    setLoading(false);
  }, [channel]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const sub = supabase
      .channel(`chat-${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel=eq.${channel}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (!msg.thread_id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages", filter: `channel=eq.${channel}` },
        (payload) => {
          const oldMsg = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== oldMsg.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `channel=eq.${channel}` },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getProfile = (userId: string) =>
    profiles.find((p) => p.user_id === userId);

  const getDisplayName = (userId: string) => {
    const p = getProfile(userId);
    return p?.display_name || p?.username || "User";
  };

  const getAvatar = (userId: string) => {
    const p = getProfile(userId);
    return p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  // Parse @mentions from input
  const extractMentions = (text: string): string[] => {
    const matches = text.match(/@(\w+)/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const mentions = extractMentions(input);
    const mentionUserIds = profiles
      .filter((p) => mentions.includes(p.display_name || "") || mentions.includes(p.username || ""))
      .map((p) => p.user_id);

    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      channel,
      content: input.trim(),
      reply_to: replyTo?.id || null,
      thread_id: threadView || null,
      mentions: mentionUserIds,
      is_code: codeMode,
      code_language: codeMode ? codeLanguage : null,
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setInput("");
      setReplyTo(null);
      setCodeMode(false);
      setTyping(false);
    }
  };

  const handleMentionSelect = (profile: Profile) => {
    const name = profile.display_name || profile.username || "User";
    const cursorPos = input.lastIndexOf("@");
    const before = input.slice(0, cursorPos);
    setInput(`${before}@${name} `);
    setMentionOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (val: string) => {
    setInput(val);

    // Trigger typing indicator
    if (val.trim().length > 0) {
      setTyping(true);
    } else {
      setTyping(false);
    }

    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && lastAt === val.length - 1) {
      setMentionOpen(true);
      setMentionFilter("");
    } else if (lastAt !== -1) {
      const after = val.slice(lastAt + 1);
      if (!after.includes(" ")) {
        setMentionOpen(true);
        setMentionFilter(after.toLowerCase());
      } else {
        setMentionOpen(false);
      }
    } else {
      setMentionOpen(false);
    }
  };

  const openTaskDialog = (msg: ChatMessage) => {
    setTaskMessage(msg);
    setTaskTitle(msg.content.slice(0, 100));
    setTaskDialogOpen(true);
  };

  const createTaskFromMessage = async () => {
    if (!taskTitle.trim() || !user || !taskMessage) return;
    setTaskCreating(true);
    const { error } = await supabase.from("projects").insert({
      name: taskTitle.trim(),
      description: taskMessage.content,
      created_by: user.id,
      status: "planning",
      tech: [],
    });
    if (error) {
      toast.error("Failed to create task");
    } else {
      toast.success("Task created from message!");
      setTaskDialogOpen(false);
    }
    setTaskCreating(false);
  };

  const summarizeChat = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-chat", {
        body: {
          messages: messages.map((m) => ({
            sender: getDisplayName(m.user_id),
            content: m.content,
            timestamp: m.created_at,
          })),
        },
      });
      if (error) throw error;
      setSummary(data?.summary || "No summary available.");
    } catch {
      toast.error("Failed to summarize chat");
    }
    setSummarizing(false);
  };

  const renderContent = (msg: ChatMessage) => {
    if (msg.is_code) {
      return (
        <SyntaxHighlighter
          language={msg.code_language || "javascript"}
          style={oneDark}
          customStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", margin: 0 }}
        >
          {msg.content}
        </SyntaxHighlighter>
      );
    }

    const contentWithMentions = msg.content.replace(/@(\w+)/g, "**@$1**");

    return (
      <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_pre]:bg-[hsl(222,22%,10%)] [&_pre]:rounded-lg [&_code]:text-primary">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !match;
              return isInline ? (
                <code className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneDark}
                  customStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem" }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {contentWithMentions}
        </ReactMarkdown>
      </div>
    );
  };

  const replyMessage = replyTo
    ? messages.find((m) => m.id === replyTo.id)
    : null;

  const filteredProfiles = profiles.filter(
    (p) =>
      p.user_id !== user?.id &&
      ((p.display_name || "").toLowerCase().includes(mentionFilter) ||
        (p.username || "").toLowerCase().includes(mentionFilter))
  );

  // Get typing user names
  const typingUserNames = typingUsers.map((uid) => getDisplayName(uid));

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px]">
        {/* Channel tabs + online users */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Tabs value={channel} onValueChange={setChannel}>
              <TabsList className="bg-secondary/50">
                {channels.map((ch) => (
                  <TabsTrigger key={ch.id} value={ch.id} className="gap-1.5 text-xs font-mono">
                    <Hash className="w-3 h-3" /> {ch.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Online users indicator */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 5).map((uid) => (
                  <Tooltip key={uid}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Avatar className="w-6 h-6 border-2 border-background">
                          <AvatarImage src={getAvatar(uid)} />
                          <AvatarFallback className="text-[8px]">
                            {getDisplayName(uid)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <Circle className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {getDisplayName(uid)} — Online
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              {onlineUsers.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {onlineUsers.length} online
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg text-xs font-mono"
            onClick={summarizeChat}
            disabled={summarizing || messages.length === 0}
          >
            {summarizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Summarize
          </Button>
        </div>

        {/* Summary banner */}
        {summary && (
          <div className="glass-card rounded-xl p-4 mb-4 border-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-semibold text-primary">AI Summary</span>
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setSummary(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-sm prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="glass-card rounded-xl flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            <h3 className="font-mono font-semibold text-sm">
              {channels.find((c) => c.id === channel)?.label || channel}
            </h3>
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
                const replied = msg.reply_to
                  ? messages.find((m) => m.id === msg.reply_to)
                  : null;
                const readBy = isMe ? getReadBy(msg.id) : [];

                return (
                  <div key={msg.id} className="group animate-fade-in">
                    {/* Reply reference */}
                    {replied && (
                      <div className="flex items-center gap-1.5 ml-9 mb-1 text-xs text-muted-foreground">
                        <Reply className="w-3 h-3 rotate-180" />
                        <span className="font-medium">{getDisplayName(replied.user_id)}</span>
                        <span className="truncate max-w-[200px]">{replied.content}</span>
                      </div>
                    )}

                    <div className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={getAvatar(msg.user_id)} />
                          <AvatarFallback className="text-[10px]">
                            {getDisplayName(msg.user_id)[0]}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline(msg.user_id) && (
                          <Circle className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
                        )}
                      </div>

                      <div className={`max-w-[80%] min-w-0 ${isMe ? "text-right" : ""}`}>
                        <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "justify-end" : ""}`}>
                          {!isMe && (
                            <>
                              <span className="text-xs font-mono font-medium">
                                {getDisplayName(msg.user_id)}
                              </span>
                              {adminUserIds.has(msg.user_id) && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 border-primary/50 text-primary">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Admin
                                </Badge>
                              )}
                            </>
                          )}
                          {isMe && adminUserIds.has(msg.user_id) && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 border-primary/50 text-primary">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Admin
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`text-sm rounded-xl inline-block ${
                            msg.is_code
                              ? "w-full"
                              : isMe
                              ? "bg-primary text-primary-foreground px-3 py-2"
                              : "bg-secondary text-secondary-foreground px-3 py-2"
                          }`}
                        >
                          {renderContent(msg)}
                        </div>

                        {/* Read receipts for own messages */}
                        {isMe && (
                          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : ""}`}>
                            {readBy.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-0.5 text-primary">
                                    <CheckCheck className="w-3 h-3" />
                                    <span className="text-[9px] font-mono">{readBy.length}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                  Read by {readBy.map((uid) => getDisplayName(uid)).join(", ")}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Check className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        )}

                        {/* Mention badges */}
                        {msg.mentions.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {msg.mentions.map((uid) => (
                              <Badge key={uid} variant="outline" className="text-[10px] gap-0.5">
                                <AtSign className="w-2.5 h-2.5" />
                                {getDisplayName(uid)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Action buttons (hover) */}
                        <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "justify-end" : ""}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => setReplyTo(msg)}
                            title="Reply"
                          >
                            <Reply className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => openTaskDialog(msg)}
                            title="Create task"
                          >
                            <ListTodo className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Typing indicator */}
          {typingUserNames.length > 0 && (
            <div className="px-4 py-1.5 border-t border-border/50 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {typingUserNames.length === 1
                  ? `${typingUserNames[0]} is typing...`
                  : typingUserNames.length === 2
                  ? `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`
                  : `${typingUserNames[0]} and ${typingUserNames.length - 1} others are typing...`}
              </span>
            </div>
          )}

          {/* Reply bar */}
          {replyTo && (
            <div className="px-4 py-2 border-t border-border bg-secondary/30 flex items-center gap-2">
              <Reply className="w-3.5 h-3.5 text-primary rotate-180" />
              <span className="text-xs text-muted-foreground truncate flex-1">
                Replying to <strong>{getDisplayName(replyTo.user_id)}</strong>: {replyTo.content.slice(0, 60)}
              </span>
              <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setReplyTo(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Code mode bar */}
          {codeMode && (
            <div className="px-4 py-2 border-t border-border bg-secondary/30 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-muted-foreground">Code snippet mode</span>
              <select
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="text-xs bg-background border border-border rounded px-2 py-0.5 ml-auto"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setCodeMode(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Mention autocomplete */}
          {mentionOpen && filteredProfiles.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-card">
              <div className="flex gap-2 flex-wrap">
                {filteredProfiles.map((p) => (
                  <Button
                    key={p.user_id}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs rounded-lg"
                    onClick={() => handleMentionSelect(p)}
                  >
                    <div className="relative">
                      <AtSign className="w-3 h-3" />
                    </div>
                    {p.display_name || p.username || "User"}
                    {isOnline(p.user_id) && (
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-border flex gap-2 items-center">
            <Button
              variant={codeMode ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8 shrink-0"
              onClick={() => setCodeMode(!codeMode)}
              title="Code snippet"
            >
              <Code2 className="w-4 h-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" title="Mention">
                  <AtSign className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                {profiles
                  .filter((p) => p.user_id !== user?.id)
                  .map((p) => (
                    <Button
                      key={p.user_id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => {
                        const name = p.display_name || p.username || "User";
                        setInput((prev) => prev + `@${name} `);
                        inputRef.current?.focus();
                      }}
                    >
                      <div className="relative">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`} />
                          <AvatarFallback className="text-[8px]">
                            {(p.display_name || "U")[0]}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline(p.user_id) && (
                          <Circle className="w-2 h-2 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
                        )}
                      </div>
                      {p.display_name || p.username || "User"}
                    </Button>
                  ))}
              </PopoverContent>
            </Popover>

            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={codeMode ? "Paste your code here..." : "Type a message... (use @ to mention)"}
              className="text-sm rounded-xl"
            />

            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="shrink-0 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Task creation dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-2">
                <ListTodo className="w-5 h-5" /> Create Task from Message
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Task Title</Label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              {taskMessage && (
                <div>
                  <Label>Original Message</Label>
                  <div className="mt-1 p-3 rounded-xl bg-secondary text-sm">
                    {taskMessage.content}
                  </div>
                </div>
              )}
              <Button
                className="w-full rounded-xl"
                onClick={createTaskFromMessage}
                disabled={taskCreating || !taskTitle.trim()}
              >
                {taskCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default TeamChat;
