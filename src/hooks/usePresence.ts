import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceState {
  user_id: string;
  online_at: string;
  typing?: boolean;
  channel?: string;
}

export function usePresence(channel: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel(`presence-${channel}`, {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<PresenceState>();
        const online: string[] = [];
        const typing: string[] = [];

        Object.entries(state).forEach(([userId, presences]) => {
          online.push(userId);
          const latest = presences[presences.length - 1];
          if (latest?.typing && latest?.channel === channel && userId !== user.id) {
            typing.push(userId);
          }
        });

        setOnlineUsers(online);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            typing: false,
            channel,
          });
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      channelRef.current = null;
    };
  }, [user, channel]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!user || !channelRef.current) return;

      channelRef.current.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
        typing: isTyping,
        channel,
      });

      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            typing: false,
            channel,
          });
        }, 3000);
      }
    },
    [user, channel]
  );

  return { onlineUsers, typingUsers, setTyping };
}
