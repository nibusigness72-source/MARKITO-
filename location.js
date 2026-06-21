async function getRealLocationName(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        const addr = data.address || {};
        const area = addr.suburb || addr.village || addr.town || addr.city || addr.county || addr.hamlet || addr.locality || "";
        const state = addr.state || addr.state_district || "";
        if (area && state) return `${area}, ${state}`;
        if (data.display_name) {
            // Agar exact field nahi mila to display_name ka first 2 part use karo
            const parts = data.display_name.split(',').map(p => p.trim());
            return parts.slice(0, 2).join(', ');
        }
        return "Location mil gayi";
    } catch (e) {
        return "Semapur, Bihar";
    }
}
async function handleLocationSystem(manualStatus, lat, lon) {
    // 🛑 नया पक्का पहरेदार: अगर सर्च पर्दा, मैसेज बॉक्स या 6 डिब्बे वाला ADD ओवरले खुला है, तो ब्लर तुरंत हटाओ
    const isSearchOpen = document.getElementById('safed-parda') && document.getElementById('safed-parda').style.display === "block";
    const isMsgOpen = document.getElementById('msg-container') && document.getElementById('msg-container').style.display === "flex";
    const is6BoxOpen = document.getElementById('product-overlay');

    // अगर इनमें से कुछ भी खुला हुआ मिल जाए, तो ऐप को कभी ब्लर मत करो, साफ़ रखो
    if (isSearchOpen || isMsgOpen || is6BoxOpen || window.location.href.includes('profile.html') || window.location.href.includes('account.html')) {
        const bodyContent = document.querySelectorAll('section, footer, .categories, .product-list');
        bodyContent.forEach(el => el.classList.remove('app-blur'));
        return; // आगे का ब्लर करने वाला कोड यहीं रुक जाएगा
    }

    const locBar = document.querySelector('.location-bar');

    const locText = document.querySelector('.loc-text b');
    const locBtn = document.querySelector('.change-btn');
    const bodyContent = document.querySelectorAll('section, footer, .categories, .product-list');

    if (manualStatus === "ON") {
        // --- NORMAL MODE (होम पेज साफ़ दिखेगा) ---
        bodyContent.forEach(el => el.classList.remove('app-blur'));
        if(locBar) {
            locBar.style.background = "#fff";
            locBar.style.border = "1px solid #ddd";
            locBar.style.animation = "none";
        }
        if(locText) {
            if (lat && lon) {
                locText.innerText = "Location dhund rahe hain...";
                const realPlace = await getRealLocationName(lat, lon);
                locText.innerText = realPlace;
            } else {
                locText.innerText = "Semapur, Bihar";
            }
        }
        if(locBtn) {
            locBtn.innerText = "ON";
            locBtn.style.background = "#2e7d32";
            locBtn.onclick = () => handleLocationSystem("OFF");
        }
    } else {
        // --- BLUR MODE (होम पेज धुंधला दिखेगा) ---
        bodyContent.forEach(el => el.classList.add('app-blur'));
        if(locBar) {
            locBar.style.background = "#fff0f0";
            locBar.style.border = "2px solid #ff5252";
            locBar.style.animation = "locationPulse 1.5s infinite";
        }
        if(locText) locText.innerText = "Location Off - Turn ON";
        if(locBtn) {
            locBtn.innerText = "OFF";
            locBtn.style.background = "#ff5252";
            locBtn.onclick = () => {
                navigator.geolocation.getCurrentPosition((position) => {
                    handleLocationSystem("ON", position.coords.latitude, position.coords.longitude);
                }, () => {
                    handleLocationSystem("ON");
                });
            };
        }
    }
}

// शुरू में सिर्फ होम पेज को OFF (Blur) मोड में रखें
// --- रिफ्रेश चेक करने का नया कोड (इसे फ़ाइल के सबसे नीचे लगाएँ) ---
window.addEventListener('load', () => {
    // 1. अगर प्रोफाइल या अकाउंट वाला पेज खुला है, तो हमेशा ऑन रखें
    if (window.location.href.includes('profile.html') || window.location.href.includes('account.html')) {
        handleLocationSystem("ON");
        return;
    }

    // 2. होम पेज पर चेक करना कि क्या ब्राउज़र में पहले से लोकेशन की अनुमति मिली हुई है
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
            // अगर यूज़र पहले ही 'Allow' बटन दबा चुका है
            if (result.state === 'granted') {
                console.log("रिफ्रेश करने पर जीपीएस पहले से ऑन मिला भाई! ✅");
                
                // तुरंत असली जीपीएस एक्टिव करके ऐप को ON मोड में खोलें
                navigator.geolocation.getCurrentPosition((position) => {
                    handleLocationSystem("ON", position.coords.latitude, position.coords.longitude);
                }, () => {
                    // अगर किसी एरर की वजह से लोकेशन न मिले तो ही बंद करें
                    handleLocationSystem("OFF");
                });
            } else {
                // अगर पहली बार पेज खुला है या परमिशन नहीं है, तो ब्लर मोड में रखें
                handleLocationSystem("OFF");
            }
        });
    } else {
        // अगर मोबाइल का ब्राउज़र पुराना है और चेक नहीं कर पा रहा है
        handleLocationSystem("OFF");
    }
});


