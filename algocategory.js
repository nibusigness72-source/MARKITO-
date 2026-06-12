//finally code algo completa

function sortProductsByCategory(selectedCategory) {
    console.log("सॉर्टिंग चालू:", selectedCategory);

    // 1. सारे कार्ड्स को पूरे पेज से कहीं से भी पकड़ लो
    const allCards = Array.from(document.querySelectorAll('.product-card'));
    const firstSection = document.querySelector('.product-list'); // पहला सेक्शन ही हमारा मेन है

    if (!firstSection) return;

    // 2. सॉर्टिंग: जो मैच करे उसे ऊपर (-1) भेजो
    allCards.sort((a, b) => {
        const catA = a.getAttribute('data-category') || "";
        const catB = b.getAttribute('data-category') || "";

        if (catA === selectedCategory && catB !== selectedCategory) return -1;
        if (catA !== selectedCategory && catB === selectedCategory) return 1;
        return 0;
    });

    // 3. सारे खाली सेक्शन खाली कर दो
    document.querySelectorAll('.product-list').forEach(sec => sec.innerHTML = "");

    // 4. सारे सॉर्ट किए हुए कार्ड्स को पहले वाले सेक्शन में डाल दो
    allCards.forEach(card => {
        firstSection.appendChild(card);
    });

    // 5. अगर कोई और सेक्शन (जैसे 'Ad' वाला) है तो उसे रहने दो, 
    // लेकिन सारा सामान पहले सेक्शन में आ जाएगा और सट जाएगा
}
window.getSmartSort = function(products, userLat, userLon) {
    if (!userLat || !userLon) return products;

    };


