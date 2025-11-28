"use strict";

/* ========================================================
   CONSTANTS
======================================================== */
const SITE_URL = "https://calm-down-quotes.github.io/";
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.png`;
const STORAGE_KEY = "calm_down_quotes_state_v3";
const TRANSITION_DURATION_MS = 350; // Matches CSS --transition

const PREFERS_REDUCED_MOTION =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ========================================================
   DOM REFERENCES
======================================================== */
const quoteBtn         = document.getElementById("quote-btn");
const quoteBox         = document.getElementById("quote-box");
const quoteText        = document.getElementById("quote-text");
const quoteAuthor      = document.getElementById("quote-author");
const quoteMeaning     = document.getElementById("quote-meaning");
const quoteInstruction = document.getElementById("quote-instruction");
const quoteCategory    = document.getElementById("quote-category");
const tagsContainer    = document.getElementById("quote-tags");

const copyBtn      = document.getElementById("copy-btn");
const copyFeedback = document.getElementById("copy-feedback");

const whatsappBtn   = document.getElementById("whatsapp-btn");
const smsBtn        = document.getElementById("sms-btn");
const messengerBtn  = document.getElementById("messenger-btn");
const instagramBtn  = document.getElementById("instagram-btn");
const pinterestBtn  = document.getElementById("pinterest-btn");
const shareBtn      = document.getElementById("share-btn");

/* ========================================================
   LOAD QUOTES & INITIALISATION
======================================================== */
let quotes = [];
let quotesLoaded = false;

let shuffledIndices = [];
let currentIndex = 0;

/**
 * Shuffles an array of indices using the Fisher-Yates algorithm.
 */
function shuffleIndices(len) {
  const arr = Array.from({ length: len }, (_, i) => i);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Saves the current shuffle state to localStorage.
 */
function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        order: shuffledIndices,
        index: currentIndex
      })
    );
  } catch {
    // localStorage can fail (incognito, quota) – fail silently
  }
}

/**
 * Initialises the quote order, either from saved state or a fresh shuffle.
 */
function initialiseOrder() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const state = JSON.parse(raw);

      if (
        Array.isArray(state.order) &&
        typeof state.index === "number" &&
        state.order.length === quotes.length
      ) {
        shuffledIndices = state.order;
        currentIndex = Math.max(
          0,
          Math.min(state.index, state.order.length - 1)
        );
        return;
      }
    }
  } catch {
    // If state is corrupt, fall through to fresh shuffle
  }

  shuffledIndices = shuffleIndices(quotes.length);
  currentIndex = 0;
  saveState();
}

/**
 * Fetches quotes from quotes.json and initialises the app state.
 */
async function loadQuotes() {
  try {
    const res = await fetch("quotes.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid or empty JSON");
    }

    quotes = data;
    quotesLoaded = true;

    initialiseOrder();

    // Trigger the first quote to load immediately upon success
    if (quotes.length > 0 && quoteBtn) {
      generateQuote();
    }
  } catch (err) {
    console.error("Error loading quotes:", err);

    if (!quoteBox) return;

    quoteText.textContent        = "Unable to load quotes.";
    quoteMeaning.textContent     = "Please check back soon.";
    quoteAuthor.textContent      = "";
    quoteInstruction.textContent = "";
    quoteCategory.textContent    = "";
    if (tagsContainer) tagsContainer.innerHTML = "";

    quoteBox.classList.remove("hidden");
    quoteBox.classList.add("visible");
  }
}

loadQuotes();

/* ========================================================
   TAG CHIPS (BACKGROUND ONLY)
======================================================== */
/**
 * Renders the tags as visual chips inside the tags container.
 */
function renderTagChips(tags) {
  if (!tagsContainer) return;

  tagsContainer.innerHTML = "";
  if (!tags) return;

  const list = Array.isArray(tags) ? tags : [tags];

  list
    .filter((t) => typeof t === "string" && t.trim() !== "")
    .forEach((t) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = t.trim();
      tagsContainer.appendChild(chip);
    });
}

/* ========================================================
   QUOTE GENERATOR
======================================================== */
/**
 * Generates and displays the next quote in the shuffled sequence.
 */
function generateQuote() {
  if (!quotesLoaded || quotes.length === 0 || !quoteBox) return;

  if (currentIndex >= shuffledIndices.length) {
    shuffledIndices = shuffleIndices(quotes.length);
    currentIndex = 0;
  }

  const q = quotes[shuffledIndices[currentIndex]];
  currentIndex++;
  saveState();

  if (quoteBtn) {
    quoteBtn.textContent = "Give Me Another Quote";
  }

  const updateContent = () => {
    // Update content
    quoteText.textContent        = (q?.quote || "").trim();
    quoteAuthor.textContent      = (q?.author || "").trim();
    quoteMeaning.textContent     = (q?.meaning || "").trim();
    quoteInstruction.textContent = (q?.instruction || "").trim();
    quoteCategory.textContent    = (q?.category || "").trim();
    renderTagChips(q?.tags);

    quoteBox.classList.remove("hidden");

    // Restart animation
    if (!PREFERS_REDUCED_MOTION) {
      quoteBox.classList.remove("visible");
      void quoteBox.offsetWidth; // force reflow
      quoteBox.classList.add("visible");
    } else {
      quoteBox.classList.add("visible");
    }

    const boxTop = quoteBox.getBoundingClientRect().top;
    if (boxTop < 0) {
      quoteBox.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!PREFERS_REDUCED_MOTION) {
    // Fade out old content, then swap
    quoteBox.classList.remove("visible");
    setTimeout(updateContent, TRANSITION_DURATION_MS);
  } else {
    updateContent();
  }
}

quoteBtn?.addEventListener("click", generateQuote);

/* Keyboard support: Space / Enter / ArrowRight for next quote */
document.addEventListener("keydown", (event) => {
  if (!quoteBtn) return;

  const active = document.activeElement;
  const canTrigger =
    active === document.body ||
    active === quoteBtn ||
    active?.tagName === "MAIN";

  if (!canTrigger) return;

  if (
    event.key === " " ||
    event.key === "Spacebar" ||
    event.key === "Enter" ||
    event.key === "ArrowRight"
  ) {
    event.preventDefault();
    generateQuote();
  }
});

/* ========================================================
   SHARE TEXT FORMATTER
======================================================== */
function buildShareText() {
  const q = quoteText.textContent.trim();
  if (!q) return "";

  const parts = [
    `"${q}"`,
    `— ${quoteAuthor.textContent.trim()}`,
    "",
    quoteMeaning.textContent.trim(),
    "",
    quoteInstruction.textContent.trim(),
    "",
    quoteCategory.textContent.trim()
      ? `Category: ${quoteCategory.textContent.trim()}`
      : "",
    tagsContainer && tagsContainer.children.length
      ? "Tags: " +
        Array.from(tagsContainer.children)
          .map((el) => el.textContent)
          .join(", ")
      : "",
    "",
    "Shared from Calm Down Quotes",
    SITE_URL
  ].filter(Boolean);

  return parts.join("\n");
}

function requireShareText() {
  const t = buildShareText();
  if (!t) {
    alert("Please generate a quote first.");
    return null;
  }
  return t;
}

/* ========================================================
   COPY BUTTON
======================================================== */
copyBtn?.addEventListener("click", async () => {
  const text = requireShareText();
  if (!text) return;

  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard API not available");
    }

    await navigator.clipboard.writeText(text);
    if (copyFeedback) {
      copyFeedback.textContent = "Copied";
      copyFeedback.classList.add("visible");
      setTimeout(() => copyFeedback.classList.remove("visible"), 1500);
    }
  } catch {
    alert("Copy is not supported on this device. Please use the Share button.");
  }
});

/* ========================================================
   SOCIAL SHARE BUTTONS
======================================================== */
whatsappBtn?.addEventListener("click", () => {
  const text = requireShareText();
  if (!text) return;

  window.open(
    `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
});

