/* ========================================================
   ELEMENT REFERENCES (Fast + Safe)
======================================================== */
const quoteBtn = document.getElementById("quote-btn");
const quoteBox = document.getElementById("quote-box");

const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");
const quoteMeaning = document.getElementById("quote-meaning");
const quoteInstruction = document.getElementById("quote-instruction");

const copyBtn = document.getElementById("copy-btn");
const copyFeedback = document.getElementById("copy-feedback");

const whatsappBtn = document.getElementById("whatsapp-btn");
const smsBtn = document.getElementById("sms-btn");
const messengerBtn = document.getElementById("messenger-btn");
const shareBtn = document.getElementById("share-btn");

/* ========================================================
   GLOBAL CONSTANTS
======================================================== */
const SITE_NAME = "Calm Down Quotes";
const SITE_URL = "https://calm-down-quotes.github.io/";

/* ========================================================
   LOAD QUOTES FROM JSON
======================================================== */
let quotes = [];
let quotesLoaded = false;

async function loadQuotes() {
    try {
        const response = await fetch("quotes.json", { cache: "no-store" });

        if (!response.ok) throw new Error("Failed to load quotes.json");

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Invalid or empty quotes.json");
        }

        quotes = data;
        quotesLoaded = true;

    } catch (error) {
        console.error("Quote loading error:", error);
        quoteText.textContent = "Unable to load quotes";
        quoteAuthor.textContent = "";
        quoteMeaning.textContent = "Please check back soon";
        quoteInstruction.textContent = "";
    }
}

loadQuotes();

/* ========================================================
   GENERATE NEW QUOTE
======================================================== */
function generateQuote() {
    if (!quotesLoaded || quotes.length === 0) return;

    const randomItem = quotes[Math.floor(Math.random() * quotes.length)];

    const rawQuote = randomItem.quote || "";
    const rawAuthor = randomItem.author || "";
    const rawMeaning = randomItem.meaning || "";
    const rawInstruction = randomItem.instruction || "";

    // Apply final formatting rules (no punctuation)
    quoteText.textContent = rawQuote.trim();
    quoteAuthor.textContent = rawAuthor.trim();
    quoteMeaning.textContent = rawMeaning.trim();
    quoteInstruction.textContent = rawInstruction.trim();

    // Reveal animation
    quoteBox.classList.remove("hidden");
    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth;
    quoteBox.classList.add("visible");
}

quoteBtn.addEventListener("click", generateQuote);

/* ========================================================
   COPY QUOTE TO CLIPBOARD
======================================================== */
copyBtn.addEventListener("click", async () => {
    const text = 
`${quoteText.textContent.trim()}
${quoteAuthor.textContent.trim()}

${quoteMeaning.textContent.trim()}

${quoteInstruction.textContent.trim()}

Shared from ${SITE_NAME}
${SITE_URL}`;

    if (!quoteText.textContent.trim()) return;

    try {
        await navigator.clipboard.writeText(text);

        copyFeedback.classList.add("visible");
        setTimeout(() => copyFeedback.classList.remove("visible"), 1500);

    } catch (err) {
        console.error("Clipboard error", err);
        alert("Unable to copy. Please try manually.");
    }
});

/* ========================================================
   SHARE: WHATSAPP
======================================================== */
whatsappBtn.addEventListener("click", () => {
    if (!quoteText.textContent.trim()) return;

    const msg = 
`${quoteText.textContent}
${quoteAuthor.textContent}

${quoteMeaning.textContent}

${quoteInstruction.textContent}

Shared from ${SITE_NAME}
${SITE_URL}`;

    const url = "https://api.whatsapp.com/send?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
});

/* ========================================================
   SHARE: SMS
======================================================== */
smsBtn.addEventListener("click", () => {
    if (!quoteText.textContent.trim()) return;

    const msg = 
`${quoteText.textContent}
${quoteAuthor.textContent}

${quoteMeaning.textContent}

${quoteInstruction.textContent}

Shared from ${SITE_NAME}
${SITE_URL}`;

    const smsURL = `sms:?body=${encodeURIComponent(msg)}`;
    window.location.href = smsURL;
});

/* ========================================================
   SHARE: MESSENGER (Mobile Safe)
======================================================== */
messengerBtn.addEventListener("click", () => {
    if (!quoteText.textContent.trim()) return;

    const msg = 
`${quoteText.textContent}
${quoteAuthor.textContent}

${quoteMeaning.textContent}

${quoteInstruction.textContent}

Shared from ${SITE_NAME}
${SITE_URL}`;

    const fbURL = `fb-messenger://share?link=${encodeURIComponent(SITE_URL)}&app_id=123456`;
    window.location.href = fbURL;
});

/* ========================================================
   SHARE: NATIVE SHARESHEET
======================================================== */
shareBtn.addEventListener("click", async () => {
    if (!navigator.share) {
        alert("Sharing is not supported on this device");
        return;
    }

    const msg = 
`${quoteText.textContent}
${quoteAuthor.textContent}

${quoteMeaning.textContent}

${quoteInstruction.textContent}

Shared from ${SITE_NAME}`;

    try {
        await navigator.share({
            title: SITE_NAME,
            text: msg,
            url: SITE_URL
        });

    } catch (err) {
        console.warn("Share cancelled", err);
    }
});
