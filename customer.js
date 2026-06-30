// ==========================================
// 🛒 SASTA STORE - LIVE SYNCED CUSTOMER SYSTEM (🚨 NETLIFY FIXED)
// ==========================================

// ==========================================
// 🌍 UNIVERSAL BATCH FETCHER
// ==========================================
let _lastFetchedKey = null;
let _allBatchesLoaded = false;

function fetchProductsBatch(batchSize, callback) {
    let query = firebase.database().ref('all_products').orderByKey();
    if (_lastFetchedKey) {
        query = query.startAfter(_lastFetchedKey);
    }
    query.limitToFirst(batchSize).once('value', (snapshot) => {
        const newProducts = [];
        snapshot.forEach(child => {
            const prod = child.val();
            prod.productId = child.key;
            newProducts.push(prod);
            _lastFetchedKey = child.key;
        });
        if (newProducts.length < batchSize) {
            _allBatchesLoaded = true;
        }
        callback(newProducts);
    });
}

let sortMode = 'smart'; // 'smart' ya 'near'

function setSortMode(mode) {
    sortMode = mode;
    document.getElementById('smartBtn').style.background = mode === 'smart' ? '#4285f4' : '#eee';
    document.getElementById('smartBtn').style.color = mode === 'smart' ? '#fff' : '#333';
    document.getElementById('nearBtn').style.background = mode === 'near' ? '#4285f4' : '#eee';
    document.getElementById('nearBtn').style.color = mode === 'near' ? '#fff' : '#333';
    fetchStoresFromFirebase(); // dobara sort karke dikhao
}

let allStoresData = [];       // Database ki sabhi dukano ka live data
let localProductsArray = [];   // Search aur suggestions ke liye products ka backup
let userLatitude = null;       // Grahak ka live Latitude
let userLongitude = null;      // Grahak ka live Longitude

// 1️⃣ App khulte hi grahak ki live location (GPS) lena
function getUserLiveLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;
            console.log(`Grahak ki live location: Lat ${userLatitude}, Lon ${userLongitude}`);
            fetchStoresFromFirebase();
        }, (error) => {
            console.error("GPS band hai ya permission nahi mili, bina location ke load kar rahe hain.");
            fetchStoresFromFirebase(); 
        }, {
            enableHighAccuracy: true,
            timeout: 5000
        });
    } else {
        fetchStoresFromFirebase();
    }
}

// 2️⃣ Doori naapne ka formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 99999; 
    const R = 6371; // Earth radius in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c) * 1.7;
}

// 3️⃣ Firebase se data live kheechna
function fetchStoresFromFirebase() {
    if (typeof firebase === 'undefined') {
        console.error("Firebase load nahi hua hai Nilesh bhai!");
        return;
    }

    _lastFetchedKey = null;
    _allBatchesLoaded = false;

    fetchProductsBatch(5, (newProducts) => {
        const snapshot = {
            exists: () => true,
            val: () => {
                const obj = {};
                newProducts.forEach(p => obj[p.productId] = p);
                return obj;
            }
        };
        processSnapshotData(snapshot);
    });
}

function processSnapshotData(snapshot) {
        const sections = document.querySelectorAll('.product-list');
        if (sections.length === 0) return;

        sections.forEach(sec => sec.innerHTML = "");
        localProductsArray = [];
        let allProductsFlat = [];

        if (snapshot.exists()) {
            const products = snapshot.val();
            
            for (let prodId in products) {
                const prod = products[prodId];
                
                // आउट ऑफ स्टॉक सामान को यहाँ भी बाईपास कर सकते हैं
                if (prod.stockStatus === "Out of Stock") continue;

                // सीधा लोकेशन और दूरी निकालो
                const distance = calculateDistance(userLatitude, userLongitude, prod.lat, prod.lon);
                
                prod.productId = prodId;
                prod.distance = distance;
                prod.storeName = prod.shopName || "सस्ता स्टोर लोकल शॉप"; // आर्किटेक्चर के अनुसार

                localProductsArray.push(prod);
                allProductsFlat.push(prod);
            }

            // सॉर्टिंग लॉजिक (स्मार्ट या नियर)
            allProductsFlat.sort((a, b) => {
                if (sortMode === 'near') {
                    return a.distance - b.distance;
                }
                return getSmartScore(a) - getSmartScore(b);
            });

            displayHomeProducts(allProductsFlat);
        } else {
            sections[0].innerHTML = `<p style="text-align:center; color:#999; width:100%;">अभी कोई सामान लाइव नहीं है भाई!</p>`;
        }
}
           

