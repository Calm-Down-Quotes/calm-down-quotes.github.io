/* ========================================================
   DOM ELEMENT CACHING (Performance + Stability)
======================================================== */

const quoteBtn = document.getElementById("quote-btn");
const quoteBox = document.getElementById("quote-box");

const quoteText = document.getElementById("quote-text");
const quoteMeaning = document.getElementById("quote-meaning");
const quoteInstruction = document.getElementById("quote-instruction");

const copyBtn = document.getElementById("copy-btn");
const copyFeedback = document.getElementById("copy-feedback");

const whatsappBtn = document.getElementById("whatsapp-btn");
const smsBtn = document.getElementById("sms-btn");


/* ========================================================
   LOAD QUOTES (Once Only — Safe Fetch Handling)
======================================================== */

let quotes = [];
let quotesLoaded = false;

async function loadQuotes() {
    try {
        const response = await fetch("quotes.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Failed to load quotes.json");
        }

        quotes = await response.json();

        if (!Array.isArray(quotes) || quotes.length === 0) {
            throw new Error("quotes.json is empty or invalid.");
        }

        quotesLoaded = true;

    } catch (error) {
        console.error("Error reading quotes.json:", error);

        quoteText.textContent = "Unable to load quotes.";
        quoteMeaning.textContent = "Please check back later.";
        quoteInstruction.textContent = "";
    }
}

loadQuotes(); // Load immediately


/* ========================================================
   GENERATE QUOTE (Stable, Clean, No Flash)
======================================================== */

function generateQuote() {
    if (!quotesLoaded || quotes.length === 0) return;

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    quoteText.textContent = randomQuote.quote || "";
    quoteMeaning.textContent = randomQuote.meaning || "";
    quoteInstruction.textContent = randomQuote.instruction || "";

    // Ensure quote-box is visible on first click
    quoteBox.classList.remove("hidden");

    // Reset animation cleanly
    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth; // Force reflow
    quoteBox.classList.add("visible");
}


/* ========================================================
   PRIMARY BUTTON — NEW QUOTE
======================================================== */

quoteBtn.addEventListener("click", () => {
    if (!quotesLoaded) return;
    generateQuote();
});


/* ========================================================
   COPY QUOTE TO CLIPBOARD (Mobile-Safe)
======================================================== */

copyBtn.addEventListener("click", async () => {
    const textToCopy = 
`${quoteText.textContent.trim()}

${quoteMeaning.textContent.trim()}

${quoteInstruction.textContent.trim()}`.trim();

    if (!textToCopy) return;

    try {
        await navigator.clipboard.writeText(textToCopy);

        copyFeedback.classList.add("visible");
        setTimeout(() => copyFeedback.classList.remove("visible"), 1500);

    } catch (error) {
        console.error("Clipboard error:", error);
        alert("Unable to copy. Please try again.");
    }
});


/* ========================================================
   SHARE: WHATSAPP
======================================================== */

whatsappBtn.addEventListener("click", () => {
    const text =
`${quoteText.textContent}

${quoteMeaning.textContent}

${quoteInstruction.textContent}`.trim();

    if (!text) return;

    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, "_blank");
});


/* ========================================================
   SHARE: SMS (Cross-Device Safe)
======================================================== */

smsBtn.addEventListener("click", () => {
    const text =
`${quoteText.textContent}

${quoteMeaning.textContent}

${quoteInstruction.textContent}`.trim();

    if (!text) return;

    const encoded = encodeURIComponent(text);
    const smsURL = `sms:?body=${encoded}`;

    window.location.href = smsURL;
});
