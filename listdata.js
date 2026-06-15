// 1. दूरी कैलकुलेट करने का फंक्शन
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 2. लिस्ट लोड करने का फंक्शन
function loadListSystem() {
    const container = document.querySelector('.container');
    if (!container) return;

    navigator.geolocation.getCurrentPosition((pos) => {
        const uLat = pos.coords.latitude;
        const uLon = pos.coords.longitude;

        firebase.database().ref('stores').on('value', (snapshot) => {
            container.innerHTML = "";
            const stores = snapshot.val();
            if (!stores) return;
            
            // 1. दुकानों की लिस्ट तैयार और सॉर्ट की
            let storesArray = Object.keys(stores).map(key => ({ id: key, ...stores[key] }));
            storesArray.forEach(store => {
                let products = Object.values(store.products || {});
                let dist = calculateDistance(uLat, uLon, store.location?.latitude || 0, store.location?.longitude || 0);
                let travelCost = window.getTravelCost ? window.getTravelCost(dist) : (dist <= 0.5) ? 5 : (dist <= 1) ? 15 : (dist <= 2) ? 25 : (dist <= 3) ? 35 : (dist <= 4) ? 40 : (dist <= 5) ? 50 : (dist <= 6) ? 55 : (dist <= 7) ? 60 : (dist <= 8) ? 70 : (dist <= 9) ? 85 : (dist <= 10) ? 100 : (dist <= 15) ? 200 : (dist <= 20) ? 300 : (dist <= 50) ? 1000 : 2000;
let totalBill = products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
store.effectivePrice = totalBill + travelCost;
            });
            storesArray.sort((a, b) => a.effectivePrice - b.effectivePrice);

            // 2. अब सिर्फ इस सॉर्टेड लिस्ट को लूप करें (पुराना 'for in' लूप हटा दिया)
            storesArray.forEach((store) => {
                const storeId = store.id;
                const productsArray = Object.values(store.products || {});
                if (productsArray.length === 0) return;

                const dist = calculateDistance(uLat, uLon, store.location?.latitude || 0, store.location?.longitude || 0);
                const distText = dist < 1 ? (dist * 1000).toFixed(0) + " m" : dist.toFixed(1) + " km";
                const shopName = store.shopName || "सस्ता स्टोर";
                const photo = (store.photos && store.photos[0]) ? store.photos[0] : 'rasgulla.jpg';
                const totalBill = productsArray.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
                const availableCount = productsArray.filter(p => p.stockStatus !== "Out of Stock").length;
                
                const card = document.createElement('div');
                card.className = 'store-card';
const allCategories = productsArray.map(p => (p.category || "")).join(",").toLowerCase();
card.setAttribute('data-category', allCategories);

                card.setAttribute('data-distance-km', dist.toFixed(4));
                
                let itemsHtml = "";
                productsArray.forEach((prod, index) => {
                    if (prod.stockStatus === "Out of Stock") return;
               let rowHtml = `<div class="item-row" data-desc="${prod.description || ''}" data-price="${prod.price || 0}"><span>${prod.productName}</span> <span>₹${prod.price}</span></div>`;
                    if (index < 1) itemsHtml += rowHtml;
                    else {
                        if (index === 1) itemsHtml += `<div id="extra-items-${storeId}" style="display: none;">`;
                        itemsHtml += rowHtml;
                    }
                });
                if (productsArray.length > 1) itemsHtml += `</div>`; 

                card.innerHTML = `
                    <div class="store-top">
                        <img src="${photo}" class="store-img">
                        <div class="store-details">
                            <h2 class="store-name">${shopName}</h2>
                            <div class="dist-tag" style="color:green; font-weight:bold;">${distText}</div>
                        </div>
                    </div>
                    <div class="stats-box" style="display:flex; border:1px solid #ddd; border-radius:8px; margin:10px 0; overflow:hidden;">
                        <div style="flex:1; text-align:center; padding:8px; border-right:1px solid #ddd;">
                            <small style="color:#666;">Total Bill</small><br><strong>₹${totalBill}</strong>
                        </div>
                        <div style="flex:1; text-align:center; padding:8px;">
                            <small style="color:#666;">Available</small><br><strong>${availableCount}/25</strong>
                        </div>
                    </div>
                    <div class="items-list">${itemsHtml}</div>
                    ${productsArray.length > 3 ? `<button class="view-all" onclick="toggleItems('extra-items-${storeId}')">View All Items <i class="fa-solid fa-chevron-down"></i></button>` : ''}
                    <button class="map-btn" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${store.location?.latitude},${store.location?.longitude}', '_blank')">
                        <i class="fa-solid fa-location-dot"></i> MAP ON
                    </button>
                `;
                container.appendChild(card);
            });
        });
    });
}


