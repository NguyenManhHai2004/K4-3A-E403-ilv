"use client";

import { useMemo, useState } from "react";
import { initialConversation } from "@/lib/mock-data";
import { makeUserMessage, pickResponder, requestAgentResponse, typingLabelFor } from "@/lib/agent-mock";
import type { AgentFilter, Message } from "@/lib/types";

export function useClassroomChat(onArtifactCreated?: () => void) {
  const [messages, setMessages] = useState<Message[]>(initialConversation);
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [typingLabel, setTypingLabel] = useState<string | null>(null);

  const visibleMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (agentFilter === "all") return true;
      if (msg.senderType === "user") return true;
      return msg.senderType === agentFilter;
    });
  }, [messages, agentFilter]);

  function sendMessage(text: string, target: AgentFilter) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, makeUserMessage(trimmed)]);
    setTypingLabel(typingLabelFor(pickResponder(trimmed, target)));

    requestAgentResponse(trimmed, target).then(({ messages: replies }) => {
      setTypingLabel(null);
      replies.forEach((reply, i) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, reply]);
          if (reply.hasArtifactNotice) onArtifactCreated?.();
        }, i * 250);
      });
    });
  }

  function resetConversation() {
    setMessages(initialConversation);
    setAgentFilter("all");
    setTypingLabel(null);
  }

  return {
    messages: visibleMessages,
    agentFilter,
    setAgentFilter,
    typingLabel,
    sendMessage,
    resetConversation,
  };
}
