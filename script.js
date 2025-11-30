"use strict";

/* ========================================================
   CONSTANTS
======================================================== */
const SITE_URL = "https://calm-down-quotes.github.io/";
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.png`;
const STORAGE_KEY = "calm_down_quotes_state_v3";
const TRANSITION_DURATION_MS = 350; // matches CSS transition

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ========================================================
   ANALYTICS HELPER
======================================================== */
function trackEvent(name, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  } catch {
    // Analytics should never break the app
  }
}

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

const subscribeBtn  = document.querySelector(".subscribe-btn");

/* ========================================================
   LOAD QUOTES AND INITIALISATION
======================================================== */
let quotes = [];
let quotesLoaded = false;

let shuffledIndices = [];
let currentIndex = 0;

/**
 * Returns a shuffled array of indices using a simple Fisher-Yates shuffle.
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
    // localStorage can fail in private mode or if storage is full
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
    // If saved state is not valid we fall back to a fresh shuffle
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

    trackEvent("quotes_loaded", { total_quotes: quotes.length });

    if (quotes.length > 0 && quoteBtn) {
      generateQuote();
    }
  } catch (err) {
    console.error("Error loading quotes:", err);
    trackEvent("quotes_load_error", {
      message: err && err.message ? String(err.message) : String(err)
    });

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
   TAG CHIPS
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
    quoteText.textContent        = (q?.quote || "").trim();
    quoteAuthor.textContent      = (q?.author || "").trim();
    quoteMeaning.textContent     = (q?.meaning || "").trim();
    quoteInstruction.textContent = (q?.instruction || "").trim();
    quoteCategory.textContent    = (q?.category || "").trim();
    renderTagChips(q?.tags);

    quoteBox.classList.remove("hidden");

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
    quoteBox.classList.remove("visible");
    setTimeout(updateContent, TRANSITION_DURATION_MS);
  } else {
    updateContent();
  }

  trackEvent("quote_generated", {
    index: currentIndex - 1,
    total_quotes: quotes.length
  });
}

quoteBtn?.addEventListener("click", generateQuote);

/* Keyboard support: Space, Enter, or ArrowRight for the next quote */
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
    trackEvent("quote_keyboard_shortcut", { key: event.key });
    generateQuote();
  }
});

/* ========================================================
   SHARE TEXT FORMATTER
======================================================== */
function buildShareText() {
  const q = quoteText.textContent.trim();
  if (!q) return "";

  const authorLine = quoteAuthor.textContent.trim();

  const parts = [
    `"${q}"`,
    authorLine ? `by ${authorLine}` : "",
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
    trackEvent("quote_copied");
    if (copyFeedback) {
      copyFeedback.textContent = "Copied.";
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

  trackEvent("share_whatsapp");

  window.open(
    `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
});

smsBtn?.addEventListener("click", () => {
  const text = requireShareText();
  if (!text) return;

  trackEvent("share_sms");

  window.location.href = `sms:?body=${encodeURIComponent(text)}`;
});

messengerBtn?.addEventListener("click", () => {
  const text = requireShareText();
  if (!text) return;

  const appId = "123"; // replace with a real Facebook App ID if you ever use this
  trackEvent("share_messenger");

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

  trackEvent("share_pinterest");

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

  trackEvent("share_instagram");

  alert(
    "The full quote has been copied. Open Instagram, create a Story or Post, and paste the text."
  );

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // If clipboard write fails we do not need to show another message
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
      trackEvent("share_native");
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
      trackEvent("share_fallback_copy");
      if (copyFeedback) {
        copyFeedback.textContent = "Share text copied.";
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
   SUBSCRIBE CLICK TRACKING
======================================================== */
subscribeBtn?.addEventListener("click", () => {
  trackEvent("subscribe_click", { location: "home_subscribe_section" });
});

/* ========================================================
   SWIPE GESTURE ON MOBILE
======================================================== */
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener(
  "touchstart",
  (e) => {
    const touch = e.touches?.[0];
    touchStartX = touch?.clientX || 0;
    touchStartY = touch?.clientY || 0;
  },
  { passive: true }
);

document.addEventListener(
  "touchend",
  (e) => {
    const touch = e.changedTouches?.[0];
    const endX = touch?.clientX || 0;
    const endY = touch?.clientY || 0;

    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;

    // Only trigger on a clear horizontal swipe
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      trackEvent("quote_swiped");
      generateQuote();
    }
  },
  { passive: true }
);