// 3. सर्च और फिल्टर का एकमात्र फंक्शन
function startSearch() {
    const tags = Array.from(document.querySelectorAll('#tag-container span')).map(t => t.innerText.replace('×', '').trim().toLowerCase());
    const mainInput = document.getElementById('mainSearch').value.toLowerCase().trim();
    const searchTerms = [...new Set([...tags, ...(mainInput ? [mainInput] : [])])];
    const totalSearched = searchTerms.length;

    document.querySelectorAll('.store-card').forEach(card => {
        let cardTotal = 0;
        let foundTerms = new Set();
        const allItems = card.querySelectorAll('.item-row');

        allItems.forEach(row => {
            const pName = row.querySelector('span:first-child').textContent.toLowerCase();
            const pPrice = parseFloat(row.querySelector('span:last-child').innerText.replace('₹', '')) || 0;
            const descLines = (row.getAttribute('data-desc') || "").toLowerCase().split('\n').map(l => l.trim());
            const prodSizes = descLines.filter(l => l.startsWith('@')).map(l => l.substring(1).toUpperCase());
            const prodGenders = descLines.filter(l => l.startsWith('&')).map(l => l.substring(1).toLowerCase());
            const prodAges = descLines.filter(l => l.startsWith('/')).map(l => l.substring(1).toLowerCase());

            let isMatch = totalSearched === 0 || searchTerms.some(term => {
                const parts = term.split(/\s+/);
                const mainWord = parts[0];
                const maxPrice = (() => { const i = parts.indexOf('under'); return i !== -1 ? parseInt(parts[i+1]) || Infinity : Infinity; })();
                const sizeFilter = (() => { const i = parts.indexOf('size'); return i !== -1 ? (parts[i+1] || '').toUpperCase() : null; })();
                const genderFilter = (() => { const i = parts.indexOf('for'); if(i !== -1 && parts[i+1]) return parts[i+1]; return ['male','female','men','women','boy','girl'].find(g => parts.includes(g)) || null; })();
                const ageFilter = (() => { for(const p of parts){ if(/^\d+years?$/.test(p)) return p.replace(/years?/,''); if(/^\d+$/.test(p) && parseInt(p)<100) return p; } return null; })();
                const price = parseFloat(row.getAttribute('data-price') || 0);

                if (!pName.includes(mainWord)) return false;
                if (price > maxPrice) return false;
                if (sizeFilter && !prodSizes.includes(sizeFilter)) return false;
                if (genderFilter && !prodGenders.some(g => g.includes(genderFilter))) return false;
                if (ageFilter && !prodAges.some(a => a.includes(ageFilter))) return false;
                return true;
            });
            
            row.style.display = isMatch ? 'flex' : 'none';
            if (isMatch) {
                cardTotal += pPrice;
                searchTerms.forEach(term => { if(isMatch) foundTerms.add(term); });
            }
        });

        if (totalSearched === 0) {
            card.style.display = 'block';
        } else if (foundTerms.size > 0 || (totalSearched > 0 && cardTotal > 0)) {
            card.style.display = 'block';
            card.querySelectorAll('strong')[0].innerText = '₹' + cardTotal;
            card.querySelectorAll('strong')[1].innerText = foundTerms.size + '/' + totalSearched;
        } else {
            card.style.display = 'none';
        }
    });

    // सर्च के बाद सॉर्टिंग
    const container = document.querySelector('.container');
    const allCards = Array.from(container.querySelectorAll('.store-card'));
const visibleCards = allCards.filter(c => c.style.display !== 'none');
const hiddenCards = allCards.filter(c => c.style.display === 'none');
visibleCards.sort((a, b) => {
    const distA = parseFloat(a.getAttribute('data-distance-km') || 0);
    const distB = parseFloat(b.getAttribute('data-distance-km') || 0);
    const priceA = parseFloat((a.querySelector('.stats-box strong')?.innerText || '0').replace('₹','')) || 0;
    const priceB = parseFloat((b.querySelector('.stats-box strong')?.innerText || '0').replace('₹','')) || 0;
    const costA = (distA<=0.5)?5:(distA<=1)?15:(distA<=2)?25:(distA<=3)?35:(distA<=4)?40:(distA<=5)?50:(distA<=6)?55:(distA<=7)?60:(distA<=8)?70:(distA<=9)?85:(distA<=10)?100:(distA<=15)?200:(distA<=20)?300:(distA<=50)?1000:2000;
    const costB = (distB<=0.5)?5:(distB<=1)?15:(distB<=2)?25:(distB<=3)?35:(distB<=4)?40:(distB<=5)?50:(distB<=6)?55:(distB<=7)?60:(distB<=8)?70:(distB<=9)?85:(distB<=10)?100:(distB<=15)?200:(distB<=20)?300:(distB<=50)?1000:2000;
    return (priceA + costA) - (priceB + costB);
});
[...visibleCards, ...hiddenCards].forEach(c => container.appendChild(c));
}


