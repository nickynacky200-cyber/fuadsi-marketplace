"use client";
import clsx from "clsx";
import { Protected } from "@/components/ui/Protected";
import { ConversationList, EmptyPane } from "./ConversationList";
import { ChatView } from "./ChatView";

export function MessagesShell({ activeId }: { activeId?: string }) {
  return (
    <Protected>
      <div className="md:container-x md:py-3">
        <div className="md:grid md:h-[calc(100dvh-112px)] md:grid-cols-[340px_minmax(0,1fr)] md:overflow-hidden md:rounded-3xl md:border md:border-brand-100 md:bg-white md:shadow-card">
          <div className={clsx("md:h-full md:border-r md:border-brand-100", activeId && "max-md:hidden")}><ConversationList activeId={activeId} /></div>
          <div className={clsx("md:h-full", !activeId && "max-md:hidden")}>{activeId ? <ChatView key={activeId} id={activeId} /> : <EmptyPane />}</div>
        </div>
      </div>
    </Protected>
  );
}
