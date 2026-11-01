import { PAYMENT_NOTICE } from "@/lib/constants";
export const metadata = { title: "Safety and payments" };

const TIPS = [
  ["There are no online payments", PAYMENT_NOTICE],
  ["Meet in public campus spaces", "Choose busy, well-lit places such as the faculty entrance, library or cafeteria, ideally in daytime. Bring a friend if you can."],
  ["Inspect before you pay", "Test electronics, check clothes and shoes, and confirm the item matches the listing photos before handing over money."],
  ["Keep chats on the platform", "Messages sent here are linked to the listing, which helps moderators if something goes wrong."],
  ["Verified badges are manual", "Signing in with Google doesn't prove someone studies at FUADSI. The verified badge means an administrator checked that person."],
  ["Report problems", "Use the Report button on any product, store, conversation or order. Moderators can suspend listings and accounts."],
];

export default function SafetyPage() {
  return (
    <div className="container-x max-w-3xl py-6 md:py-10">
      <h1 className="text-3xl font-extrabold">Safety &amp; how payments work</h1>
      <p className="mt-2 text-ink-soft">FUADSI Marketplace connects buyers and sellers on campus. These simple habits keep everyone safe.</p>
      <div className="mt-6 space-y-3">{TIPS.map(([t, d]) => <div key={t} className="card p-4"><h2 className="font-bold">{t}</h2><p className="mt-1 text-sm text-ink-soft">{d}</p></div>)}</div>
    </div>
  );
}