// 4. अन्य हेल्पर्स
function addTag(value) {
    const tagContainer = document.getElementById('tag-container');
    const tag = document.createElement('span');
    tag.style = "background:#ff9800; color:#fff; padding:5px 10px; border-radius:15px; margin:5px; display:inline-flex; align-items:center;";
    tag.innerHTML = `${value} <i class="fa-solid fa-xmark" style="margin-left:8px; cursor:pointer;"></i>`;
    tag.querySelector('i').onclick = function() { this.parentElement.remove(); startSearch(); };
    tagContainer.appendChild(tag);
    startSearch();
}

document.getElementById('mainSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (this.value.trim() !== "") { addTag(this.value.trim()); this.value = ""; }
    }
});

document.addEventListener('DOMContentLoaded', loadListSystem);
function toggleItems(id) { const extra = document.getElementById(id); if(extra) extra.style.display = (extra.style.display === "none") ? "block" : "none"; }
function showSuggestions(val) {
    const list = document.getElementById('suggestion-list');
    if (!list) return;
    list.innerHTML = "";
    if (val === "") { list.style.display = "none"; return; }

    const searchText = val.toLowerCase().trim();
    const parts = searchText.split(/\s+/);
    const mainWord = parts[0];
    const fw = parts.slice(1).join(' ').trim();

    let suggestions = [];
    let suggestionKeys = new Set();

    function addSug(label) {
        const key = label.toLowerCase();
        if (!suggestionKeys.has(key)) { suggestionKeys.add(key); suggestions.push(label); }
    }

    Array.from(document.querySelectorAll('.item-row')).forEach(row => {
        const pName = row.querySelector('span:first-child')?.innerText.trim() || "";
        if (!pName.toLowerCase().includes(mainWord)) return;

        const desc = (row.getAttribute('data-desc') || "").toLowerCase();
        const price = parseFloat(row.getAttribute('data-price') || 0);
        const descLines = desc.split('\n').map(l => l.trim());
        const sizes = descLines.filter(l => l.startsWith('@')).map(l => l.substring(1));
        const genders = descLines.filter(l => l.startsWith('&')).map(l => l.substring(1));
        const ages = descLines.filter(l => l.startsWith('/')).map(l => l.substring(1));
        const priceSteps = [100,200,300,500,1000,2000,5000].filter(s => price < s);

        if (!fw) { addSug(pName); return; }

        // "f" ya "for" → gender
        if (fw.startsWith('f')) {
            const gFilter = fw.startsWith('for ') ? fw.substring(4) : '';
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

        // "s" ya "size X" → size
        if (fw.startsWith('s')) {
            const sFilter = fw.startsWith('size ') ? fw.substring(5) : '';
            sizes.forEach(s => {
                if (!sFilter || s.toLowerCase().startsWith(sFilter)) {
                    addSug(`${pName} size ${s}`);
                    priceSteps.forEach(step => addSug(`${pName} size ${s} under ${step}`));
                }
            });
        }

        // "u" ya "under X" → price
        if (fw.startsWith('u')) {
            const underNum = fw.match(/^under\s+(\d+)$/);
            if (underNum) {
                const amt = parseInt(underNum[1]);
                if (price < amt) {
                    addSug(`${pName} under ${amt}`);
                    sizes.forEach(s => addSug(`${pName} under ${amt} size ${s}`));
                    genders.forEach(g => addSug(`${pName} under ${amt} for ${g}`));
                }
            } else {
                priceSteps.forEach(step => {
                    if (`under ${step}`.startsWith(fw)) addSug(`${pName} under ${step}`);
                });
            }
        }

        // number → age
        if (/^\d/.test(fw)) {
            ages.forEach(a => {
                if (a.toLowerCase().startsWith(fw)) {
                    addSug(`${pName} ${a}`);
                    priceSteps.forEach(step => addSug(`${pName} ${a} under ${step}`));
                }
            });
        }

        // direct gender
        genders.forEach(g => {
            if (g.toLowerCase().startsWith(fw)) {
                addSug(`${pName} ${g}`);
                priceSteps.forEach(step => addSug(`${pName} ${g} under ${step}`));
            }
        });
    });

    if (suggestions.length > 0) {
        list.style.display = "block";
        suggestions.slice(0, 8).forEach(m => {
            const item = document.createElement('div');
            item.style.cssText = "padding:10px; cursor:pointer; font-size:0.9rem; border-bottom:1px solid #f9f9f9; color:#333; text-align:left; font-weight:bold; background:#fff;";
            item.innerHTML = `🔍 ${m}`;
            item.onclick = () => {
                document.getElementById('mainSearch').value = m;
                addTag(m);
                document.getElementById('mainSearch').value = "";
                list.style.display = "none";
            };
            list.appendChild(item);
        });
    } else {
        list.style.display = "none";
    }
}
// Input पर listener
document.getElementById('mainSearch').addEventListener('input', function(e) {
    showSuggestions(e.target.value);
});
