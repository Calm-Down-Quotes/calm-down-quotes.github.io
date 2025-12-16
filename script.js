"use strict";

/**
 * Calm Down Quotes — Script v2 (hardened + scalable)
 *
 * Goals:
 * - Stable DOM + visibility model (.hidden display, .visible animation state)
 * - Optional quotes.json loading (with embedded fallback)
 * - Daily quote mode (same quote for a given day) + random mode on demand
 * - No immediate repeats
 * - Better a11y and safer fallbacks for copy/share
 */

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
  shareBtn
].every(Boolean);

if (!REQUIRED) {
  // Fail fast without throwing (prevents blank page due to JS error)
  console.warn("[CalmDownQuotes] Missing required DOM nodes. Script disabled.");
}

/* --------------------------------------------------------
   Embedded fallback dataset
   (Keep small here; move to quotes.json for scale.)
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
  QUOTES_URL: "quotes.json",     // optional external file
  USE_DAILY_MODE_BY_DEFAULT: true,
  HISTORY_SIZE: 6,              // prevents immediate repeats
  SCROLL_INTO_VIEW: true,
  STORAGE_KEY: "cdq:v2"
};

const prefersReducedMotion = (() => {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeText(s) {
  return (s ?? "").toString().trim();
}

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

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Deterministic daily index (same quote each day across devices)
 * Uses UTC date to keep consistent globally. If you want local day, change to local date parts.
 */
function dailyIndex(total) {
  if (total <= 0) return 0;
  const now = new Date();
  const dayKey = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // Simple integer hash
  let x = dayKey ^ (dayKey >>> 16);
  x = Math.imul(x, 0x45d9f3b);
  x = x ^ (x >>> 16);
  return Math.abs(x) % total;
}

function formatShareText(item) {
  const lines = [];
  lines.push(`"${item.quote}"`);
  if (item.author) lines.push(`— ${item.author}`);

  if (item.meaning) {
    lines.push("");
    lines.push(`Meaning: ${item.meaning}`);
  }

  if (item.instruction) {
    lines.push("");
    lines.push(`Try this: ${item.instruction}`);
  }

  if (item.category) {
    lines.push("");
    lines.push(`Category: ${item.category}`);
  }

  // Tags only if present
  if (item.tags && item.tags.length) {
    lines.push("");
    lines.push(`Tags: ${item.tags.join(", ")}`);
  }

  return lines.join("\n").trim();
}

/* --------------------------------------------------------
   Persistence (history only; safe + minimal)
-------------------------------------------------------- */
function loadPersisted() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.history)) state.history = data.history.slice(0, CONFIG.HISTORY_SIZE);
  } catch {
    // ignore
  }
}

function persist() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ history: state.history }));
  } catch {
    // ignore
  }
}

/* --------------------------------------------------------
   Rendering
-------------------------------------------------------- */
function setCard(item) {
  const normalized = normalizeItem(item);

  quoteText.textContent = normalized.quote;
  quoteAuthor.textContent = normalized.author ? `— ${normalized.author}` : "";
  quoteMeaning.textContent = normalized.meaning || "";
  quoteInstruction.textContent = normalized.instruction || "";
  quoteCategory.textContent = normalized.category || "";
  quoteTags.textContent = normalized.tags.length ? normalized.tags.join(", ") : "";

  // Optional: hide empty sections if desired (future upgrade)
  // For now, keep consistent layout.
}

function showCard() {
  quoteBox.classList.remove("hidden");

  // a11y: stateful toggle
  quoteBtn.setAttribute("aria-expanded", "true");

  if (prefersReducedMotion) {
    quoteBox.classList.add("visible");
    return;
  }

  requestAnimationFrame(() => {
    quoteBox.classList.add("visible");
  });
}

function scrollCardIntoView() {
  if (!CONFIG.SCROLL_INTO_VIEW) return;

  try {
    quoteBox.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  } catch {
    // ignore
  }
}

/* --------------------------------------------------------
   Selection logic (daily + random + no-repeat)
-------------------------------------------------------- */
function remember(item) {
  // Use quote string as the identity key
  const key = safeText(item.quote);
  if (!key) return;

  state.history.unshift(key);
  state.history = Array.from(new Set(state.history)); // de-dupe
  state.history = state.history.slice(0, CONFIG.HISTORY_SIZE);
  persist();
}

