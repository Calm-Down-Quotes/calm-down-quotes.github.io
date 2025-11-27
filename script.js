/* ========================================================
   DOM REFERENCES
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
const pinterestBtn = document.getElementById("pinterest-btn");
const instagramBtn = document.getElementById("instagram-btn");


/* ========================================================
   LOAD QUOTES
======================================================== */
let quotes = [];
let quotesLoaded = false;

async function loadQuotes() {
    try {
        const res = await fetch("quotes.json", { cache: "no-store" });

        if (!res.ok) throw new Error("quotes.json missing");

        quotes = await res.json();

        if (!Array.isArray(quotes) || quotes.length === 0)
            throw new Error("quotes.json empty");

        quotesLoaded = true;

    } catch (err) {
        console.error(err);
        quoteText.textContent = "Unable to load quotes";
        quoteMeaning.textContent = "Please check back later";
    }
}

loadQuotes();


/* ========================================================
   GENERATE QUOTE
======================================================== */
function generateQuote() {
    if (!quotesLoaded) return;

    const q = quotes[Math.floor(Math.random() * quotes.length)];

    quoteText.textContent = (q.quote || "").trim();
    quoteAuthor.textContent = (q.author || "").trim();
    quoteMeaning.textContent = (q.meaning || "").trim();
    quoteInstruction.textContent = (q.instruction || "").trim();

    quoteBox.classList.remove("hidden");

    quoteBox.classList.remove("visible");
    void quoteBox.offsetWidth;
    quoteBox.classList.add("visible");
}

quoteBtn.addEventListener("click", generateQuote);


/* ========================================================
   BUILD SHARE TEXT
======================================================== */
function buildShareText() {
    const q = quoteText.textContent.trim();
    const a = quoteAuthor.textContent.trim();
    const m = quoteMeaning.textContent.trim();
    const i = quoteInstruction.textContent.trim();

    if (!q) return "";

    return (
`${q}
${a}

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
    } catch (err) {
        alert("Unable to copy");
    }
});


/* ========================================================
   WHATSAPP
======================================================== */
whatsappBtn.addEventListener("click", () => {
    const encoded = encodeURIComponent(buildShareText());
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
});


/* ========================================================
   SMS
======================================================== */
smsBtn.addEventListener("click", () => {
    const encoded = encodeURIComponent(buildShareText());
    window.location.href = `sms:?body=${encoded}`;
});


/* ========================================================
   FACEBOOK MESSENGER
======================================================== */
messengerBtn.addEventListener("click", () => {
    const link = encodeURIComponent("https://calm-down-quotes.github.io/");
    window.open(
        `https://www.messenger.com/share/?link=${link}`,
        "_blank"
    );
});


/* ========================================================
   PINTEREST SHARE
======================================================== */
pinterestBtn?.addEventListener("click", () => {
    const description = encodeURIComponent(buildShareText());
    const url = encodeURIComponent("https://calm-down-quotes.github.io/");
    const img = encodeURIComponent("https://calm-down-quotes.github.io/preview.png");

    window.open(
        `https://pinterest.com/pin/create/button/?url=${url}&media=${img}&description=${description}`,
        "_blank"
    );
});


/* ========================================================
   INSTAGRAM STORY SHARE (Mobile-Friendly Fallback)
======================================================== */
instagramBtn?.addEventListener("click", () => {
    const text = buildShareText();

    alert(
        "Instagram only allows photo/video story uploads.\n\nYour quote has been copied.\nOpen Instagram → Create Story → Paste text manually."
    );

    navigator.clipboard.writeText(text).catch(() => {});
});


/* ========================================================
   NATIVE SHARE (Mobile)
======================================================== */
shareBtn.addEventListener("click", async () => {
    const text = buildShareText();

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Calm Down Quote",
                text: text,
                url: "https://calm-down-quotes.github.io/"
            });
        } 
        catch (_) {}
    } else {
        alert("Sharing not supported on this device");
    }
});


/* ========================================================
   SWIPE LEFT / RIGHT FOR NEW QUOTE
======================================================== */
let startX = 0;

document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
});

document.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) < 60) return;

    if (diff < 0) {
        generateQuote();
    } else {
        generateQuote();
    }
});