// 4️⃣ Home Screen Layout Rendering
function displayHomeProducts(storesList, isAppend) {
    const sections = document.querySelectorAll('.product-list');
    if (sections.length === 0) return;
    if (!isAppend) sections.forEach(sec => sec.innerHTML = "");

    let currentSectionIndex = 0;
    let itemsInCurrentSection = 0;

    storesList.forEach((product) => {
            if (itemsInCurrentSection >= 2 && currentSectionIndex < sections.length - 1) {
                currentSectionIndex++;
                itemsInCurrentSection = 0;
            }

            const targetSection = sections[currentSectionIndex];
            const productCard = document.createElement('div');
           productCard.className = 'product-card';
// Ye lines add karo:
productCard.dataset.storeid = product.storeId;
productCard.dataset.prodname = product.productName;
productCard.setAttribute('data-category', product.category || "General"); 

            let distanceTxt = product.distance === 99999 ? "📍 Location Off" : (product.distance < 1 ? `${(product.distance * 1000).toFixed(0)} m` : `${product.distance.toFixed(1)} km`);
            // 🎯 गलत ब्रैकेट और 1 को हटाकर सीधा सही लिंक कर दिया
const googleMapUrl = `https://www.google.com/maps?q=${product.lat},${product.lon}`;

            productCard.innerHTML = `
                <img src="${product.photo || 'rasgulla.jpg'}" alt="${product.productName}">
                <div class="product-info">
                    <h3 class="product-name">${product.productName} (${product.unit || '1kg'})</h3>
                    <span class="product-price">₹${product.price}</span>
<span class="store-name" style="cursor:pointer; color:#4285f4; font-weight:bold;" onclick="openSingleStorePageByUID('${product.storeId}', '${product.storeName}')">🏪 ${product.storeName}</span>

                    <span class="distance">📍 ${distanceTxt}</span>
                    <a href="${googleMapUrl}" target="_blank" class="map-btn">Map on 📍</a>
                </div>
            `;

            targetSection.appendChild(productCard);
            itemsInCurrentSection++;
    });
}

