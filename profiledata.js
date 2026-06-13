// ==========================================
// 🏪 SASTA STORE - LIVE PROFILE SYSTEM (🚨 SYNTAX FIXED)
// ==========================================

let currentStoreId = "";
let clickedProductName = "";
let currentBoxIndex = "";

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    let rawStoreId = urlParams.get('storeId') || urlParams.get('id') || urlParams.get('storeid');
    currentStoreId = rawStoreId ? String(rawStoreId).trim() : "";
    
    let rawProdName = urlParams.get('prodName') || urlParams.get('productName');
    clickedProductName = rawProdName ? decodeURIComponent(rawProdName).trim() : "";
    
    currentBoxIndex = urlParams.get('box') ? String(urlParams.get('box')).trim() : "";

    console.log("Netlify पर पकड़ी गई लाइव Store ID:", currentStoreId);

    const currentPath = window.location.pathname.toLowerCase();
    if (!currentStoreId && currentPath.includes('profile')) {
        alert("दुकान की ID नहीं मिली भाई! ❌");
        window.location.href = "./index.html"; 
        return;
    }

    if (currentStoreId && typeof firebase !== 'undefined') {
        loadStoreProfileAndProducts();
    }
});

function loadStoreProfileAndProducts() {
    if (typeof firebase === 'undefined') return;

    firebase.database().ref('stores/' + currentStoreId).on('value', (snapshot) => {
        if (!snapshot.exists()) {
            console.error("फायरबेस में इस ID का कोई डेटा नहीं है भाई!");
            return;
        }

        const storeData = snapshot.val();
        const info = storeData.info || {}; 
        
        const finalShopName = storeData.shopName || info.shopName || "सस्ता स्टोर लोकल शॉप";
        const shopNameElem = document.querySelector('.shop-name');
        if (shopNameElem) shopNameElem.innerText = finalShopName;
        
        const avatarContainer = document.getElementById('profile-avatar-container');
        const storePhotoUrl = (storeData.photos && storeData.photos[0]) || info.storePhoto || "";
        if (avatarContainer && storePhotoUrl) {
            avatarContainer.innerHTML = `<img src="${storePhotoUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }

        const phone = storeData.mobileNumber || info.phone || "9100000000";
        const contactBox = document.querySelector('.contact-actions');
        if (contactBox) {
            contactBox.innerHTML = `
                <a href="tel:${phone}"><img src="https://cdn-icons-png.flaticon.com/512/724/724664.png" alt="Call"></a>
                <a href="https://wa.me/${phone}?text=${encodeURIComponent('नमस्ते, मुझे आपके सामान में रुचि है।')}"><img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp"></a>
            `;
        }

        if(document.getElementById('count-good')) document.getElementById('count-good').innerText = storeData.good || info.good || "0";
        if(document.getElementById('count-best')) document.getElementById('count-best').innerText = storeData.best || info.best || "0";
        
        const issues = storeData.issues || info.issues || {};
        let totalIssues = 0;
        for (let i = 1; i <= 6; i++) {
            const count = issues['i' + i] || 0;
            if(document.getElementById('i' + i)) document.getElementById('i' + i).innerText = count;
            totalIssues += count;
        }
        if(document.getElementById('count-issue')) document.getElementById('count-issue').innerText = totalIssues;

        const productListSection = document.querySelector('.product-list');
        const highlightSection = document.querySelector('.highlight-item');
        
        if (productListSection) productListSection.innerHTML = ""; 

        const productsObj = storeData.products;
        let mainProductFound = false;

        const lat = storeData.location?.latitude || info.location?.latitude || "";
        const lon = storeData.location?.longitude || info.location?.longitude || "";

        if (productsObj) {
            for (let key in productsObj) {
                const prod = productsObj[key];
                const googleMapUrl = `https://maps.google.com/?q=${lat},${lon}`;

                if (clickedProductName && prod.productName && prod.productName.trim().toLowerCase() === clickedProductName.toLowerCase() && !mainProductFound && highlightSection) {
                    highlightSection.innerHTML = `
                        <div class="h-img-box"><img src="${prod.photo || 'rasgulla.jpg'}" alt="${prod.productName}"></div>
                        <div class="h-info-box">
                            <p class="h-name">${prod.productName} (${prod.unit || '1kg'})</p>
                            <p class="h-price">₹${prod.price}</p>
                            <p style="font-size:0.75rem; color:#777; margin-bottom:0.625rem;">🏪 ${finalShopName}</p>
                            <a href="${googleMapUrl}" target="_blank" class="map-btn">Map on 📍</a>
                        </div>
                    `;
                    mainProductFound = true;
                }

                if (productListSection) {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.style.cursor = "pointer";

                  card.setAttribute('data-storeid', currentStoreId);
    card.setAttribute('data-prodname', prod.productName);
                    
                    card.onclick = () => {
                        window.location.href = `./profile.html?storeId=${currentStoreId}&prodName=${encodeURIComponent(prod.productName)}`;
                    };

                    card.innerHTML = `
                        <img src="${prod.photo || 'rasgulla.jpg'}" alt="${prod.productName}">
                        <div class="product-info">
                            <h3>${prod.productName}</h3>
                            <span>₹${prod.price}</span>
                            <div class="product-meta-box">
                                ${finalShopName} |<br>
                                <span class="km-text">${prod.unit || '1kg'}</span>
                            </div>
                            <a href="${googleMapUrl}" target="_blank" class="map-btn" onclick="event.stopPropagation();">Map on 📍</a>
                        </div>
                    `;
                    productListSection.appendChild(card);
                    
// यह डेटा आने के 1 सेकंड बाद चलेगा
setTimeout(() => {
    loadExtraDetails(clickedProductName);
}, 1000);

                    
                }
            }
        }
        
        if (!mainProductFound && productsObj && highlightSection) {
            const keysArray = Object.keys(productsObj);
            if (keysArray.length > 0) {
                const prod = productsObj[keysArray[0]]; 
                const googleMapUrl = `https://maps.google.com/?q=${lat},${lon}`;
                highlightSection.innerHTML = `
                    <div class="h-img-box"><img src="${prod.photo || 'rasgulla.jpg'}" alt="${prod.productName}"></div>
                    <div class="h-info-box">
                        <p class="h-name">${prod.productName} (${prod.unit || '1kg'})</p>
                        <p class="h-price">₹${prod.price}</p>
                        <p style="font-size:0.75rem; color:#777; margin-bottom:0.625rem;">🏪 ${finalShopName}</p>
                        <a href="${googleMapUrl}" target="_blank" class="map-btn">Map on 📍</a>
                    </div>
                `;
            }
        }
    });
}

