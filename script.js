/* ========================================================
   DOM ELEMENT REFERENCES
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
   LOAD QUOTES (ONCE)
======================================================== */
let quotes = [];
let quotesLoaded = false;

async function loadQuotes() {
    try {
        const response = await fetch("quotes.json", { cache: "no-store" });

        if (!response.ok) throw new Error("Quotes file missing or unreadable");

        quotes = await response.json();

        if (!Array.isArray(quotes) || quotes.length === 0)
            throw new Error("quotes.json is empty or invalid");

        quotesLoaded = true;
    } 
    catch (err) {
        console.error("Quote Load Error:", err);
        
        quoteText.textContent = "Unable to load quotes";
        quoteAuthor.textContent = "";
        quoteMeaning.textContent = "Please try again later";
        quoteInstruction.textContent = "";
    }
}

loadQuotes(); // LOAD ON PAGE START


/* ========================================================
   GENERATE QUOTE
======================================================== */
function generateQuote() {
    if (!quotesLoaded) return;

    const q = quotes[Math.floor(Math.random() * quotes.length)];

    const rawQuote = q.quote?.trim() || "";
    const rawAuthor = q.author?.trim() || "";
    const rawMeaning = q.meaning?.trim() || "";
    const rawInstruction = q.instruction?.trim() || "";

    // Format quote cleanly: 
    // Italic, no trailing punctuation
    quoteText.textContent = rawQuote;
    quoteAuthor.textContent = rawAuthor ? rawAuthor : "";

    quoteMeaning.textContent = rawMeaning;
    quoteInstruction.textContent = rawInstruction;

    quoteBox.classList.remove("hidden");

    // Restart fade animation
    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth;
    quoteBox.classList.add("visible");
}

quoteBtn.addEventListener("click", generateQuote);


/* ========================================================
   FORMAT TEXT FOR SHARING
======================================================== */
function buildShareText() {
    const q = quoteText.textContent.trim();
    const a = quoteAuthor.textContent.trim();
    const m = quoteMeaning.textContent.trim();
    const i = quoteInstruction.textContent.trim();

    if (!q) return "";

    return (
`${q}
${a ? a : ""}

${m}

${i}

Shared from Calm Down Quotes  
https://calm-down-quotes.github.io/`
    ).trim();
}


/* ========================================================
   COPY TO CLIPBOARD
======================================================== */
copyBtn.addEventListener("click", async () => {
    const text = buildShareText();
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        copyFeedback.classList.add("visible");
        setTimeout(() => copyFeedback.classList.remove("visible"), 1500);
    } 
    catch (err) {
        console.error("Clipboard Error:", err);
        alert("Unable to copy");
    }
});


/* ========================================================
   WHATSAPP SHARE
======================================================== */
whatsappBtn.addEventListener("click", () => {
    const text = encodeURIComponent(buildShareText());
    if (!text) return;

    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
});


/* ========================================================
   SMS SHARE
======================================================== */
smsBtn.addEventListener("click", () => {
    const text = encodeURIComponent(buildShareText());
    if (!text) return;

    window.location.href = `sms:?body=${text}`;
});


/* ========================================================
   MESSENGER SHARE (Best possible non-app-key version)
======================================================== */
messengerBtn.addEventListener("click", () => {
    const shareURL = "https://calm-down-quotes.github.io/";
    const text = encodeURIComponent(buildShareText());

    // Messenger doesn’t allow text injection directly:
    // So we include the message in a parameter for the user.
    window.open(
        `https://www.facebook.com/dialog/send?app_id=0000000000000&link=${shareURL}&redirect_uri=${shareURL}`,
        "_blank"
    );
});


/* ========================================================
   NATIVE SHARE API (iPhone + Android)
======================================================== */
shareBtn.addEventListener("click", async () => {
    const text = buildShareText();
    if (!text) return;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Calm Down Quote",
                text: text,
                url: "https://calm-down-quotes.github.io/"
            });
        } 
        catch (err) {
            console.warn("Share cancelled");
        }
    } 
    else {
        // fallback
        alert("Your device does not support native sharing");
    }
});