// 5️⃣ Advanced Search System
function setupAdvancedSearchSystem() {
    const searchInput = document.getElementById('input-khoj'); 
    if (!searchInput) return;

    let suggestBox = document.getElementById('search-suggestions');
    if (!suggestBox) {
        suggestBox = document.createElement('div');
        suggestBox.id = 'search-suggestions';
        suggestBox.style.cssText = "position:absolute; background:white; width:100%; max-height:200px; overflow-y:auto; box-shadow:0 4px 8px rgba(0,0,0,0.1); border-radius:8px; z-index:999; display:none; border:1px solid #eee; margin-top:12.5rem;";
        searchInput.parentNode.style.position = "relative"; 
        searchInput.parentNode.appendChild(suggestBox);
    }
    

    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        suggestBox.innerHTML = "";

        if (searchText.trim() === "") {
            suggestBox.style.display = "none";
            return;
        }

let suggestions = [];
let suggestionKeys = new Set();

// Step 1: Search ko parts mein todo
const parts = searchText.trim().split(/\s+/);
const mainWord = parts[0]; // pehla word = product naam
const filterWords = parts.slice(1).join(' '); // baaki = filter

// 🔥 Firebase se direct search bhi karo (background mein) - poora data nahi, sirf matching
if (mainWord.length >= 1) {
    firebase.database().ref('all_products')
        .orderByChild('productNameLower')
        .startAt(mainWord)
        .endAt(mainWord + '\uf8ff')
        .limitToFirst(20)
        .once('value', (snapshot) => {
            snapshot.forEach(child => {
                const prod = child.val();
                prod.productId = child.key;
                const exists = localProductsArray.some(p => p.productId === prod.productId);
                if (!exists) {
                    prod.distance = calculateDistance(userLatitude, userLongitude, prod.lat, prod.lon);
                    prod.storeName = prod.shopName || "सस्ता स्टोर लोकल शॉप";
                    localProductsArray.push(prod);
                }
            });
        });
}

// Step 2: Matching products dhundho
const matchingProds = localProductsArray.filter(prod => {
    const pName = (prod.productName || "").toLowerCase();
    const desc = (prod.description || "").toLowerCase();
    const tags = desc.split('\n').filter(l => l.trim().startsWith('#')).map(l => l.substring(1).trim().toLowerCase());
    
    // 🔥 Pehle TAGS check karo, phir Name
    const nameMatch = pName.toLowerCase().startsWith(mainWord);
    const tagMatch = !nameMatch && tags.some(t => t.startsWith(mainWord));
    
    return tagMatch || nameMatch;  // ✅ Tags ko priority!
});

if (matchingProds.length === 0) {
    suggestBox.style.display = "none";
    return;
}

// Step 3: Filter ke hisab se suggestions banao
matchingProds.forEach(prod => {
    const realName = prod.productName;
    const desc = (prod.description || "").toLowerCase();
    const allTagsForMatch = desc.split('\n').filter(l => l.trim().startsWith('#')).map(l => l.substring(1).trim());
    const nameMatchesSearch = realName.toLowerCase().startsWith(mainWord);
    const matchedTagForName = allTagsForMatch.find(t => t.toLowerCase().startsWith(mainWord));
    // Jo bhi match hua use hi display naam banao - agar naam match hua to naam, warna tag
    const pName = (!nameMatchesSearch && matchedTagForName) 
        ? matchedTagForName.charAt(0).toUpperCase() + matchedTagForName.slice(1) 
        : realName;
    const price = parseFloat(prod.price || 0);
    const descLines = desc.split('\n').map(l => l.trim()).filter(l => l);

    const sizes = descLines.filter(l => l.startsWith('@')).map(l => l.substring(1));
    const ages = descLines.filter(l => l.startsWith('/')).map(l => l.substring(1));
    const genders = descLines.filter(l => l.startsWith('&')).map(l => l.substring(1));
    const tags = descLines.filter(l => l.startsWith('#')).map(l => l.substring(1));
    const priceSteps = [100,200,300,500,1000,2000,5000].filter(s => price < s);

    const fw = filterWords.toLowerCase().trim();

    function addSug(label) {
        const key = label.toLowerCase();
        if (!suggestionKeys.has(key)) {
            suggestionKeys.add(key);
            suggestions.push({ label, search: label });
        }
    }

    // Filter nahi - sirf naam
    if (!fw) {
        if (pName.toLowerCase().startsWith(mainWord)) {
            // Naam match hua - naam suggest karo
            addSug(pName);
        } else {
            // Naam match nahi hua, matlab tag se match hua - woh tag suggest karo
            const matchingTag = tags.find(t => t.startsWith(mainWord));
            if (matchingTag) {
                addSug(matchingTag.charAt(0).toUpperCase() + matchingTag.slice(1));
            }
        }
        return;
    }

    // "under X size/gender Y" - 3 cheez ek saath
    const fullMatch = fw.match(/^under\s+(\d+)\s+(.+)$/);
    if (fullMatch) {
        const amt = parseInt(fullMatch[1]);
        const rest = fullMatch[2].trim();
        if (price < amt) {
            sizes.forEach(s => {
                if (('size ' + s.toLowerCase()).startsWith(rest) || s.toLowerCase().startsWith(rest))
                    addSug(`${pName} under ${amt} size ${s}`);
            });
            genders.forEach(g => {
                if (g.toLowerCase().startsWith(rest))
                    addSug(`${pName} under ${amt} ${g}`);
            });
        }
        return;
    }

    // "size X under" - size pehle under baad
    const sizeUnderMatch = fw.match(/^size\s+(\S+)\s+u(.*)$/) || fw.match(/^s\s+(\S+)\s+u(.*)$/);
    if (sizeUnderMatch) {
        const sFilter = sizeUnderMatch[1];
        sizes.forEach(s => {
            if (s.toLowerCase().startsWith(sFilter)) {
                priceSteps.forEach(step => addSug(`${pName} size ${s} under ${step}`));
            }
        });
        return;
    }

    // "gender under" - gender pehle under baad
    const genderUnderMatch = fw.match(/^(\w+)\s+u(.*)$/);
    if (genderUnderMatch) {
        const gFilter = genderUnderMatch[1];
        genders.forEach(g => {
            if (g.toLowerCase().startsWith(gFilter)) {
                priceSteps.forEach(step => addSug(`${pName} ${g} under ${step}`));
            }
        });
    }

    // "u" ya "under X" - price
    if ('under'.startsWith(fw) || fw.startsWith('under')) {
        const underNumOnly = fw.match(/^under\s+(\d+)$/);
        if (underNumOnly) {
            const amt = parseInt(underNumOnly[1]);
            if (price < amt) {
                addSug(`${pName} under ${amt}`);
                sizes.forEach(s => addSug(`${pName} under ${amt} size ${s}`));
                genders.forEach(g => addSug(`${pName} under ${amt} ${g}`));
            }
        } else {
            priceSteps.forEach(step => {
                if (`under ${step}`.startsWith(fw))
                    addSug(`${pName} under ${step}`);
            });
        }
        return;
    }

    // "size X" ya "s X"
    const sizeOnly = fw.match(/^size\s*(\S*)$/) || fw.match(/^s\s+(\S+)$/);
    if (sizeOnly) {
        const sFilter = sizeOnly[1] || '';
        sizes.forEach(s => {
            if (!sFilter || s.toLowerCase().startsWith(sFilter)) {
                addSug(`${pName} size ${s}`);
                priceSteps.forEach(step => addSug(`${pName} size ${s} under ${step}`));
            }
        });
        return;
    }

    // "s" short - size
    if (fw.length <= 2 && fw.startsWith('s')) {
        sizes.forEach(s => {
            if (s.toLowerCase().startsWith(fw) || ('size ' + s.toLowerCase()).startsWith(fw))
                addSug(`${pName} size ${s}`);
        });
    }

    // "for X" ya "f" likhne par gender suggestions
    const forMatch = fw.match(/^for\s+(.*)$/) || (fw.startsWith('f') ? [null, fw.substring(1)] : null);
    if (forMatch) {
        const gFilter = (forMatch[1] || '').trim();
        genders.forEach(g => {
            if (!gFilter || g.toLowerCase().startsWith(gFilter)) {
                addSug(`${pName} for ${g}`);
                sizes.forEach(s => addSug(`${pName} for ${g} size ${s}`));
                priceSteps.forEach(step => {
                    addSug(`${pName} for ${g} under ${step}`);
                    sizes.forEach(s => addSug(`${pName} for ${g} size ${s} under ${step}`));
                });
            }
        });
    }

    // Gender bina "for" ke bhi (male, female direct)
    genders.forEach(g => {
        if (g.toLowerCase().startsWith(fw)) {
            addSug(`${pName} ${g}`);
            sizes.forEach(s => addSug(`${pName} ${g} size ${s}`));
            priceSteps.forEach(step => {
                addSug(`${pName} ${g} under ${step}`);
                sizes.forEach(s => addSug(`${pName} ${g} size ${s} under ${step}`));
            });
        }
    });

    // Age: "12" likhne par "12 years" ya "for 12 years"
    if (/^\d/.test(fw)) {
        ages.forEach(a => {
            if (a.toLowerCase().startsWith(fw)) {
                addSug(`${pName} ${a}`);
                priceSteps.forEach(step => addSug(`${pName} ${a} under ${step}`));
                sizes.forEach(s => addSug(`${pName} ${a} size ${s}`));
            }
        });
    }
    // Tags
    tags.forEach(t => {
        if (t.toLowerCase().startsWith(fw))
            addSug(`${pName} ${t}`);
    });
});

// Step 4: Dikhao
if (suggestions.length > 0) {
    suggestBox.style.display = "block";
    suggestions.slice(0, 8).forEach(sug => {
        const item = document.createElement('div');
        item.style.cssText = "padding:10px; cursor:pointer; font-size:0.9rem; border-bottom:1px solid #f9f9f9; color:#333; text-align:left; font-weight:bold;";
        item.innerHTML = `🔍 ${sug.label}`;
        item.onclick = () => {
            searchInput.value = sug.search;
            suggestBox.style.display = "none";
            executeFinalSearch(sug.search);
        };
        suggestBox.appendChild(item);
    });
} else {
    suggestBox.style.display = "none";
}
    });
}

