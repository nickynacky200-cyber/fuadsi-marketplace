import { MessagesShell } from "@/components/messages/MessagesShell";
export const metadata = { title: "Messages" };
export default function Page({ params }: { params: { id: string } }) { return <MessagesShell activeId={params.id} />; }
