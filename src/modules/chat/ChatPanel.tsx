import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { logEngagement } from "@/lib/engagement";
import { featureFlags } from "@/lib/feature-flags";
import { connectSocket, getSocket, joinEventRoom, leaveEventRoom } from "@/lib/socket";
import { getAccessToken } from "@/lib/api-client";
import {
  useGetChatMessagesQuery,
  useSendChatMessageMutation,
} from "@/store/api/chatApi";
import { getInitials } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import toast from "react-hot-toast";

interface Props {
  eventId: string;
  className?: string;
}

export default function ChatPanel({ eventId, className = "" }: Props) {
  const { data: messages = [], refetch } = useGetChatMessagesQuery(eventId);
  const [sendMessage, { isLoading }] = useSendChatMessageMutation();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `event_id=eq.${eventId}`,
        },
        () => refetch()
      )
      .subscribe();

    let socketCleanup: (() => void) | undefined;
    if (featureFlags.socketChat) {
      getAccessToken().then((token) => {
        if (token) {
          connectSocket(token);
          joinEventRoom(eventId);
          getSocket().on("chat:message", () => refetch());
        }
      });
      socketCleanup = () => {
        leaveEventRoom(eventId);
        getSocket().off("chat:message");
      };
    }

    return () => {
      supabase.removeChannel(channel);
      socketCleanup?.();
    };
  }, [eventId, refetch]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await sendMessage({ eventId, message: trimmed }).unwrap();
      setText("");
      await logEngagement(eventId, "chat_send", { length: trimmed.length });
    } catch {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className={`flex flex-col h-full border rounded-lg bg-card ${className}`}>
      <div className="px-4 py-3 border-b font-semibold text-sm">Live Chat</div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-3 py-3">
          {messages.map((m: ChatMessage) => (
            <div key={m.id} className="flex gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={m.user?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {getInitials(m.user?.full_name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium">{m.user?.full_name || "User"}</p>
                <p className="text-sm break-words">{m.message}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Say something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="icon" onClick={handleSend} disabled={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