// 6️⃣ Execute Final Search (Clean Version - No Heading, Auto Category Sort)
function executeFinalSearch(keyword) {
    const sections = document.querySelectorAll('.product-list');
    if (sections.length === 0) return;

    sections.forEach(sec => sec.innerHTML = ""); 

    const searchKey = keyword.toLowerCase().trim();
    const cleanSearch = searchKey.replace(/\s+/g, '');

    // [भाग 1] ग्राहक ने जो नाम खोजा है उसे निकालो
const parts = searchKey.split(/\s+/);
    const mainWord = parts[0];
    const maxPrice = (() => { const i = parts.indexOf('under'); return i !== -1 ? parseInt(parts[i+1]) || Infinity : Infinity; })();
    const sizeFilter = (() => { const i = parts.indexOf('size'); return i !== -1 ? (parts[i+1] || '').toUpperCase() : null; })();
    const genderFilter = (() => { const i = parts.indexOf('for'); if(i !== -1 && parts[i+1]) return parts[i+1]; return ['male','female','men','women','boy','girl'].find(g => parts.includes(g)) || null; })();
    const ageFilter = (() => { for(const p of parts){ if(/^\d+years?$/.test(p)) return p.replace(/years?/,''); if(/^\d+$/.test(p) && parseInt(p)<100) return p; } return null; })();

    let filteredResults = localProductsArray.filter(prod => {
        const pName = (prod.productName || "").toLowerCase();
        const price = parseFloat(prod.price || 0);
        const descLines = (prod.description || "").toLowerCase().split('\n').map(l => l.trim());
        const prodSizes = descLines.filter(l => l.startsWith('@')).map(l => l.substring(1).toUpperCase());
        const prodGenders = descLines.filter(l => l.startsWith('&')).map(l => l.substring(1).toLowerCase());
        const prodAges = descLines.filter(l => l.startsWith('/')).map(l => l.substring(1).toLowerCase());

        
// ✅ Naya:
const customTags = descLines.filter(l => l.startsWith('#')).map(l => l.substring(1).toLowerCase());

// 🔥 Pehle TAGS check karo, phir Name
const tagMatch = customTags.some(t => t.includes(mainWord) || mainWord.includes(t));
const nameMatch = pName.includes(mainWord);

if (!tagMatch && !nameMatch) return false;  // ✅ Tags ko priority!
      
        if (price > maxPrice) return false;
        if (sizeFilter && !prodSizes.includes(sizeFilter)) return false;
        if (genderFilter && !prodGenders.some(g => g.includes(genderFilter))) return false;
        if (ageFilter && !prodAges.some(a => a.includes(ageFilter))) return false;
        return true;
    });

    // सबसे सस्ता सामान पहले
    // Search result ko rank ke hisab se sort karo

// Search result ko rank ke hisab se sort karo
filteredResults.sort((a, b) => {
    if (sortMode === 'near') {
        return a.distance - b.distance;
    }
    return getSmartScore(a) - getSmartScore(b);
});

    if(filteredResults.length === 0) {
        // Kuch match nahi mila - isliye sabse paas/sasta wala saara saman dikhao (jaise Flipkart karta hai)
        
        
        let allFallback = [...localProductsArray];
        allFallback.sort((a, b) => {
            if (sortMode === 'near') return a.distance - b.distance;
            return getSmartScore(a) - getSmartScore(b);
        });
        
        allFallback.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.setAttribute('data-storeid', product.storeId);
            productCard.setAttribute('data-prodname', product.productName);

            const googleMapUrl = `https://www.google.com/maps?q=${product.lat},${product.lon}`;
            let distanceTxt = product.distance === 99999 ? "📍 Location Off" : (product.distance < 1 ? `${(product.distance * 1000).toFixed(0)} m` : `${product.distance.toFixed(1)} km`);

            productCard.innerHTML = `
                <img src="${product.photo || 'rasgulla.jpg'}" alt="${product.productName}">
                <div class="product-info">
                    <h3 class="product-name">${product.productName} (${product.unit || '1kg'})</h3>
                    <span class="product-price" style="color: #2e7d32; font-weight:bold;">₹${product.price}</span>
                    <span class="store-name" style="cursor:pointer; color:#4285f4; font-weight:bold;" onclick="openSingleStorePageByUID('${product.storeId}', '${product.storeName}')">🏪 ${product.storeName}</span>
                    <span class="distance">📍 ${distanceTxt}</span>
                    <a href="${googleMapUrl}" target="_blank" class="map-btn">Map on 📍</a>
                </div>
            `;
            sections[0].appendChild(productCard);
        });
        return;
    }

    // बैकग्राउंड में सर्च किए गए पहले सामान की कैटेगरी को पकड़ो
    const matchedCategory = filteredResults[0].category || ""; 

