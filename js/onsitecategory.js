document.addEventListener("DOMContentLoaded", function () {
    // Map card IDs to their corresponding part class names
    const cardToPart = {
        card1: "milktea-part",
        card2: "espresso-part",
        card3: "ftea-part",
        card4: "silog-part",
        card5: "sandwich-part",
        card6: "snacks-part",
        card7: "ricemeal-part",
        card8: "noodlepasta-part",
        card9: "fries-part",
        card10: "extras-part",
        card11: "bestseller-part"
    };

    // Get all card elements
    Object.keys(cardToPart).forEach(cardId => {
        const card = document.getElementById(cardId);
        if (card) {
            card.addEventListener("click", function (event) {
                event.preventDefault();
                // Hide all parts
                Object.values(cardToPart).forEach(partClass => {
                    const part = document.querySelector("." + partClass);
                    if (part) part.style.display = "none";
                });
                // Show the selected part
                const selectedPart = document.querySelector("." + cardToPart[cardId]);
                if (selectedPart) selectedPart.style.display = "block";
            });
        }
    });

    // Optionally, show milktea by default on page load
    Object.values(cardToPart).forEach((partClass, idx) => {
        const part = document.querySelector("." + partClass);
        if (part) part.style.display = (idx === 0 ? "block" : "none");
    });
});