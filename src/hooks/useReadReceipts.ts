import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReadReceipt {
  message_id: string;
  user_id: string;
  read_at: string;
}

export function useReadReceipts(messageIds: string[]) {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Map<string, string[]>>(new Map());

  // Fetch existing receipts
  useEffect(() => {
    if (messageIds.length === 0) return;

    const fetchReceipts = async () => {
      const { data } = await supabase
        .from("message_read_receipts")
        .select("message_id, user_id")
        .in("message_id", messageIds);

      if (data) {
        const map = new Map<string, string[]>();
        data.forEach((r: { message_id: string; user_id: string }) => {
          const existing = map.get(r.message_id) || [];
          existing.push(r.user_id);
          map.set(r.message_id, existing);
        });
        setReceipts(map);
      }
    };

    fetchReceipts();
  }, [messageIds.join(",")]);

  // Realtime subscription for new receipts
  useEffect(() => {
    const sub = supabase
      .channel("read-receipts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_read_receipts" },
        (payload) => {
          const receipt = payload.new as ReadReceipt;
          setReceipts((prev) => {
            const next = new Map(prev);
            const existing = next.get(receipt.message_id) || [];
            if (!existing.includes(receipt.user_id)) {
              next.set(receipt.message_id, [...existing, receipt.user_id]);
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(
    async (msgIds: string[]) => {
      if (!user || msgIds.length === 0) return;

      const toInsert = msgIds
        .filter((id) => {
          const readers = receipts.get(id) || [];
          return !readers.includes(user.id);
        })
        .map((message_id) => ({
          message_id,
          user_id: user.id,
        }));

      if (toInsert.length === 0) return;

      await supabase.from("message_read_receipts").insert(toInsert);
    },
    [user, receipts]
  );

  const getReadBy = useCallback(
    (messageId: string): string[] => {
      return (receipts.get(messageId) || []).filter((id) => id !== user?.id);
    },
    [receipts, user]
  );

  return { markAsRead, getReadBy };
}