// [A] सबसे ऊपर सर्च वाला सामान दिखाओ
    filteredResults.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
productCard.setAttribute('data-storeid', product.storeId);
productCard.setAttribute('data-prodname', product.productName);

        const googleMapUrl = `https://www.google.com/maps?q=${product.lat},${product.lon}`;

        let distanceTxt = product.distance === 99999 ? "📍 Location Off" : (product.distance < 1 ? `${(product.distance * 1000).toFixed(0)} m` : `${product.distance.toFixed(1)} km`);

        productCard.innerHTML = `
            <img src="${product.photo || 'rasgulla.jpg'}" alt="${product.productName}">
            <div class="product-info">
                <h3 class="product-name">${product.productName} (${product.unit || '1kg'})</h3>
                <span class="product-price" style="color: #2e7d32; font-weight:bold;">₹${product.price}</span>
               
<span class="store-name" style="cursor:pointer; color:#4285f4; font-weight:bold;" onclick="openSingleStorePageByUID('${product.storeId}', '${product.storeName}')">🏪 ${product.storeName}</span>

                <span class="distance">📍 ${distanceTxt}</span>
                <a href="${googleMapUrl}" target="_blank" class="map-btn">Map on 📍</a>
            </div>
        `;
        sections[0].appendChild(productCard);
    });
