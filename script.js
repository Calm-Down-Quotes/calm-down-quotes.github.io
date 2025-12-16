"use strict";

/* ========================================================
   CONSTANTS
======================================================== */
const SITE_URL = "https://calm-down-quotes.github.io/";
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.png`;
const STORAGE_KEY = "calm_down_quotes_state_v3";

/**
 * Keep this aligned to the CSS transition on #quote-box.
 * Your CSS uses 0.35s, so 350ms is correct.
 */
const TRANSITION_DURATION_MS = 350;

const PREFERS_REDUCED_MOTION =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ========================================================
   DOM REFERENCES
   (Only initialise the app if the core elements exist.)
======================================================== */
const quoteBtn = document.getElementById("quote-btn");
const quoteBox = document.getElementById("quote-box");

/* If this script is loaded on legal pages, do nothing quietly. */
if (!quoteBtn || !quoteBox) {
  // No app shell present — exit without side effects.
} else {
  const quoteText = document.getElementById("quote-text");
  const quoteAuthor = document.getElementById("quote-author");
  const quoteMeaning = document.getElementById("quote-meaning");
  const quoteInstruction = document.getElementById("quote-instruction");
  const quoteCategory = document.getElementById("quote-category");
  const tagsContainer = document.getElementById("quote-tags");

  const copyBtn = document.getElementById("copy-btn");
  const copyFeedback = document.getElementById("copy-feedback");

  const whatsappBtn = document.getElementById("whatsapp-btn");
  const smsBtn = document.getElementById("sms-btn");
  const messengerBtn = document.getElementById("messenger-btn");
  const instagramBtn = document.getElementById("instagram-btn");
  const pinterestBtn = document.getElementById("pinterest-btn");
  const shareBtn = document.getElementById("share-btn");

  /* ========================================================
     STATE
  ========================================================= */
  let quotes = [];
  let quotesLoaded = false;

  let shuffledIndices = [];
  let currentIndex = 0;

  // Prevent overlapping transitions when users click rapidly
  let pendingSwapTimer = null;
  let isTransitioning = false;

  /* ========================================================
     HELPERS
  ========================================================= */
  function cleanText(v) {
    return (typeof v === "string" ? v : "").trim();
  }

  function isEditableElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    return (
      el.isContentEditable ||
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT"
    );
  }

  /**
   * Clipboard helper with a safe fallback for older browsers.
   */
  async function copyToClipboard(text) {
    const t = cleanText(text);
    if (!t) return false;

    // Modern API
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(t);
        return true;
      }
    } catch {
      // Fall through to legacy method
    }

    // Legacy fallback (best effort)
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);

      ta.focus();
      ta.select();

      const ok = document.execCommand && document.execCommand("copy");
      document.body.removeChild(ta);
      return Boolean(ok);
    } catch {
      return false;
    }
  }

  function setFeedback(msg, ms = 1500) {
    if (!copyFeedback) return;
    copyFeedback.textContent = msg;
    copyFeedback.classList.add("visible");
    window.setTimeout(() => copyFeedback.classList.remove("visible"), ms);
  }

  /* ========================================================
     SHUFFLE + PERSISTENCE
  ========================================================= */
  function shuffleIndices(len) {
    const arr = Array.from({ length: len }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ order: shuffledIndices, index: currentIndex })
      );
    } catch {
      // localStorage can fail (incognito, quota) – fail silently
    }
  }

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
          currentIndex = Math.max(0, Math.min(state.index, state.order.length - 1));
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

  /* ========================================================
     TAG CHIPS (BACKGROUND ONLY)
  ========================================================= */
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
     QUOTE RENDER
  ========================================================= */
  function revealQuoteBox() {
    quoteBox.classList.remove("hidden");

    if (PREFERS_REDUCED_MOTION) {
      quoteBox.classList.add("visible");
      return;
    }

    // Ensure animation reliably re-triggers
    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth; // force reflow
    quoteBox.classList.add("visible");
  }

  function updateQuoteContent(q) {
    if (!quoteText || !quoteAuthor || !quoteMeaning || !quoteInstruction || !quoteCategory) return;

    quoteText.textContent = cleanText(q?.quote);
    quoteAuthor.textContent = cleanText(q?.author);
    quoteMeaning.textContent = cleanText(q?.meaning);
    quoteInstruction.textContent = cleanText(q?.instruction);
    quoteCategory.textContent = cleanText(q?.category);
    renderTagChips(q?.tags);

    revealQuoteBox();

    const boxTop = quoteBox.getBoundingClientRect().top;
    if (boxTop < 0) {
      quoteBox.scrollIntoView({
        behavior: PREFERS_REDUCED_MOTION ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  /* ========================================================
     QUOTE GENERATOR
  ========================================================= */
  function generateQuote() {
    if (!quotesLoaded || quotes.length === 0) return;

    // If user hammers the button, cancel the prior swap timer and proceed cleanly
    if (pendingSwapTimer) {
      clearTimeout(pendingSwapTimer);
      pendingSwapTimer = null;
      isTransitioning = false;
    }

    if (currentIndex >= shuffledIndices.length) {
      shuffledIndices = shuffleIndices(quotes.length);
      currentIndex = 0;
    }

    const q = quotes[shuffledIndices[currentIndex]];
    currentIndex++;
    saveState();

    quoteBtn.textContent = "Give Me Another Quote";

    const doSwap = () => {
      updateQuoteContent(q);
      isTransitioning = false;
    };

    if (PREFERS_REDUCED_MOTION) {
      doSwap();
      return;
    }

    // Fade out old content, then swap
    isTransitioning = true;
    quoteBox.classList.remove("visible");

    pendingSwapTimer = window.setTimeout(() => {
      pendingSwapTimer = null;
      doSwap();
    }, TRANSITION_DURATION_MS);
  }

  quoteBtn.addEventListener("click", generateQuote);

  /* Keyboard support: Space / Enter / ArrowRight for next quote */
  document.addEventListener("keydown", (event) => {
    if (!quotesLoaded || isTransitioning) return;

    const active = document.activeElement;
    if (isEditableElement(active)) return;

    const canTrigger =
      active === document.body ||
      active === quoteBtn ||
      active?.tagName === "MAIN";

    if (!canTrigger) return;

    const key = event.key;

    if (key === " " || key === "Spacebar" || key === "Enter" || key === "ArrowRight") {
      event.preventDefault();
      generateQuote();
    }
  });

  /* ========================================================
     SHARE TEXT FORMATTER
  ========================================================= */
  function buildShareText() {
    const q = cleanText(quoteText?.textContent);
    if (!q) return "";

    const author = cleanText(quoteAuthor?.textContent);
    const meaning = cleanText(quoteMeaning?.textContent);
    const instruction = cleanText(quoteInstruction?.textContent);
    const category = cleanText(quoteCategory?.textContent);

    const tags =
      tagsContainer && tagsContainer.children.length
        ? Array.from(tagsContainer.children)
            .map((el) => cleanText(el.textContent))
            .filter(Boolean)
            .join(", ")
        : "";

    const parts = [
      `"${q}"`,
      author ? `— ${author}` : "",
      "",
      meaning || "",
      meaning ? "" : "",
      instruction || "",
      instruction ? "" : "",
      category ? `Category: ${category}` : "",
      tags ? `Tags: ${tags}` : "",
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
  ========================================================= */
  copyBtn?.addEventListener("click", async () => {
    const text = requireShareText();
    if (!text) return;

    const ok = await copyToClipboard(text);
    if (ok) {
      setFeedback("Copied", 1500);
    } else {
      alert("Copy is not supported on this device. Please use the Share button.");
    }
  });

  /* ========================================================
     SOCIAL SHARE BUTTONS
  ========================================================= */
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

    // Common approach; platform-specific quirks exist, but this is the standard baseline.
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  });

  messengerBtn?.addEventListener("click", () => {
    const text = requireShareText();
    if (!text) return;

    const appId = "123"; // Replace with real Facebook App ID if you ever enable this
    window.open(
      `https://www.facebook.com/dialog/send?app_id=${encodeURIComponent(appId)}&link=${encodeURIComponent(
        SITE_URL
      )}&quote=${encodeURIComponent(text)}`,
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
      )}&media=${encodeURIComponent(PREVIEW_IMAGE_URL)}&description=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  });

  instagramBtn?.addEventListener("click", async () => {
    const text = requireShareText();
    if (!text) return;

    alert("The quote has been copied. Open Instagram → create a Story/Post → paste the text.");
    await copyToClipboard(text); // best-effort
  });

  shareBtn?.addEventListener("click", async () => {
    const text = buildShareText();
    if (!text) return;

    const title = "Calm Down Quote";

    if (navigator.share) {
      // Try full text first; if a platform rejects it, fall back to shorter text.
      try {
        await navigator.share({ title, text, url: SITE_URL });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
        try {
          await navigator.share({ title, text: text.substring(0, 250), url: SITE_URL });
          return;
        } catch (e2) {
          if (e2 && e2.name === "AbortError") return;
          console.error("Error sharing:", e2);
        }
      }
    }

    // Fallback: copy share text
    const ok = await copyToClipboard(text);
    if (ok) {
      setFeedback("SHARE TEXT COPIED!", 2000);
    } else {
      alert("Sharing is not supported on this device.");
    }
  });

  /* ========================================================
     SWIPE GESTURE (MOBILE)
======================================================== */
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches?.[0]?.clientX || 0;
      touchStartY = e.touches?.[0]?.clientY || 0;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (!quotesLoaded || isTransitioning) return;

      const endX = e.changedTouches?.[0]?.clientX || 0;
      const endY = e.changedTouches?.[0]?.clientY || 0;

      const deltaX = endX - touchStartX;
      const deltaY = endY - touchStartY;

      // Only trigger on a mostly-horizontal swipe (avoid accidental triggers while scrolling)
      if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 40) {
        generateQuote();
      }
    },
    { passive: true }
  );

  /* ========================================================
     LOAD QUOTES & INITIALISATION
  ========================================================= */
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

      // Load the first quote immediately
      generateQuote();
    } catch (err) {
      console.error("Error loading quotes:", err);

      if (quoteText) quoteText.textContent = "Unable to load quotes.";
      if (quoteMeaning) quoteMeaning.textContent = "Please check back soon.";
      if (quoteAuthor) quoteAuthor.textContent = "";
      if (quoteInstruction) quoteInstruction.textContent = "";
      if (quoteCategory) quoteCategory.textContent = "";
      if (tagsContainer) tagsContainer.innerHTML = "";

      quoteBox.classList.remove("hidden");
      quoteBox.classList.add("visible");
    }
  }

  loadQuotes();
}