smsBtn?.addEventListener("click", () => {
  const text = requireShareText();
  if (!text) return;

  window.location.href = `sms:?body=${encodeURIComponent(text)}`;
});

messengerBtn?.addEventListener("click", () => {
  const text = requireShareText();
  if (!text) return;

  const appId = "123"; // Replace with real Facebook App ID if you ever use this
  window.open(
    `https://www.facebook.com/dialog/send?app_id=${encodeURIComponent(
      appId
    )}&link=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
});

pinterestBtn?.addEventListener("click", () => {
  const text = requireShareText();
  if (!text) return;

  window.open(
    `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
      SITE_URL
    )}&media=${encodeURIComponent(
      PREVIEW_IMAGE_URL
    )}&description=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
});

instagramBtn?.addEventListener("click", async () => {
  const text = requireShareText();
  if (!text) return;

  alert(
    "The full quote has been copied. Open Instagram → create a Story or Post → paste the text."
  );

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // Silent fail if clipboard write fails
  }
});

shareBtn?.addEventListener("click", async () => {
  const text = buildShareText();
  const shortTitle = "Calm Down Quote";
  if (!text) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: shortTitle,
        text: text.substring(0, 250),
        url: SITE_URL
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Error sharing:", e);
      }
    }
  } else {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        alert("Sharing is not supported on this device.");
        return;
      }
      await navigator.clipboard.writeText(text);
      if (copyFeedback) {
        copyFeedback.textContent = "SHARE TEXT COPIED!";
        copyFeedback.classList.add("visible");
        setTimeout(() => {
          copyFeedback.classList.remove("visible");
        }, 2000);
      }
    } catch {
      alert("Sharing is not supported on this device.");
    }
  }
});

/* ========================================================
   SWIPE GESTURE (MOBILE)
======================================================== */
let touchStartX = 0;

document.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches?.[0]?.clientX || 0;
  },
  { passive: true }
);

document.addEventListener(
  "touchend",
  (e) => {
    const endX = e.changedTouches?.[0]?.clientX || 0;
    const deltaX = endX - touchStartX;

    if (Math.abs(deltaX) > 60) {
      generateQuote();
    }
  },
  { passive: true }
);
