/* ========================================================
   DOM + STATE
======================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const quoteBtn          = document.getElementById("quote-btn");

    const quoteBox          = document.getElementById("quote-box");
    const quoteText         = document.getElementById("quote-text");
    const quoteAuthor       = document.getElementById("quote-author");
    const quoteMeaning      = document.getElementById("quote-meaning");
    const quoteInstruction  = document.getElementById("quote-instruction");

    const copyBtn           = document.getElementById("copy-btn");
    const copyFeedback      = document.getElementById("copy-feedback");

    const whatsappBtn       = document.getElementById("whatsapp-btn");
    const smsBtn            = document.getElementById("sms-btn");
    const messengerBtn      = document.getElementById("messenger-btn");
    const shareBtn          = document.getElementById("share-btn");
    const pinterestBtn      = document.getElementById("pinterest-btn");
    const instagramBtn      = document.getElementById("instagram-btn");

    let quotes = [];
    let quotesLoaded = false;
    let hasQuote = false;

    /* ========================================================
       INITIAL UI STATE
    ========================================================= */
    if (quoteBtn) {
        // While loading quotes, show a loading state
        quoteBtn.disabled = true;
        quoteBtn.textContent = "Loading...";
    }

    /* ========================================================
       LOAD QUOTES
    ========================================================= */
    async function loadQuotes() {
        try {
            const res = await fetch("quotes.json", { cache: "no-store" });

            if (!res.ok) throw new Error("quotes.json missing or unreachable");

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("quotes.json is empty or invalid");
            }

            quotes = data;
            quotesLoaded = true;

            if (quoteBtn) {
                quoteBtn.disabled = false;
                quoteBtn.textContent = "Give Me a Quote";
            }
        } catch (err) {
            console.error(err);

            if (quoteText) {
                quoteText.textContent = "Unable to load quotes.";
            }
            if (quoteMeaning) {
                quoteMeaning.textContent = "Please check back later.";
            }
            if (quoteAuthor) {
                quoteAuthor.textContent = "";
            }
            if (quoteInstruction) {
                quoteInstruction.textContent = "";
            }
            if (quoteBox) {
                quoteBox.classList.remove("hidden");
                quoteBox.classList.add("visible");
            }
            if (quoteBtn) {
                quoteBtn.disabled = true;
                quoteBtn.textContent = "Quotes Unavailable";
            }
        }
    }

    loadQuotes();

    /* ========================================================
       GENERATE QUOTE
    ========================================================= */
    function generateQuote() {
        if (!quotesLoaded || !quotes.length) return;
        if (!quoteText || !quoteAuthor || !quoteMeaning || !quoteInstruction || !quoteBox) return;

        const q = quotes[Math.floor(Math.random() * quotes.length)] || {};

        quoteText.textContent         = (q.quote || "").trim();
        quoteAuthor.textContent       = (q.author || "").trim();
        quoteMeaning.textContent      = (q.meaning || "").trim();
        quoteInstruction.textContent  = (q.instruction || "").trim();

        hasQuote = !!quoteText.textContent.trim();

        quoteBox.classList.remove("hidden");

        // Reset and trigger the entry animation
        quoteBox.classList.remove("visible");
        // Force reflow
        void quoteBox.offsetWidth;
        quoteBox.classList.add("visible");
    }

    if (quoteBtn) {
        quoteBtn.addEventListener("click", generateQuote);
    }

    /* ========================================================
       BUILD SHARE TEXT
    ========================================================= */
    function buildShareText() {
        if (!hasQuote || !quoteText) return "";

        const q = quoteText.textContent.trim();
        if (!q) return "";

        const a = quoteAuthor ? quoteAuthor.textContent.trim() : "";
        const m = quoteMeaning ? quoteMeaning.textContent.trim() : "";
        const i = quoteInstruction ? quoteInstruction.textContent.trim() : "";

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
    ========================================================= */
    if (copyBtn && copyFeedback) {
        copyBtn.addEventListener("click", async () => {
            const text = buildShareText();
            if (!text) return;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    // Fallback for older browsers
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

                copyFeedback.classList.add("visible");
                setTimeout(() => copyFeedback.classList.remove("visible"), 1500);
            } catch (err) {
                console.error("Copy failed:", err);
                alert("Unable to copy this quote on this device.");
            }
        });
    }

    /* ========================================================
       WHATSAPP
    ========================================================= */
    if (whatsappBtn) {
        whatsappBtn.addEventListener("click", () => {
            const text = buildShareText();
            if (!text) return;
            const encoded = encodeURIComponent(text);
            window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank", "noopener");
        });
    }

    /* ========================================================
       SMS
    ========================================================= */
    if (smsBtn) {
        smsBtn.addEventListener("click", () => {
            const text = buildShareText();
            if (!text) return;
            const encoded = encodeURIComponent(text);
            window.location.href = `sms:?body=${encoded}`;
        });
    }

    /* ========================================================
       FACEBOOK MESSENGER
    ========================================================= */
    if (messengerBtn) {
        messengerBtn.addEventListener("click", () => {
            const link = encodeURIComponent("https://calm-down-quotes.github.io/");
            window.open(
                `https://www.messenger.com/share/?link=${link}`,
                "_blank",
                "noopener"
            );
        });
    }

    /* ========================================================
       PINTEREST SHARE
    ========================================================= */
    if (pinterestBtn) {
        pinterestBtn.addEventListener("click", () => {
            const description = encodeURIComponent(buildShareText());
            if (!description) return;

            const url = encodeURIComponent("https://calm-down-quotes.github.io/");
            const img = encodeURIComponent("https://calm-down-quotes.github.io/preview.png");

            window.open(
                `https://pinterest.com/pin/create/button/?url=${url}&media=${img}&description=${description}`,
                "_blank",
                "noopener"
            );
        });
    }

    /* ========================================================
       INSTAGRAM STORY SHARE (Copy + Instructions)
    ========================================================= */
    if (instagramBtn) {
        instagramBtn.addEventListener("click", () => {
            const text = buildShareText();
            if (!text) return;

            alert(
                "Instagram only allows photo/video story uploads.\n\n" +
                "Your quote will be copied. Then:\n" +
                "1. Open Instagram\n" +
                "2. Create a Story or Reel\n" +
                "3. Paste the text onto the screen."
            );

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(() => {});
            }
        });
    }

    /* ========================================================
       NATIVE SHARE (Mobile)
    ========================================================= */
    if (shareBtn) {
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
                } catch (_) {
                    // User cancelled or share failed; no need to alert.
                }
            } else {
                alert("Native sharing is not supported on this device.");
            }
        });
    }

    /* ========================================================
       SWIPE LEFT / RIGHT FOR NEW QUOTE
    ========================================================= */
    let startX = 0;

    document.addEventListener("touchstart", (e) => {
        if (!e.touches || !e.touches.length) return;
        startX = e.touches[0].clientX;
    });

    document.addEventListener("touchend", (e) => {
        if (!e.changedTouches || !e.changedTouches.length) return;
        const endX = e.changedTouches[0].clientX;
        const diff = endX - startX;

        if (Math.abs(diff) < 60) return; // small movement, ignore
        generateQuote();
    });
});
