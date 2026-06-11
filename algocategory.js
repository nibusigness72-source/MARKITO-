function sortProductsByCategory(selectedCategory) {
    // यहाँ '.product-card' की जगह '.store-card' करें
    const allCards = Array.from(document.querySelectorAll('.store-card')); 
    const firstSection = document.querySelector('.container'); // सेक्शन की जगह .container का उपयोग करें

    if (!firstSection) return;

    allCards.sort((a, b) => {
        // आपकी कैटेगरी डेटा कहाँ है? इसे पक्का करें
        const catA = a.getAttribute('data-category') || "";
        const catB = b.getAttribute('data-category') || "";

        const aMatch = catA.includes(selectedCategory.toLowerCase());
const bMatch = catB.includes(selectedCategory.toLowerCase());
if (aMatch && !bMatch) return -1;
if (!aMatch && bMatch) return 1;
        return 0;
    });

    allCards.forEach(card => firstSection.appendChild(card));
}