// [B] बिना हेडिंग के चुपचाप उसी कैटेगरी का बाकी सामान नीचे लोड करो
    localProductsArray.forEach(product => {
        const pName = product.productName ? product.productName.toLowerCase() : "";
        const cleanProdName = pName.replace(/\s+/g, ''); 
        const pCategory = product.category || "";

        if (!pName.includes(searchKey) && !cleanProdName.includes(cleanSearch)) {
            if (matchedCategory !== "" && pCategory === matchedCategory) {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
productCard.setAttribute('data-storeid', product.storeId);
productCard.setAttribute('data-prodname', product.productName);

                const googleMapUrl = `https://www.google.com/maps?q=${product.lat},${product.lon}`;

                let distanceTxt = product.distance === 99999 ? "📍 Location Off" : (product.distance < 1 ? `${(product.distance * 1000).toFixed(0)} m` : `${product.distance.toFixed(1)} km`);

                productCard.innerHTML = `
                    <img src="${product.photo || 'rasgulla.jpg'}" alt="${product.productName}">
                    <div class="product-info">
                        <h3 class="product-name">${product.productName} (${product.unit || '1kg'})</h3>
                        <span class="product-price">₹${product.price}</span>
                        <span class="store-name">🏪 ${product.storeName}</span>
                        <span class="distance">📍 ${distanceTxt}</span>
                        <a href="${googleMapUrl}" target="_blank" class="map-btn">Map on 📍</a>
                    </div>
                `;
                sections[0].appendChild(productCard);
            }
        }
    });

    // [C] सबसे नीचे बाकी बचा-कुचा सारा सामान लोड करो
    localProductsArray.forEach(product => {
        const pName = product.productName ? product.productName.toLowerCase() : "";
        const cleanProdName = pName.replace(/\s+/g, ''); 
        const pCategory = product.category || "";

        if (!pName.includes(searchKey) && !cleanProdName.includes(cleanSearch)) {
            if (matchedCategory === "" || pCategory !== matchedCategory) {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
productCard.setAttribute('data-storeid', product.storeId);
productCard.setAttribute('data-prodname', product.productName);

                const googleMapUrl = `https://www.google.com/maps?q=${product.lat},${product.lon}`;

                let distanceTxt = product.distance === 99999 ? "📍 Location Off" : (product.distance < 1 ? `${(product.distance * 1000).toFixed(0)} m` : `${product.distance.toFixed(1)} km`);

                productCard.innerHTML = `
                    <img src="${product.photo || 'rasgulla.jpg'}" alt="${product.productName}">
                    <div class="product-info">
                        <h3 class="product-name">${product.productName} (${product.unit || '1kg'})</h3>
                        <span class="product-price">₹${product.price}</span>
                        <span class="store-name">🏪 ${product.storeName}</span>
                        <span class="distance">📍 ${distanceTxt}</span>
                        <a href="${googleMapUrl}" target="_blank" class="map-btn">Map on 📍</a>
                    </div>
                `;
                sections[0].appendChild(productCard);
            }
        }
    });
}