// ====================================================================
// 🎯 वोटिंग और रेटिंग सिस्टम
// ====================================================================
let currentSelectedId = null;
function selectRating(type) { processLiveVote(type, false); }
function selectIssue(issueId) { processLiveVote(issueId, true); }

function processLiveVote(clickedId, isIssue) {
    if (!currentStoreId) return;

    // ईमेल वाला पूरा ब्लॉक यहाँ से हट चुका है, इसलिए अब कोई एरर नहीं आएगा

    // बाकी वोटिंग का कोड जैसा था वैसा ही रहने दो...
    if (currentSelectedId === clickedId) {
        submitTransaction(clickedId, -1);
        currentSelectedId = null;
        return;
    }
    if (currentSelectedId !== null) {
        submitTransaction(currentSelectedId, -1);
    }
    submitTransaction(clickedId, 1);
    currentSelectedId = clickedId;
}



function submitTransaction(id, changeAmt) {
    let path = id.startsWith('i') ? `stores/${currentStoreId}/issues/${id}` : `stores/${currentStoreId}/${id}`;
    firebase.database().ref(path).transaction((currentCount) => {
        let newCount = (currentCount || 0) + changeAmt;
        if (newCount < 0) return 0;
        return newCount;
    });
}

// ====================================================================
// 🚀 AUTOMATIC CLICK CATCHER (फिक्स किया हुआ शुद्ध रूप)
// ====================================================================
document.addEventListener('click', function(e) {
    // अगर प्रोफाइल पेज पर हैं तो कुछ मत करो
    if (window.location.pathname.includes('profile')) return;

    // अगर कार्ड पर क्लिक हुआ है तो उसे पकड़ो
    const card = e.target.closest('.product-card');
    if (!card) return;

    // अगर मैप वाले बटन पर क्लिक हुआ है, तो सिर्फ मैप ही खुलेगा (प्रोफाइल नहीं)
    if (e.target.closest('.map-btn')) return; 

    // कार्ड से दुकान की ID और नाम निकालो
    const storeId = card.getAttribute('data-storeid');
    const prodName = card.getAttribute('data-prodname');

    // अगर ID मिली तो प्रोफाइल पेज खोल दो
    if (storeId) {
        window.location.href = './profile.html?storeId=' + storeId + '&prodName=' + encodeURIComponent(prodName);
    }
}, true);
// यह फंक्शन डेटा लोड करेगा और फोटो पर क्लिक सेट करेगा
function loadExtraDetails(prodName) {
    if (!currentStoreId || !prodName) return;

    firebase.database().ref('stores/' + currentStoreId + '/products').once('value').then((snapshot) => {
        snapshot.forEach((child) => {
            let data = child.val();
            if (data.productName && data.productName.toLowerCase() === prodName.toLowerCase()) {
                
                // ब्रांड और डिस्क्रिप्शन भरें
                if(document.getElementById('sasta_disp_brand')) document.getElementById('sasta_disp_brand').innerText = data.brand || "कोई ब्रांड नहीं";
                if(document.getElementById('sasta_disp_desc')) document.getElementById('sasta_disp_desc').innerText = data.description || "कोई विवरण नहीं";

                // 10 फोटो लोड करें
                if (data.photos) {
                    for (let i = 1; i <= 10; i++) {
                        let pBox = document.getElementById('photo-' + i);
                        if (pBox && data.photos['p' + i]) {
                            pBox.innerHTML = `<img src="${data.photos['p' + i]}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;">`;
                            // फोटो क्लिक पर गैलरी खुलेगी
                            pBox.onclick = () => openFullGallery(data.photos['p' + i]);
                        }
                    }
                }
            }
        });
    });
}

