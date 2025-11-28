"use strict";

/* ========================================================
   CONSTANTS
======================================================== */
const SITE_URL = "https://calm-down-quotes.github.io/";
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.png`;
const STORAGE_KEY = "calm_down_quotes_state_v2"; // NEW VERSION FOR CLEAN STATE

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
const tagsContainer    = document.getElementById("quote-tags");

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

// Avoid repeats
let shuffledIndices = [];
let currentPointer  = 0;

async function loadQuotes() {
    try {
        const res = await fetch("quotes.json");
        if (!res.ok) throw new Error(`quotes.json unreachable (status: ${res.status})`);

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0)
            throw new Error("quotes.json invalid or empty.");

        quotes = data;
        quotesLoaded = true;
        initQuoteOrder();

    } catch (err) {
        console.error(err);

        quoteText.textContent        = "Unable to load quotes.";
        quoteMeaning.textContent     = "Please check back later.";
        quoteAuthor.textContent      = "";
        quoteInstruction.textContent = "";
        quoteCategory.textContent    = "";

        tagsContainer.innerHTML = "";

        quoteBox.classList.remove("hidden");
        quoteBox.classList.add("visible");
    }
}

loadQuotes();

/* ========================================================
   QUOTE ORDERING SYSTEM
======================================================== */
function shuffleArray(len) {
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
            JSON.stringify({ order: shuffledIndices, pointer: currentPointer })
        );
    } catch (_) {}
}

function initQuoteOrder() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const state = JSON.parse(raw);
            if (
                Array.isArray(state.order) &&
                typeof state.pointer === "number" &&
                state.order.length === quotes.length
            ) {
                shuffledIndices = state.order;
                currentPointer  = Math.min(
                    Math.max(0, state.pointer),
                    shuffledIndices.length
                );
                return;
            }
        }
    } catch (_) {}

    shuffledIndices = shuffleArray(quotes.length);
    currentPointer  = 0;
    saveState();
}

/* ========================================================
   RENDER TAG CHIPS
======================================================== */
function renderTagChips(tags) {
    tagsContainer.innerHTML = "";

    if (Array.isArray(tags)) {
        tags.forEach(tag => {
            const chip = document.createElement("span");
            chip.textContent = tag;
            chip.className = "tag-chip";
            tagsContainer.appendChild(chip);
        });
    } else if (typeof tags === "string" && tags.trim() !== "") {
        const chip = document.createElement("span");
        chip.textContent = tags;
        chip.className = "tag-chip";
        tagsContainer.appendChild(chip);
    }
}

/* ========================================================
   GENERATE QUOTE
======================================================== */
function generateQuote() {
    if (!quotesLoaded || quotes.length === 0) return;

    if (currentPointer >= shuffledIndices.length) {
        shuffledIndices = shuffleArray(quotes.length);
        currentPointer = 0;
    }

    const q = quotes[shuffledIndices[currentPointer++]];
    saveState();

    quoteText.textContent        = (q.quote || "").trim();
    quoteAuthor.textContent      = (q.author || "").trim();
    quoteMeaning.textContent     = (q.meaning || "").trim();
    quoteInstruction.textContent = (q.instruction || "").trim();
    quoteCategory.textContent    = (q.category || "").trim();

    renderTagChips(q.tags);

    quoteBox.classList.remove("hidden");

    // Reset animation
    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth;
    quoteBox.classList.add("visible");
}

quoteBtn?.addEventListener("click", generateQuote);

/* ========================================================
   SHARE TEXT BUILDER
======================================================== */
function buildShareText() {
    const q  = quoteText.textContent.trim();
    const a  = quoteAuthor.textContent.trim();
    const m  = quoteMeaning.textContent.trim();
    const i  = quoteInstruction.textContent.trim();
    const c  = quoteCategory.textContent.trim();
    const tags = Array.from(tagsContainer.children).map(t => t.textContent).join(", ");

    const parts = [
        q,
        a,
        "",
        m,
        "",
        i,
        "",
        c ? `Category: ${c}` : "",
        tags ? `Tags: ${tags}` : "",
        "",
        "Shared from Calm Down Quotes",
        SITE_URL
    ].filter(Boolean);

    return parts.join("\n");
}

function mustGetShareText() {
    const text = buildShareText();
    if (!text.trim()) {
        alert("Please generate a quote first.");
        return null;
    }
    return text;
}

/* ========================================================
   COPY TO CLIPBOARD
======================================================== */
copyBtn?.addEventListener("click", async () => {
    const text = mustGetShareText();
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);

        copyFeedback.textContent = "Copied";
        copyFeedback.classList.add("visible");

        setTimeout(() => {
            copyFeedback.classList.remove("visible");
        }, 1500);

    } catch (err) {
        alert("Copy not supported on this device.");
    }
});

/* ========================================================
   SOCIAL SHARE BUTTONS
======================================================== */
whatsappBtn?.addEventListener("click", () => {
    const text = mustGetShareText();
    if (!text) return;

    window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
        "_blank","noopener,noreferrer"
    );
});

smsBtn?.addEventListener("click", () => {
    const text = mustGetShareText();
    if (!text) return;

    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
});

messengerBtn?.addEventListener("click", () => {
    window.open(
        `https://www.messenger.com/share/?link=${encodeURIComponent(SITE_URL)}`,
        "_blank","noopener,noreferrer"
    );
});

pinterestBtn?.addEventListener("click", () => {
    const text = mustGetShareText();
    if (!text) return;

    window.open(
        `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(SITE_URL)}&media=${encodeURIComponent(PREVIEW_IMAGE_URL)}&description=${encodeURIComponent(text)}`,
        "_blank","noopener,noreferrer"
    );
});

instagramBtn?.addEventListener("click", async () => {
    const text = mustGetShareText();
    if (!text) return;

    alert(
        "Instagram only accepts text via copy/paste.\n\n" +
        "Your quote has been copied.\n" +
        "Open Instagram → Create Story → Paste."
    );

    try { await navigator.clipboard.writeText(text); } catch {}
});

shareBtn?.addEventListener("click", async () => {
    const text = mustGetShareText();
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
        alert("Your device does not support native sharing.");
    }
});

/* ========================================================
   SWIPE GESTURE
======================================================== */
let touchStartX = 0;

document.addEventListener("touchstart", e => {
    if (e.touches.length) touchStartX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
    if (!e.changedTouches.length) return;
    const diff = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(diff) > 60) generateQuote();
});