function openSingleStorePageByUID(storeId, storeName) {
    if (storeId) {
        // आगे ./ लगा दिया ताकि ऑनलाइन सर्वर तुरंत पहचान ले
        window.location.href = `./profile.html?storeId=${storeId}&prodName=${encodeURIComponent(storeName)}`;
    } else {
        console.error("Store ID नहीं मिली भाई!");
    }
}


// Dom Content Loaded par system start karna
// customer.js के सबसे नीचे वाले हिस्से (DOM Content Loaded) को इससे बदलें
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        // 🌟 नीलेश भाई का बाईपास: बिना GPS के इंतजार के सीधे फायरबेस चालू करो
        fetchStoresFromFirebase(); 
        
        // बैकग्राउंड में चुपचाप लोकेशन लेता रहेगा, कोड रुकेगा नहीं
        setupAdvancedSearchSystem();
        getUserLiveLocation(); 
    } else {
        console.error("फायरबेस लोड नहीं हुआ है भाई!");
    }
});

// ==========================================
// 🚀 नीलेश भाई का 100% सेफ फिल्टर: आउट ऑफ स्टॉक सामान को लिस्ट से ही साफ करने के लिए
// ==========================================
(function() {
    if (typeof firebase !== 'undefined') {
        // फायरबेस के डेटाबेस रेफ को दोबारा पकड़ो ताकि डेटा आते ही उसे फिल्टर कर सकें
        firebase.database().ref('stores').on('value', (snapshot) => {
            if (snapshot.exists()) {
                // यह हर बार डेटा लोड होने पर 'Out of Stock' सामानों को हमारे लोकल बैकअप से गायब कर देगा
                localProductsArray = localProductsArray.filter(prod => prod.stockStatus !== "Out of Stock");
                
                // होम स्क्रीन के सभी सेक्शन्स में से भी आउट ऑफ स्टॉक वाले डिब्बों को जड़ से उखाड़ देगा
                const allCards = document.querySelectorAll('.product-card');
                allCards.forEach(card => {
                    const productNameElement = card.querySelector('.product-name');
                    if (productNameElement) {
                        const currentName = productNameElement.textContent.split(' (')[0].trim();
                        // पूरे बैकअप एरे (localProductsArray) में दोबारा चेक करो
                        const matchedProduct = allStoresData.flatMap(s => s.products).find(p => p.productName === currentName);
                        
                        // अगर डेटाबेस में वह सामान 'Out of Stock' है, तो उसे DOM (पेज) से पूरी तरह डिलीट (Remove) कर दो
                        if (matchedProduct && matchedProduct.stockStatus === "Out of Stock") {
                            card.remove(); // 🎯 यह डिब्बे को पूरी तरह नष्ट कर देगा, कोई खाली जगह नहीं बचेगी!
                        }
                    }
                });
            }
        });
    }
})();