function pickNonRepeatingRandom(list) {
  if (list.length <= 1) return list[0];

  // Try a few times to avoid immediate repeats
  const attempts = clamp(list.length, 3, 12);
  for (let i = 0; i < attempts; i++) {
    const candidate = pickRandom(list);
    if (!state.history.includes(safeText(candidate.quote))) return candidate;
  }

  // If everything is in history, just pick random
  return pickRandom(list);
}

function getDailyItem(list) {
  const idx = dailyIndex(list.length);
  return list[idx] || list[0];
}

/* --------------------------------------------------------
   Data loading (optional quotes.json)
   Expected format:
   [
     { "quote": "...", "author": "...", "meaning": "...", "instruction": "...", "category": "...", "tags": ["..."] }
   ]
-------------------------------------------------------- */
async function loadQuotesFromJson() {
  try {
    const res = await fetch(CONFIG.QUOTES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("quotes.json must be an array");

    const cleaned = data.filter(isValidQuoteItem).map(normalizeItem);
    if (cleaned.length) {
      state.quotes = cleaned;
      return true;
    }
  } catch (err) {
    console.warn("[CalmDownQuotes] Using embedded quotes (quotes.json not loaded):", err?.message || err);
  }
  return false;
}

/* --------------------------------------------------------
   Copy / Share
-------------------------------------------------------- */
async function copyToClipboard(text) {
  const payload = safeText(text);
  if (!payload) throw new Error("Nothing to copy");

  // Modern API
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(payload);
    return;
  }

  // Fallback
  const textarea = document.createElement("textarea");
  textarea.value = payload;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!ok) throw new Error("Fallback copy failed");
}

let feedbackTimer = null;
function showCopyFeedback(msg) {
  copyFeedback.textContent = safeText(msg);
  copyFeedback.classList.add("visible");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    copyFeedback.classList.remove("visible");
  }, 1400);
}

function getCurrentItemForSharing() {
  return normalizeItem({
    quote: quoteText.textContent,
    author: quoteAuthor.textContent.replace(/^—\s*/, ""),
    meaning: quoteMeaning.textContent,
    instruction: quoteInstruction.textContent,
    category: quoteCategory.textContent,
    tags: quoteTags.textContent
      ? quoteTags.textContent.split(",").map((s) => s.trim()).filter(Boolean)
      : []
  });
}

async function handleCopy() {
  const item = getCurrentItemForSharing();
  const text = formatShareText(item);

  try {
    await copyToClipboard(text);
    showCopyFeedback("Copied");
  } catch {
    showCopyFeedback("Copy failed");
  }
}

async function handleShare() {
  const item = getCurrentItemForSharing();
  const text = formatShareText(item);

  // Web Share API (mobile-first)
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Calm Down Quotes",
        text,
        url: window.location.href
      });
      return;
    } catch {
      // User cancelled or share failed -> fall through
    }
  }

  // Fallback: copy
  try {
    await copyToClipboard(text);
    showCopyFeedback("Copied to share");
  } catch {
    showCopyFeedback("Share failed");
  }
}

/* --------------------------------------------------------
   Core action
-------------------------------------------------------- */
function generateQuote({ mode = "default" } = {}) {
  const list = state.quotes.length ? state.quotes : FALLBACK_QUOTES;

  let item;
  const useDaily = (mode === "daily") || (mode === "default" && CONFIG.USE_DAILY_MODE_BY_DEFAULT);

  if (useDaily) {
    item = getDailyItem(list);
  } else {
    item = pickNonRepeatingRandom(list);
  }

  setCard(item);
  showCard();
  remember(item);
  scrollCardIntoView();
}

/* --------------------------------------------------------
   Events / Wiring
-------------------------------------------------------- */
function wireEvents() {
  quoteBtn.addEventListener("click", () => generateQuote({ mode: "random" }));
  copyBtn.addEventListener("click", handleCopy);
  shareBtn.addEventListener("click", handleShare);

  // Keyboard shortcut (G = generate random)
  document.addEventListener("keydown", (e) => {
    if (!e || !e.key) return;
    const k = e.key.toLowerCase();
    if (k === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
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

  // Try external JSON first (optional)
  await loadQuotesFromJson();

  state.ready = true;

  // Set initial aria-expanded state
  quoteBtn.setAttribute("aria-expanded", "false");

  // Optional: show a daily quote on first load (comment out if you prefer blank start)
  if (CONFIG.USE_DAILY_MODE_BY_DEFAULT) {
    // only show if card is currently hidden (expected)
    if (quoteBox.classList.contains("hidden")) {
      generateQuote({ mode: "daily" });
    }
  }

  wireEvents();
}

init();
