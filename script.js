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


/* ========================================================
   LOAD QUOTES (Only once)
======================================================== */

let quotes = [];
let quotesLoaded = false;

async function loadQuotes() {
    try {
        const response = await fetch("quotes.json", { cache: "no-store" });
        quotes = await response.json();
        quotesLoaded = true;
    } catch (error) {
        console.error("Error loading quotes.json:", error);

        quoteText.textContent = "Something went wrong loading quotes.";
        quoteMeaning.textContent = "Please try again later.";
        quoteInstruction.textContent = "";
    }
}

loadQuotes(); // Run immediately


/* ========================================================
   GENERATE QUOTE
======================================================== */

function generateQuote() {
    if (!quotesLoaded || quotes.length === 0) return;

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    quoteText.textContent = randomQuote.quote;
    quoteMeaning.textContent = randomQuote.meaning;
    quoteInstruction.textContent = randomQuote.instruction;

    // Reset animation
    quoteBox.classList.remove("visible");
    quoteBox.offsetHeight;  // forces reflow
    quoteBox.classList.add("visible");
}


/* ========================================================
   BUTTON CLICK — SHOW A NEW QUOTE
======================================================== */
quoteBtn.addEventListener("click", () => {
    if (!quotesLoaded) return;
    generateQuote();
});


/* ========================================================
   COPY QUOTE TO CLIPBOARD
======================================================== */

copyBtn.addEventListener("click", async () => {
    const textToCopy = 
`${quoteText.textContent}

${quoteMeaning.textContent}

${quoteInstruction.textContent}`;

    try {
        await navigator.clipboard.writeText(textToCopy);

        copyFeedback.classList.add("visible");
        
        setTimeout(() => {
            copyFeedback.classList.remove("visible");
        }, 1500);

    } catch (error) {
        alert("Unable to copy. Please try again.");
    }
});
