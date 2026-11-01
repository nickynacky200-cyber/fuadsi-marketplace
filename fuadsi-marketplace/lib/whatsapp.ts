/** Normalises a phone number to international digits (no +). Returns null if it does not look valid. */
export function normalizeWhatsAppNumber(input?: string | null): string | null {
  if (!input) return null;
  let d = String(input).replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 11) d = "234" + d.slice(1); // Nigerian local format
  d = d.replace(/\D/g, "");
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

export function buildWhatsAppLink(number?: string | null, message?: string): string | null {
  const n = normalizeWhatsAppNumber(number);
  if (!n) return null;
  return `https://wa.me/${n}` + (message ? `?text=${encodeURIComponent(message)}` : "");
}

export function productEnquiryMessage(title: string, url: string): string {
  return `Hello, I'm interested in "${title}" on FUADSI Marketplace. Is it still available?\n${url}`;
}
