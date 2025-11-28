"use strict";

/* ========================================================
   CONSTANTS
======================================================== */
const SITE_URL = "https://calm-down-quotes.github.io/";
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.png`;
const STORAGE_KEY = "calm_down_quotes_state_v1";

/* ========================================================
   DOM REFERENCES
======================================================== */
const quoteBtn = document.getElementById("quote-btn");

const quoteBox         = document.getElementById("quote-box");
const quoteText        = document.getElementById("quote-text");
const quoteAuthor      = document.getElementById("quote-author");
const quoteMeaning     = document.getElementById("quote-meaning");
const quoteInstruction = document.getElementById("quote-instruction");
const quoteCategory    = document.getElementById("quote-category");
const quoteTags        = document.getElementById("quote-tags");

const copyBtn      = document.getElementById("copy-btn");
const copyFeedback = document.getElementById("copy-feedback");

const whatsappBtn   = document.getElementById("whatsapp-btn");
const smsBtn        = document.getElementById("sms-btn");
const messengerBtn  = document.getElementById("messenger-btn");
const shareBtn      = document.getElementById("share-btn");
const pinterestBtn  = document.getElementById("pinterest-btn");
const instagramBtn  = document.getElementById("instagram-btn");

/* ========================================================
   LOAD QUOTES
======================================================== */
let quotes       = [];
let quotesLoaded = false;

// order + pointer to avoid repeats
let shuffledIndices = [];
let currentPointer  = 0;

async function loadQuotes() {
    try {
        const res = await fetch("quotes.json");

        if (!res.ok) throw new Error(`quotes.json unreachable (status: ${res.status})`);

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("quotes.json is empty or invalid.");
        }

        quotes = data;
        quotesLoaded = true;

        initQuoteOrder();
    } catch (err) {
        console.error(err);

        quoteText.textContent = "Unable to load quotes.";
        quoteMeaning.textContent = "Please check back later.";
        quoteAuthor.textContent = "";
        quoteInstruction.textContent = "";
        quoteCategory.textContent = "";
        quoteTags.textContent = "";

        quoteBox.classList.remove("hidden");
        quoteBox.classList.add("visible");
    }
}

loadQuotes();

/* ========================================================
   QUOTE ORDER / STATE
======================================================== */
function createShuffledIndices(len) {
    const arr = Array.from({ length: len }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function saveQuoteState() {
    try {
        const state = {
            order: shuffledIndices,
            pointer: currentPointer,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
}

function initQuoteOrder() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const state = JSON.parse(raw);
            if (
                state &&
                Array.isArray(state.order) &&
                typeof state.pointer === "number" &&
                state.order.length === quotes.length
            ) {
                shuffledIndices = state.order.slice();
                currentPointer  = Math.min(Math.max(0, state.pointer), shuffledIndices.length);
                return;
            }
        }
    } catch (_) {}

    shuffledIndices = createShuffledIndices(quotes.length);
    currentPointer  = 0;
    saveQuoteState();
}

/* ========================================================
   GENERATE QUOTE
======================================================== */
function generateQuote() {
    if (!quotesLoaded || !quotes.length) return;

    if (currentPointer >= shuffledIndices.length) {
        shuffledIndices = createShuffledIndices(quotes.length);
        currentPointer = 0;
    }

    const index = shuffledIndices[currentPointer++];
    saveQuoteState();

    const q = quotes[index] || {};

    quoteText.textContent        = (q.quote || "").trim();
    quoteAuthor.textContent      = (q.author || "").trim();
    quoteMeaning.textContent     = (q.meaning || "").trim();
    quoteInstruction.textContent = (q.instruction || "").trim();
    quoteCategory.textContent    = (q.category || "").trim();
    quoteTags.textContent        = Array.isArray(q.tags) ? q.tags.join(", ") : (q.tags || "");

    quoteBox.classList.remove("hidden");

    // Restart animation
    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth;
    quoteBox.classList.add("visible");
}

quoteBtn?.addEventListener("click", generateQuote);

/* ========================================================
   SHARE TEXT BUILDER
======================================================== */
function buildShareText() {
    const q  = quoteText?.textContent?.trim() || "";
    const a  = quoteAuthor?.textContent?.trim() || "";
    const m  = quoteMeaning?.textContent?.trim() || "";
    const i  = quoteInstruction?.textContent?.trim() || "";
    const c  = quoteCategory?.textContent?.trim() || "";
    const tg = quoteTags?.textContent?.trim() || "";

    const parts = [
        q,
        a,
        "",
        m,
        "",
        i,
        "",
        c ? `Category: ${c}` : "",
        tg ? `Tags: ${tg}` : "",
        "",
        "Shared from Calm Down Quotes",
        SITE_URL
    ].filter(Boolean);

    return parts.join("\n");
}

function getShareTextOrWarn() {
    const text = buildShareText();
    if (!text) {
        alert("Please generate a quote first.");
        return null;
    }
    return text;
}

/* ========================================================
   COPY
======================================================== */
copyBtn?.addEventListener("click", async () => {
    const text = getShareTextOrWarn();
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);

        copyFeedback.textContent = "Copied";
        copyFeedback.classList.add("visible");
        setTimeout(() => copyFeedback.classList.remove("visible"), 1500);

    } catch (err) {
        alert("Unable to copy this quote on this device.");
    }
});

/* ========================================================
   WHATSAPP
======================================================== */
whatsappBtn?.addEventListener("click", () => {
    const text = getShareTextOrWarn();
    if (!text) return;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
                "_blank", "noopener,noreferrer");
});

/* ========================================================
   SMS
======================================================== */
smsBtn?.addEventListener("click", () => {
    const text = getShareTextOrWarn();
    if (!text) return;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
});

/* ========================================================
   MESSENGER
======================================================== */
messengerBtn?.addEventListener("click", () => {
    window.open(
        `https://www.messenger.com/share/?link=${encodeURIComponent(SITE_URL)}`,
        "_blank",
        "noopener,noreferrer"
    );
});

/* ========================================================
   PINTEREST
======================================================== */
pinterestBtn?.addEventListener("click", () => {
    const desc = getShareTextOrWarn();
    if (!desc) return;
    window.open(
        `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(SITE_URL)}&media=${encodeURIComponent(PREVIEW_IMAGE_URL)}&description=${encodeURIComponent(desc)}`,
        "_blank",
        "noopener,noreferrer"
    );
});

/* ========================================================
   INSTAGRAM
======================================================== */
instagramBtn?.addEventListener("click", async () => {
    const text = getShareTextOrWarn();
    if (!text) return;

    alert(
        "Instagram requires a Story or Reel.\n\n" +
        "Your quote has been copied.\n" +
        "Open Instagram and paste it on your Story."
    );

    try { await navigator.clipboard.writeText(text); } catch {}
});

/* ========================================================
   NATIVE SHARE
======================================================== */
shareBtn?.addEventListener("click", async () => {
    const text = getShareTextOrWarn();
    if (!text) return;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Calm Down Quote",
                text,
                url: SITE_URL
            });
        } catch {}
    } else {
        alert("Native sharing not supported on this device.");
    }
});

/* ========================================================
   SWIPE FOR NEW QUOTE
======================================================== */
let startX = 0;

document.addEventListener("touchstart", (e) => {
    if (e.touches.length) startX = e.touches[0].clientX;
});

document.addEventListener("touchend", (e) => {
    if (!e.changedTouches.length) return;
    const diff = e.changedTouches[0].clientX - startX;

    if (Math.abs(diff) > 60) generateQuote();
});
