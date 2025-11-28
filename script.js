"use strict";

/* ========================================================
   CONSTANTS
======================================================== */
const SITE_URL = "https://calm-down-quotes.github.io/";
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.png`;

/* ========================================================
   DOM REFERENCES
======================================================== */
const quoteBtn         = document.getElementById("quote-btn");

const quoteBox         = document.getElementById("quote-box");
const quoteText        = document.getElementById("quote-text");
const quoteAuthor      = document.getElementById("quote-author");
const quoteMeaning     = document.getElementById("quote-meaning");
const quoteInstruction = document.getElementById("quote-instruction");

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
let lastIndex    = -1;      // to avoid repeating same quote

async function loadQuotes() {
    try {
        // Allow browser caching for better performance on repeat visits.
        const res = await fetch("quotes.json");

        if (!res.ok) {
            throw new Error(`quotes.json unreachable (status: ${res.status})`);
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("quotes.json is empty or invalid.");
        }

        quotes       = data;
        quotesLoaded = true;
    } catch (err) {
        console.error(err);

        if (quoteText)        quoteText.textContent        = "Unable to load quotes.";
        if (quoteMeaning)     quoteMeaning.textContent     = "Please check back later.";
        if (quoteAuthor)      quoteAuthor.textContent      = "";
        if (quoteInstruction) quoteInstruction.textContent = "";

        if (quoteBox) {
            quoteBox.classList.remove("hidden");
            quoteBox.classList.add("visible");
        }
    }
}

loadQuotes();


/* ========================================================
   GENERATE QUOTE (ENSURE DIFFERENT)
======================================================== */
function generateQuote() {
    if (!quotesLoaded || !quotes.length) return;
    if (!quoteText || !quoteAuthor || !quoteMeaning || !quoteInstruction || !quoteBox) return;

    // Pick an index different from the last one (if possible)
    let index;
    if (quotes.length === 1) {
        index = 0;
    } else {
        do {
            index = Math.floor(Math.random() * quotes.length);
        } while (index === lastIndex && quotes.length > 1);
    }
    lastIndex = index;

    const q = quotes[index] || {};

    quoteText.textContent        = (q.quote || "").trim();
    quoteAuthor.textContent      = (q.author || "").trim();
    quoteMeaning.textContent     = (q.meaning || "").trim();
    quoteInstruction.textContent = (q.instruction || "").trim();

    // Ensure box is shown
    quoteBox.classList.remove("hidden");

    // Restart animation
    quoteBox.classList.remove("visible");
    // Force reflow to restart CSS transition
    void quoteBox.offsetWidth;
    quoteBox.classList.add("visible");
}

quoteBtn?.addEventListener("click", generateQuote);


/* ========================================================
   BUILD / ENSURE SHARE TEXT
======================================================== */
function buildShareText() {
    if (!quoteText) return "";

    const q = (quoteText.textContent || "").trim();
    if (!q) return "";

    const a = quoteAuthor      ? (quoteAuthor.textContent || "").trim()      : "";
    const m = quoteMeaning     ? (quoteMeaning.textContent || "").trim()     : "";
    const i = quoteInstruction ? (quoteInstruction.textContent || "").trim() : "";

    const parts = [
        q,
        a,
        "",
        m,
        "",
        i,
        "",
        "Shared from Calm Down Quotes",
        SITE_URL.replace(/\/+$/, "/")  // ensure trailing slash only once
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
   COPY TO CLIPBOARD
======================================================== */
copyBtn?.addEventListener("click", async () => {
    const text = getShareTextOrWarn();
    if (!text) return;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "absolute";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }

        if (copyFeedback) {
            // Ensure text is present for visual + screen-reader feedback
            copyFeedback.textContent = "Copied";
            copyFeedback.classList.add("visible");

            setTimeout(() => {
                copyFeedback.classList.remove("visible");
            }, 1500);
        }
    } catch (err) {
        console.error("Copy failed:", err);
        alert("Unable to copy this quote on this device.");
    }
});


/* ========================================================
   WHATSAPP
======================================================== */
whatsappBtn?.addEventListener("click", () => {
    const text = getShareTextOrWarn();
    if (!text) return;

    const encoded = encodeURIComponent(text);
    window.open(
        `https://api.whatsapp.com/send?text=${encoded}`,
        "_blank",
        "noopener,noreferrer"
    );
});


/* ========================================================
   SMS
======================================================== */
smsBtn?.addEventListener("click", () => {
    const text = getShareTextOrWarn();
    if (!text) return;

    const encoded = encodeURIComponent(text);
    // SMS URL schemes vary by platform; this is the broadest safe form.
    window.location.href = `sms:?body=${encoded}`;
});


/* ========================================================
   FACEBOOK MESSENGER
======================================================== */
messengerBtn?.addEventListener("click", () => {
    const link = encodeURIComponent(SITE_URL);
    window.open(
        `https://www.messenger.com/share/?link=${link}`,
        "_blank",
        "noopener,noreferrer"
    );
});


/* ========================================================
   PINTEREST
======================================================== */
pinterestBtn?.addEventListener("click", () => {
    const description = buildShareText();
    if (!description) {
        alert("Please generate a quote first.");
        return;
    }

    const url = encodeURIComponent(SITE_URL);
    const img = encodeURIComponent(PREVIEW_IMAGE_URL);

    window.open(
        `https://pinterest.com/pin/create/button/?url=${url}&media=${img}&description=${encodeURIComponent(description)}`,
        "_blank",
        "noopener,noreferrer"
    );
});


/* ========================================================
   INSTAGRAM (COPY + INSTRUCTIONS)
======================================================== */
instagramBtn?.addEventListener("click", async () => {
    const text = getShareTextOrWarn();
    if (!text) return;

    alert(
        "Instagram only allows photo/video story uploads.\n\n" +
        "Your quote will be copied. Then:\n" +
        "1. Open Instagram\n" +
        "2. Create a Story or Reel\n" +
        "3. Paste the text onto the screen."
    );

    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Silent fail – user still got the instructions.
        }
    }
});


/* ========================================================
   NATIVE SHARE (MOBILE)
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
        } catch {
            // user cancelled or share failed silently
        }
    } else {
        alert("Native sharing is not supported on this device.");
    }
});


/* ========================================================
   SWIPE LEFT / RIGHT FOR NEW QUOTE
======================================================== */
let startX = 0;

document.addEventListener("touchstart", (e) => {
    if (!e.touches?.length) return;
    startX = e.touches[0].clientX;
});

document.addEventListener("touchend", (e) => {
    if (!e.changedTouches?.length) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) < 60) return;   // small swipe, ignore

    generateQuote();
});
