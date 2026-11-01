import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppLink, normalizeWhatsAppNumber, productEnquiryMessage } from "../lib/whatsapp.ts";
import { buildSearchTokens, queryTokens } from "../lib/search.ts";
import { allowedNext, canTransition, reservesStock } from "../lib/order-flow.ts";
import { discountPercent, formatNaira, slugify, timeAgo } from "../lib/format.ts";

test("whatsapp numbers normalise to international digits", () => {
  assert.equal(normalizeWhatsAppNumber("0801 234 5678"), "2348012345678");
  assert.equal(normalizeWhatsAppNumber("+234 801 234 5678"), "2348012345678");
  assert.equal(normalizeWhatsAppNumber("2348012345678"), "2348012345678");
  assert.equal(normalizeWhatsAppNumber("12345"), null);
  assert.equal(normalizeWhatsAppNumber(""), null);
});

test("whatsapp link is URL-encoded and safe", () => {
  const link = buildWhatsAppLink("08012345678", productEnquiryMessage('HP 15.6" & case', "https://x.app/p/1"))!;
  assert.ok(link.startsWith("https://wa.me/2348012345678?text="));
  assert.ok(!link.includes(" "));
  assert.ok(link.includes("%26"));
  assert.equal(buildWhatsAppLink("abc"), null);
});

test("search tokens support prefix matching", () => {
  const t = buildSearchTokens("iPhone 15 Pro", "apple");
  for (const w of ["ip", "iph", "iphone", "15", "pro", "app"]) assert.ok(t.includes(w), w);
  assert.deepEqual(queryTokens("iPho  15"), ["ipho", "15"]);
  assert.equal(queryTokens("supercalifragilistic")[0].length, 10);
});

test("order transitions are enforced per role and delivery method", () => {
  assert.deepEqual(allowedNext("seller", "pending", "meetup"), ["accepted", "rejected"]);
  assert.ok(canTransition("seller", "accepted", "ready_for_pickup", "meetup"));
  assert.ok(!canTransition("seller", "accepted", "out_for_delivery", "meetup"));
  assert.ok(canTransition("seller", "accepted", "out_for_delivery", "campus_delivery"));
  assert.ok(!canTransition("seller", "completed", "pending", "meetup"));
  assert.ok(canTransition("buyer", "pending", "cancelled", "meetup"));
  assert.ok(!canTransition("buyer", "out_for_delivery", "cancelled", "campus_delivery"));
  assert.ok(!canTransition("buyer", "pending", "accepted", "meetup"));
  assert.ok(reservesStock("accepted") && !reservesStock("pending") && !reservesStock("cancelled"));
});

test("formatting helpers", () => {
  assert.equal(formatNaira(650000), "\u20A6650,000");
  assert.equal(discountPercent(650000, 770000), 16);
  assert.equal(discountPercent(100, 50), 0);
  assert.equal(slugify("Tech Wave Store!"), "tech-wave-store");
  assert.equal(timeAgo(new Date(0), 30_000), "just now");
});
