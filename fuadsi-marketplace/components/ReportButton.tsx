"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import { Modal } from "@/components/ui/primitives";
import { useRequireLogin } from "@/components/ui/Protected";
import { useToast } from "@/components/providers/ToastProvider";
import { api, errorMessage } from "@/lib/api-client";

const REASONS = [
  ["scam", "Scam or fraud"], ["prohibited", "Prohibited item"], ["inappropriate", "Inappropriate content"],
  ["fake", "Fake or misleading"], ["harassment", "Harassment"], ["other", "Something else"],
] as const;

export function ReportButton({ targetType, target, className }: { targetType: "product" | "user" | "order"; target: string; className?: string }) {
  const requireLogin = useRequireLogin();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("scam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await api("/reports", { method: "POST", body: { targetType, target, reason, details } });
      toast("success", "Thanks. Our moderators will review this report.");
      setOpen(false);
      setDetails("");
    } catch (e) {
      toast("error", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => requireLogin(() => setOpen(true))} className={className || "inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-red-600"}><Flag className="h-3.5 w-3.5" />Report</button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Report this ${targetType}`}>
        <div className="space-y-3">
          <div><label className="label" htmlFor="rr">Reason</label><select id="rr" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="label" htmlFor="rd">Details (optional)</label><textarea id="rd" className="input min-h-24" maxLength={800} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us what happened" /></div>
          <button onClick={send} disabled={busy} className="btn btn-danger w-full">Submit report</button>
        </div>
      </Modal>
    </>
  );
}
