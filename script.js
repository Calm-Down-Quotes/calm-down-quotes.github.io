/* ========================================================
   DOM ELEMENT CACHING (Performance)
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
   LOAD QUOTES (One-Time Load)
======================================================== */

let quotes = [];
let quotesLoaded = false;

async function loadQuotes() {
    try {
        const response = await fetch("quotes.json", { cache: "no-store" });

        if (!response.ok) throw new Error("Failed to load quotes.json");

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0)
            throw new Error("quotes.json is empty or invalid.");

        quotes = data;
        quotesLoaded = true;

    } catch (error) {
        console.error(error);

        quoteText.textContent = "Unable to load quotes.";
        quoteMeaning.textContent = "Please check back later.";
        quoteInstruction.textContent = "";
    }
}

loadQuotes();


/* ========================================================
   GENERATE A NEW QUOTE
======================================================== */

function generateQuote() {
    if (!quotesLoaded || quotes.length === 0) return;

    const random = quotes[Math.floor(Math.random() * quotes.length)];

    quoteText.textContent = random.quote || "";
    quoteMeaning.textContent = random.meaning || "";
    quoteInstruction.textContent = random.instruction || "";

    // Reveal quote box on first click
    quoteBox.classList.remove("hidden");

    // Restart fade animation
    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth;
    quoteBox.classList.add("visible");

    // Auto-scroll into view on mobile
    setTimeout(() => {
        quoteBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
}


/* ========================================================
   BUTTON — GENERATE QUOTE
======================================================== */

quoteBtn.addEventListener("click", () => {
    if (!quotesLoaded) return;
    generateQuote();
});


/* ========================================================
   COPY QUOTE TO CLIPBOARD
======================================================== */

copyBtn.addEventListener("click", async () => {
    const textToCopy = [
        quoteText.textContent.trim(),
        quoteMeaning.textContent.trim(),
        quoteInstruction.textContent.trim()
    ].filter(Boolean).join("\n\n");

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
   SHARE — WHATSAPP
======================================================== */

whatsappBtn.addEventListener("click", () => {
    const message = [
        quoteText.textContent,
        quoteMeaning.textContent,
        quoteInstruction.textContent
    ].filter(Boolean).join("\n\n");

    if (!message.trim()) return;

    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, "_blank", "noopener");
});


/* ========================================================
   SHARE — SMS (iPhone + Android Compatible)
======================================================== */

smsBtn.addEventListener("click", () => {
    const message = [
        quoteText.textContent,
        quoteMeaning.textContent,
        quoteInstruction.textContent
    ].filter(Boolean).join("\n\n");

    if (!message.trim()) return;

    const encoded = encodeURIComponent(message);

    /**
     * iPhone uses:  sms:&body=
     * Android uses: sms:?body=
     * We detect platform to choose correct format.
     */
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsURL = isIOS
        ? `sms:&body=${encoded}`
        : `sms:?body=${encoded}`;

    window.location.href = smsURL;
});