// यह गैलरी खोलने वाला फंक्शन (इसे साथ में रखना बहुत जरूरी है)
function openFullGallery(photoUrl) {
    const overlay = document.createElement('div');
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center;";
    overlay.innerHTML = `<img src="${photoUrl}" style="max-width:90%; max-height:80%; border-radius:10px;">
                         <button onclick="this.parentElement.remove()" style="position:absolute; top:20px; right:20px; background:white; padding:10px 20px; border-radius:5px; border:none; font-weight:bold; cursor:pointer;">CLOSE</button>`;
    document.body.appendChild(overlay);
}
// गैलरी वाला स्लाइडिंग सिस्टम (बिना कुछ हटाए जोड़ा गया है)
function openFullGallery(photoUrl) {
    let allPhotos = [];
    // 1 से 10 तक के सारे फोटो बॉक्स चेक करो
    for (let i = 1; i <= 10; i++) {
        let pBox = document.getElementById('photo-' + i);
        let img = pBox ? pBox.querySelector('img') : null;
        if (img) allPhotos.push(img.src);
    }

    let currentIndex = allPhotos.indexOf(photoUrl);

    const overlay = document.createElement('div');
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column;";
    
    overlay.innerHTML = `
        <button onclick="this.parentElement.remove()" style="position:absolute; top:20px; right:20px; background:red; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">CLOSE</button>
        
        <div style="display:flex; align-items:center; width:100%; justify-content:space-around;">
            <button id="prevBtn" style="background:white; border:none; padding:15px; cursor:pointer; font-size:20px; border-radius:50%; box-shadow:0 0 10px white;">◀</button>
            <img id="fullImg" src="${photoUrl}" style="max-width:70%; max-height:70vh; border-radius:10px; object-fit:contain;">
            <button id="nextBtn" style="background:white; border:none; padding:15px; cursor:pointer; font-size:20px; border-radius:50%; box-shadow:0 0 10px white;">▶</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // बटन क्लिक करने पर फोटो बदलना
    overlay.querySelector('#nextBtn').onclick = () => {
        currentIndex = (currentIndex + 1) % allPhotos.length;
        overlay.querySelector('#fullImg').src = allPhotos[currentIndex];
    };
    overlay.querySelector('#prevBtn').onclick = () => {
        currentIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
        overlay.querySelector('#fullImg').src = allPhotos[currentIndex];
    };
}