// 🌟 बैकग्राउंड चेकर: सर्च या कैटेगरी लोडिंग के दौरान भी कोई आउट ऑफ स्टॉक सामान दिखे तो तुरंत रिमूव करो
setInterval(() => {
    document.querySelectorAll('.product-card').forEach(card => {
        const productNameElement = card.querySelector('.product-name');
        if (productNameElement) {
            const currentName = productNameElement.textContent.split(' (')[0].trim();
            const isOut = localProductsArray.some(p => p.productName === currentName && p.stockStatus === "Out of Stock");
            if (isOut) {
                card.remove(); // जड़ से खत्म!
            }
        }
    });
}, 200);




// ==========================================
// 🚀 नीलेश भाई का सुपर रो-फिक्सर: सारे जिंदा प्रोडक्ट्स को एक लाइन में सटाने के लिए
// ==========================================
function fixEmptySpaces() {
    const sections = document.querySelectorAll('.product-list');
    if (sections.length < 2) return; // अगर एक ही सेक्शन है तो जरूरत नहीं

    const firstSection = sections[0]; // पहला मुख्य सेक्शन

    // बाकी के जितने भी सेक्शन्स हैं, उनके अंदर के जिंदा प्रोडक्ट्स को पहले वाले में डालो
    sections.forEach((sec, index) => {
        if (index > 0) {
            const cards = sec.querySelectorAll('.product-card');
            cards.forEach(card => {
                firstSection.appendChild(card); // उठाकर पहले सेक्शन में डाल दिया
            });
        }
    });

    // 🎯 अब पहले सेक्शन को पूरी तरह से लाइन में सटने के लिए कमांड दो
    firstSection.style.display = 'flex';
    firstSection.style.flexWrap = 'wrap';
    firstSection.style.justifyContent = 'flex-start';
    firstSection.style.gap = '10px'; // डिब्बों के बीच का गैप
    
    // हर कार्ड की चौड़ाई मोबाइल स्क्रीन के हिसाब से सेट करो ताकि एक लाइन में 2 सामान आएं
    const allCards = firstSection.querySelectorAll('.product-card');
    allCards.forEach(card => {
        card.style.flex = '0 1 calc(50% - 5px)';
        card.style.boxSizing = 'border-box';
    });
}

// 🌟 हर 300 मिलीसेकंड में यह जिंदा डिब्बों को खाली जगह पर खींचकर सेट करता रहेगा
setInterval(fixEmptySpaces, 300);

function getTravelCost(distance) {
    if (distance <= 0.5) return 5;
    if (distance <= 1) return 15;
    if (distance <= 2) return 25;
    if (distance <= 3) return 35;
    if (distance <= 4) return 40;
    if (distance <= 5) return 50;
    if (distance <= 6) return 55;
    if (distance <= 7) return 60;
    if (distance <= 8) return 70;
    if (distance <= 9) return 85;
    if (distance <= 10) return 100;
    if (distance <= 15) return 200;
    if (distance <= 20) return 800;
    if (distance <= 50) return 1000;
    return 2000;
}
function getSmartScore(prod) {
    const price = parseFloat(prod.price || 0);
    const travelCost = getTravelCost(prod.distance);
    return price + travelCost;
}

let _isFetchingBatch = false;

window.addEventListener('scroll', function() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.body.offsetHeight;
    if (scrollPosition >= pageHeight - 400 && !_allBatchesLoaded && !_isFetchingBatch) {
        _isFetchingBatch = true;
        fetchProductsBatch(5, (newProducts) => {
            newProducts.forEach(prod => {
                const distance = calculateDistance(userLatitude, userLongitude, prod.lat, prod.lon);
                prod.distance = distance;
                prod.storeName = prod.shopName || "सस्ता स्टोर लोकल शॉप";
                localProductsArray.push(prod);
            });
            displayHomeProducts(newProducts, true);
            _isFetchingBatch = false;
        });
    }
});