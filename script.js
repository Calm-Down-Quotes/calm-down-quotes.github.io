"use strict";

/**
 * Calm Down Quotes — Script v3.1 (final)
 *
 * Characteristics:
 * - Hardened against DOM, network, CSP, and timing failures
 * - Deterministic daily quotes + non-repeating random mode
 * - Fully wired sharing (Web Share, WhatsApp, SMS, Facebook)
 * - Graceful fallback + history persistence
 * - Static-hosting safe (GitHub Pages compatible)
 */

/* --------------------------------------------------------
   Engine-loaded contract (used by HTML fallback logic)
-------------------------------------------------------- */
window.__QUOTE_ENGINE_LOADED__ = true;

/* --------------------------------------------------------
   Helpers
-------------------------------------------------------- */
const $ = (id) => document.getElementById(id);

/* --------------------------------------------------------
   DOM
-------------------------------------------------------- */
const quoteBtn = $("quote-btn");
const quoteBox = $("quote-box");
const quoteText = $("quote-text");
const quoteAuthor = $("quote-author");
const quoteMeaning = $("quote-meaning");
const quoteInstruction = $("quote-instruction");
const quoteCategory = $("quote-category");
const quoteTags = $("quote-tags");

const copyBtn = $("copy-btn");
const copyFeedback = $("copy-feedback");
const shareBtn = $("share-btn");

const whatsappBtn = $("whatsapp-btn");
const smsBtn = $("sms-btn");
const messengerBtn = $("messenger-btn");

const REQUIRED = [
  quoteBtn,
  quoteBox,
  quoteText,
  quoteAuthor,
  quoteMeaning,
  quoteInstruction,
  quoteCategory,
  quoteTags,
  copyBtn,
  copyFeedback,
  shareBtn,
  whatsappBtn,
  smsBtn,
  messengerBtn
].every(Boolean);

if (!REQUIRED) {
  console.warn("[CalmDownQuotes] Missing required DOM nodes. Script disabled.");
}

/* --------------------------------------------------------
   Embedded fallback dataset
-------------------------------------------------------- */
const FALLBACK_QUOTES = [
  {
    quote: "You don’t have to control your thoughts. You just have to stop letting them control you.",
    author: "Dan Millman",
    meaning: "Thoughts are not commands. Create space between what you think and what you do.",
    instruction: "Name the thought. Then say: “That’s a thought, not a fact.” Take one slow breath.",
    category: "Anxiety",
    tags: ["calm", "mindfulness", "anxiety", "perspective"]
  },
  {
    quote: "Almost everything will work again if you unplug it for a few minutes — including you.",
    author: "Anne Lamott",
    meaning: "Rest is a reset. Your nervous system needs pauses to return to baseline.",
    instruction: "Step away from screens for 3 minutes. Look at something far away. Relax your jaw.",
    category: "Reset",
    tags: ["reset", "rest", "nervous system"]
  },
  {
    quote: "Feelings are visitors. Let them come and go.",
    author: "Mooji",
    meaning: "You can experience emotion without building a story around it.",
    instruction: "Locate the feeling in your body. Breathe into that area for 5 breaths.",
    category: "Emotional Regulation",
    tags: ["emotion", "acceptance", "breathing"]
  }
];

/* --------------------------------------------------------
   Config
-------------------------------------------------------- */
const CONFIG = {
  QUOTES_URL: "quotes.json",
  USE_DAILY_MODE_BY_DEFAULT: true,
  HISTORY_SIZE: 6,
  SCROLL_INTO_VIEW: true,
  STORAGE_KEY: "cdq:v2"
};

const prefersReducedMotion = (() => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
})();

/* --------------------------------------------------------
   State
-------------------------------------------------------- */
const state = {
  quotes: [...FALLBACK_QUOTES],
  history: [],
  ready: false
};

/* --------------------------------------------------------
   Utilities
-------------------------------------------------------- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const safeText = (s) => (s ?? "").toString().trim();

function isValidQuoteItem(item) {
  return item && typeof item === "object" && safeText(item.quote).length > 0;
}

function normalizeItem(item) {
  return {
    quote: safeText(item.quote),
    author: safeText(item.author),
    meaning: safeText(item.meaning),
    instruction: safeText(item.instruction),
    category: safeText(item.category),
    tags: Array.isArray(item.tags)
      ? item.tags.map((t) => safeText(t)).filter(Boolean)
      : []
  };
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* --------------------------------------------------------
   Daily deterministic selection
-------------------------------------------------------- */
function dailyIndex(total) {
  if (total <= 0) return 0;
  const now = new Date();
  const dayKey = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let x = dayKey ^ (dayKey >>> 16);
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  return Math.abs(x) % total;
}

/* --------------------------------------------------------
   Persistence
-------------------------------------------------------- */
function loadPersisted() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.history)) {
      state.history = data.history.slice(0, CONFIG.HISTORY_SIZE);
    }
  } catch {}
}

function persist() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ history: state.history }));
  } catch {}
}

/* --------------------------------------------------------
   Rendering
-------------------------------------------------------- */
function setCard(item) {
  const q = normalizeItem(item);
  quoteText.textContent = q.quote;
  quoteAuthor.textContent = q.author ? `— ${q.author}` : "";
  quoteMeaning.textContent = q.meaning;
  quoteInstruction.textContent = q.instruction;
  quoteCategory.textContent = q.category;
  quoteTags.textContent = q.tags.join(", ");
}

function showCard() {
  quoteBox.classList.remove("hidden");
  quoteBtn.setAttribute("aria-expanded", "true");

  if (prefersReducedMotion) {
    quoteBox.classList.add("visible");
  } else {
    requestAnimationFrame(() => quoteBox.classList.add("visible"));
  }
}

