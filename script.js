"use strict";

/**
 * Calm Down Quotes — Script (stable DOM + visibility model)
 * - .hidden controls display
 * - .visible controls animation state
 */

const $ = (id) => document.getElementById(id);

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

// Replace / expand this dataset as you like
const QUOTES = [
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

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatShareText(item) {
  const lines = [
    `"${item.quote}"`,
    item.author ? `— ${item.author}` : "",
    "",
    item.meaning ? `Meaning: ${item.meaning}` : "",
    item.instruction ? `Try this: ${item.instruction}` : "",
    item.category ? `Category: ${item.category}` : ""
  ].filter(Boolean);

  return lines.join("\n");
}

function showCard() {
  // Make it render first
  quoteBox.classList.remove("hidden");

  // Next frame = animate in reliably
  requestAnimationFrame(() => {
    quoteBox.classList.add("visible");
  });
}

function setCard(item) {
  quoteText.textContent = item.quote || "";
  quoteAuthor.textContent = item.author ? `— ${item.author}` : "";
  quoteMeaning.textContent = item.meaning || "";
  quoteInstruction.textContent = item.instruction || "";
  quoteCategory.textContent = item.category || "";
  quoteTags.textContent = Array.isArray(item.tags) ? item.tags.join(", ") : "";
}

function generateQuote() {
  const item = pickRandom(QUOTES);
  setCard(item);
  showCard();

  // Optional: scroll the card into view once it exists
  quoteBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copyToClipboard(text) {
  // Modern API
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

let feedbackTimer = null;
function showCopyFeedback(msg) {
  copyFeedback.textContent = msg;
  copyFeedback.classList.add("visible");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    copyFeedback.classList.remove("visible");
  }, 1400);
}

function getCurrentItemForSharing() {
  return {
    quote: quoteText.textContent || "",
    author: quoteAuthor.textContent.replace(/^—\s*/, ""),
    meaning: quoteMeaning.textContent || "",
    instruction: quoteInstruction.textContent || "",
    category: quoteCategory.textContent || "",
    tags: quoteTags.textContent ? quoteTags.textContent.split(",").map(s => s.trim()) : []
  };
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
      // If user cancels share, silently ignore
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

/* Wire up events */
quoteBtn.addEventListener("click", generateQuote);
copyBtn.addEventListener("click", handleCopy);
shareBtn.addEventListener("click", handleShare);

/* Optional: keyboard shortcut (G = generate) */
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    generateQuote();
  }
});