function scrollCardIntoView() {
  if (!CONFIG.SCROLL_INTO_VIEW) return;
  try {
    quoteBox.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  } catch {}
}

/* --------------------------------------------------------
   Selection logic
-------------------------------------------------------- */
function remember(item) {
  const key = safeText(item.quote);
  if (!key) return;
  state.history.unshift(key);
  state.history = Array.from(new Set(state.history)).slice(0, CONFIG.HISTORY_SIZE);
  persist();
}

function pickNonRepeatingRandom(list) {
  if (list.length <= 1) return list[0];
  const attempts = clamp(list.length, 3, 12);

  for (let i = 0; i < attempts; i++) {
    const candidate = pickRandom(list);
    if (!state.history.includes(candidate.quote)) return candidate;
  }
  return pickRandom(list);
}

function getDailyItem(list) {
  return list[dailyIndex(list.length)] ?? list[0];
}

/* --------------------------------------------------------
   Data loading
-------------------------------------------------------- */
async function loadQuotesFromJson() {
  try {
    const res = await fetch(CONFIG.QUOTES_URL, {
      cache: "no-store",
      mode: "same-origin"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid JSON format");

    const cleaned = data.filter(isValidQuoteItem).map(normalizeItem);
    if (cleaned.length) {
      state.quotes = cleaned;
      return true;
    }
  } catch (err) {
    console.warn("[CalmDownQuotes] Using embedded quotes:", err?.message || err);
  }
  return false;
}

/* --------------------------------------------------------
   Copy / Share
-------------------------------------------------------- */
function getCurrentItemForSharing() {
  return normalizeItem({
    quote: quoteText.textContent,
    author: quoteAuthor.textContent.replace(/^—\s*/, ""),
    meaning: quoteMeaning.textContent,
    instruction: quoteInstruction.textContent,
    category: quoteCategory.textContent,
    tags: quoteTags.textContent
      ? quoteTags.textContent.split(",").map((t) => t.trim())
      : []
  });
}

function formatShareText(item) {
  const lines = [`"${item.quote}"`];
  if (item.author) lines.push(`— ${item.author}`);
  if (item.meaning) lines.push("", `Meaning: ${item.meaning}`);
  if (item.instruction) lines.push("", `Try this: ${item.instruction}`);
  if (item.category) lines.push("", `Category: ${item.category}`);
  if (item.tags.length) lines.push("", `Tags: ${item.tags.join(", ")}`);
  return lines.join("\n");
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

let feedbackTimer;
function showCopyFeedback(msg) {
  copyFeedback.textContent = msg;
  copyFeedback.classList.add("visible");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => copyFeedback.classList.remove("visible"), 1400);
}

async function handleCopy() {
  try {
    await copyToClipboard(formatShareText(getCurrentItemForSharing()));
    showCopyFeedback("Copied");
  } catch {
    showCopyFeedback("Copy failed");
  }
}

async function handleShare() {
  const text = formatShareText(getCurrentItemForSharing());
  if (navigator.share) {
    try {
      await navigator.share({ title: "Calm Down Quotes", text, url: location.href });
      return;
    } catch {}
  }
  try {
    await copyToClipboard(text);
    showCopyFeedback("Copied to share");
  } catch {
    showCopyFeedback("Share failed");
  }
}

function handleAppShare(app) {
  const text = encodeURIComponent(
    formatShareText(getCurrentItemForSharing()) + "\n\n" + location.href
  );

  let url;
  if (app === "whatsapp") url = `whatsapp://send?text=${text}`;
  if (app === "sms") url = `sms:?body=${text}`;
  if (app === "messenger") {
    url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${text}`;
  }

  if (url) window.open(url, "_blank");
}

/* --------------------------------------------------------
   Core action
-------------------------------------------------------- */
function generateQuote({ mode = "default" } = {}) {
  const list = state.quotes.length ? state.quotes : FALLBACK_QUOTES;
  const useDaily = mode === "daily" || (mode === "default" && CONFIG.USE_DAILY_MODE_BY_DEFAULT);
  const item = useDaily ? getDailyItem(list) : pickNonRepeatingRandom(list);

  setCard(item);
  showCard();
  remember(item);
  scrollCardIntoView();
}

/* --------------------------------------------------------
   Events
-------------------------------------------------------- */
function wireEvents() {
  quoteBtn.addEventListener("click", () => generateQuote({ mode: "random" }));
  copyBtn.addEventListener("click", handleCopy);
  shareBtn.addEventListener("click", handleShare);

  whatsappBtn.addEventListener("click", () => handleAppShare("whatsapp"));
  smsBtn.addEventListener("click", () => handleAppShare("sms"));
  messengerBtn.addEventListener("click", () => handleAppShare("messenger"));

  document.addEventListener("keydown", (e) => {
    const ae = document.activeElement;
    if (
      e.key?.toLowerCase() === "g" &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      ae &&
      ae.tagName !== "INPUT" &&
      ae.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      generateQuote({ mode: "random" });
    }
  });
}

/* --------------------------------------------------------
   Init
-------------------------------------------------------- */
async function init() {
  if (!REQUIRED) return;

  loadPersisted();
  await loadQuotesFromJson();

  state.ready = true;
  quoteBtn.setAttribute("aria-expanded", "false");

  if (CONFIG.USE_DAILY_MODE_BY_DEFAULT && quoteBox.classList.contains("hidden")) {
    generateQuote({ mode: "daily" });
  }

  wireEvents();
}

init();
