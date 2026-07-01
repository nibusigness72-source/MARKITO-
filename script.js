// हिस्सा 1: बटन नेविगेशन (HOME और ACCOUNT के लिए)
const homeBtn = document.getElementById('home-btn');
if (homeBtn) {
    homeBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
}

const accountBtn = document.getElementById('account-btn');
if (accountBtn) {
    accountBtn.onclick = () => window.location.href = 'account.html';
}
// ADD बटन को 6 डिब्बे वाले पेज से जोड़ने के लिए
const addBtn = document.querySelector('.add-btn'); 
if (addBtn) {
    addBtn.onclick = () => openAddProductPage();
}


// हिस्सा 2: 6 डिब्बे वाला गैलरी पेज बनाना (सुधरा हुआ)
function openAddProductPage() {
    // ⬇️ यह नई लाइन जोड़ी: पेज खुलते ही लोकेशन और सर्च बॉक्स दोनों को छुपा दो
    const locBar = document.querySelector('.location-bar');
    if (locBar) locBar.style.display = "none";
    const sBox = document.getElementById('search-box');
    if (sBox) sBox.style.display = "none";

    const overlay = document.createElement('div');
    overlay.id = 'product-overlay';
    
    // स्टाइल: फुल स्क्रीन सफेद पेज
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:white; z-index:5000; overflow-y:auto; display:flex; flex-direction:column; align-items:center; padding-top:5rem; font-family: sans-serif;";

    overlay.innerHTML = `
        <button onclick="this.parentElement.remove(); const loc = document.querySelector('.location-bar'); if(loc) loc.style.display='flex'; const sb = document.getElementById('search-box'); if(sb) sb.style.display='flex';" style="position:fixed; top:1.25rem; left:1.25rem; padding:0.625rem 1.25rem; background:#28a745; color:white; border:none; border-radius:0.5rem; font-weight:bold; z-index:5001; cursor:pointer;">Back</button>
        
        <h2 style="position:fixed; top:0; width:100%; text-align:center; background:white; padding:1.25rem 0; margin:0; font-weight:900; font-size:1.5rem; box-shadow:0 0.125rem 0.312rem rgba(0,0,0,0.1); z-index:4999;">ADD PRODUCTS</h2>

<div id="box-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; padding:1.25rem; width:100%; box-sizing:border-box;">
    ${[0, 1, 2, 3, 4, 5].map((index) => `
        <div id="outer-box-${index}" onclick="goToForm(${index})" style="border:0.156rem solid #d0e0fc; border-radius:20px; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.875rem 0.625rem; cursor:pointer; position:relative; overflow:hidden; min-height:160px;">
            <div style="width:60px; height:3.75rem; border-radius:50%; background:#ebf3ff; color:#4285f4; display:flex; align-items:center; justify-content:center; font-size:2.1875rem; font-weight:bold; margin-bottom:0.937rem;">+</div>
            <p style="margin:0; font-weight:700; color:#444;">Add Product (Box ${index + 1})</p>
        </div>
    `).join('')}
</div>

            <div style="padding:1.25rem; width:100%; text-align:center;">
            <button onclick="addNewBoxes()" style="width:80%; max-width:6.25rem; padding:0.937rem; background:#4285f4; color:white; border:none; border-radius:2.1875rem; font-weight:bold; font-size:1.125rem; box-shadow:0 0.375rem 0.937rem rgba(66, 133, 244, 0.3); cursor:pointer;">
                + ADD
            </button>
        </div>
    `;  //  यहाँ पर यह बैकटिक लगा दो भाई!
    document.body.appendChild(overlay);
} 


if(typeof loadSavedProductsFromDatabase === 'function') { loadSavedProductsFromDatabase(); }


// हिस्सा 3: नए डिब्बे जोड़ने वाला फंक्शन (100% एरर फ्री)
window.addNewBoxes = function() {
    const grid = document.getElementById('box-grid');
    const totalNow = grid.children.length;
    const n1 = totalNow;
    const n2 = totalNow + 1;

    const newBox1 = `
        <div id="outer-box-${n1}" onclick="goToForm(${n1})" style="border:0.156rem solid #d0e0fc; border-radius:1.25rem; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.875rem 0.625rem; cursor:pointer; position:relative; overflow:hidden; min-height:160px;">
            <div style="width:3.75rem; height:3.75rem; border-radius:50%; background:#ebf3ff; color:#4285f4; display:flex; align-items:center; justify-content:center; font-size:2.1875rem; font-weight:bold; margin-bottom:0.937rem;">+</div>
            <p style="margin:0; font-weight:700; color:#444;">Add Product (Box ${n1 + 1})</p>
        </div>`;
    
    const newBox2 = `
        <div id="outer-box-${n2}" onclick="goToForm(${n2})" style="border:0.156rem solid #d0e0fc; border-radius:1.25rem; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.875rem 0.625rem; cursor:pointer; position:relative; overflow:hidden; min-height:160px;">
            <div style="width:3.75rem; height:3.75rem; border-radius:50%; background:#ebf3ff; color:#4285f4; display:flex; align-items:center; justify-content:center; font-size:2.1875rem; font-weight:bold; margin-bottom:0.937rem;">+</div>
            <p style="margin:0; font-weight:700; color:#444;">Add Product (Box ${n2 + 1})</p>
        </div>`;
    
    grid.insertAdjacentHTML('beforeend', newBox1);
    grid.insertAdjacentHTML('beforeend', newBox2);
    
    const overlay = document.getElementById('product-overlay');
    if (overlay) { overlay.scrollTo({ top: overlay.scrollHeight, behavior: 'smooth' }); }

    if(typeof loadSavedProductsFromDatabase === 'function') { loadSavedProductsFromDatabase(); }
};




// हिस्सा 4: फॉर्म पेज पर डिब्बे का नंबर (box) लेकर जाने वाला नया फंक्शन
function goToForm(boxIndex) {
    window.location.href = 'product.html?box=' + boxIndex;
}


// हिस्सा 5: तारीख भरने वाला फंक्शन
document.addEventListener('DOMContentLoaded', () => {
    const dateSpan = document.getElementById('autoDate');
    if (dateSpan) {
        dateSpan.innerText = new Date().toLocaleDateString('en-IN');
    }
});


// Toggle Status Function - इसे script.js के सबसे नीचे चिपका दें
function toggleStoreStatus() {
    const isChecked = document.getElementById('store-toggle').checked;
    const hText = document.getElementById('status-hindi');
    const eText = document.getElementById('status-english');

    if (isChecked) {
        hText.innerText = "दुकान खुली है";
        hText.style.color = "#2e7d32";
        eText.innerText = "Your store is visible to everyone";
    } else {
        hText.innerText = "दुकान बंद है";
        hText.style.color = "#d32f2f";
        eText.innerText = "Store is hidden from search results";
    }

    const user = firebase.auth().currentUser;
    if (user) {
        firebase.database().ref('stores/' + user.uid).update({
            status: isChecked ? "open" : "closed"
        });
    }
}
// --- CREATE ACCOUNT LOGIC START ---
const accountForm = document.getElementById('accountForm');

if (accountForm) {
    accountForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // डेटा पकड़ना
        const userData = {
            shopName: document.getElementById('shopName').value,
            ownerName: document.getElementById('ownerName').value,
            category: document.getElementById('shopCategory').value,
            phone: document.getElementById('userPhone').value || "None",
            whatsapp: document.getElementById('whatsappPhone').value || "None",
            address: document.getElementById('shopAddress').value
        };

        // लोकल स्टोरेज में सेव करना
        localStorage.setItem('sastaStoreAccount', JSON.stringify(userData));

        // सफलता का मैसेज
        alert("बधाई हो! '" + userData.shopName + "' का रजिस्ट्रेशन हो गया है।");

        // वापस अकाउंट पेज पर भेजना
        window.location.href = 'account.html';
    });
}

// अकाउंट पेज पर नाम अपडेट करने के लिए
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('sastaStoreAccount');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        const shopTitle = document.querySelector('.shop-name');
        if (shopTitle) {
            shopTitle.innerText = user.shopName.toUpperCase();
        }
    }
});
// --- CREATE ACCOUNT LOGIC END ---
// बटन को चालू करने वाला कोड
document.addEventListener('click', function(e) {
    // अगर यूजर ने उस बटन पर क्लिक किया जिसमें 'alt-color' क्लास है
    if (e.target.closest('.alt-color')) {
        window.location.href = 'create-account.html';
    }
});
// यह याद रखने के लिए कि यूजर ने अभी क्या चुना है
let currentSelection = null; 

function toggleIssueList() {
    var list = document.getElementById("my-issue-list");
    list.style.display = (list.style.display === "none" || list.style.display === "") ? "block" : "none";
}

// मुख्य फंक्शन: जो वोट को बढ़ाएगा, घटाएगा या बदलेगा
function handleVote(newId, isIssueLine = false) {
    // 1. अगर यूजर ने वही बटन दोबारा दबाया, तो वोट हटा दो (Cancel)
    if (currentSelection === newId) {
        removeVote(currentSelection);
        currentSelection = null;
        return;
    }

    // 2. अगर यूजर ने पहले से कुछ चुन रखा है, तो पुराना वाला घटाओ
    if (currentSelection !== null) {
        removeVote(currentSelection);
    }

    // 3. अब नया वाला वोट बढ़ाओ
    addVote(newId);
    currentSelection = newId;

    // अगर लिस्ट से चुना है, तो लिस्ट बंद कर दो
    if (isIssueLine) {
        setTimeout(() => { document.getElementById("my-issue-list").style.display = "none"; }, 300);
    }
}

// नंबर बढ़ाने के लिए (Main logic)
function addVote(id) {
    // अगर ID 'i1', 'i2' जैसी है (मतलब Issue List की है)
    if (id.startsWith('i')) {
        let line = document.getElementById(id);
        line.innerText = parseInt(line.innerText) + 1;
        
        let totalIssue = document.getElementById("count-issue");
        totalIssue.innerText = parseInt(totalIssue.innerText) + 1;
    } else {
        // 'count-good' या 'count-best' के लिए
        let el = document.getElementById(id);
        el.innerText = parseInt(el.innerText) + 1;
    }
}

// नंबर घटाने के लिए (Cancel करने के लिए)
function removeVote(id) {
    if (id.startsWith('i')) {
        let line = document.getElementById(id);
        line.innerText = Math.max(0, parseInt(line.innerText) - 1);
        
        let totalIssue = document.getElementById("count-issue");
        totalIssue.innerText = Math.max(0, parseInt(totalIssue.innerText) - 1);
    } else {
        let el = document.getElementById(id);
        el.innerText = Math.max(0, parseInt(el.innerText) - 1);
    }
}
function pardaOn() {
    document.getElementById('safed-parda').style.display = "block";
    
    // लेआउट को अपनी जगह फिक्स रखने के लिए relative किया
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.style.position = "relative"; 
        searchBox.style.zIndex = "10000";
    }
    
    history.pushState({ searchOpen: true }, "");

    const locBar = document.querySelector('.location-bar');
    if (locBar) locBar.style.display = "none";
}

function pardaOff() {
    document.getElementById('safed-parda').style.display = "none";
    
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.style.position = "relative";
    }
    
    const locBar = document.querySelector('.location-bar');
    if (locBar) locBar.style.display = "flex";
}

// 🚀 एंटर (Blue Button) दबाते ही सफ़ेद पर्दा हटाने का जुगाड़
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const inputKhoj = document.getElementById('input-khoj');
        // अगर ग्राहक सर्च बॉक्स के अंदर है और एंटर दबाता है
        if (inputKhoj && document.activeElement === inputKhoj) {
            pardaOff(); // सफेद पर्दा तुरंत बंद
            inputKhoj.blur(); // कीबोर्ड नीचे छुपाओ
            
            // customer.js का सर्च फंक्शन चालू करो
            if (typeof executeFinalSearch === 'function') {
                executeFinalSearch(inputKhoj.value);
            }
        }
    }
});


// 🔍 सजेशन लिस्ट में किसी नाम पर क्लिक करते ही पर्दा हटाने का जुगाड़
document.addEventListener('click', function(e) {
    // अगर क्लिक सजेशन बॉक्स या उसके अंदर के किसी नाम पर हुआ है
    if (e.target.id === 'search-suggestions' || e.target.parentNode.id === 'search-suggestions' || e.target.innerText.includes('🔍')) {
        setTimeout(() => {
            pardaOff(); // सफेद पर्दा हटाओ
            const inputKhoj = document.getElementById('input-khoj');
            if (inputKhoj) inputKhoj.blur(); // कीबोर्ड हटाओ
        }, 150); // छोटा सा टाइमर ताकि नाम पहले इनपुट में चला जाए
    }
});


// लिस्ट आइकन पर क्लिक करते ही सीधे नए पेज पर जाने के लिए
function listKhulegi() {
    window.location.href = "list.html";
}
// मोबाइल का बैक बटन दबते ही यह चलेगा
window.onpopstate = function(event) {
    if (document.getElementById('safed-parda').style.display === "block") {
        // अगर सर्च का परदा खुला है, तो उसे बंद करो, पेज मत बदलो
        document.getElementById('safed-parda').style.display = "none";
        document.getElementById('search-box').style.position = "static";
        
        // ⬇️ नई लाइन: बैक बटन दबाने पर भी लोकेशन बार वापस स्क्रीन पर आ जाएगा
        const locBar = document.querySelector('.location-bar');
        if (locBar) locBar.style.display = "flex";
    }
};

// यह फंक्शन list.html के बटन को कंट्रोल करेगा
function toggleItems(btn) {
    // बटन के ठीक ऊपर वाला div (items-list) ढूँढो
    let container = btn.previousElementSibling; 
    let extra = container.querySelector('#extra-items');
    
    if (extra.style.display === "none" || extra.style.display === "") {
        extra.style.display = "block";
        // बटन का टेक्स्ट बदलें
        btn.innerHTML = 'Hide Items <i class="fa-solid fa-chevron-up"></i>';
    } else {
        extra.style.display = "none";
        // बटन का टेक्स्ट वापस वही करें
        btn.innerHTML = 'View All Items <i class="fa-solid fa-chevron-down"></i>';
    }
}

// ====================================================================
// 🎯 सुधरा हुआ कोड (लाइन 321 से आगे का नया रूप)
// ====================================================================

document.addEventListener('click', function(e) {
    // अगर क्लिक स्टोर कार्ड पर हुआ है (बटन को छोड़कर)
    let card = e.target.closest('.store-card');
    if (card) {
        if (e.target.closest('.map-btn') || e.target.closest('.more-toggle')) {
            return;
        }
        // यहाँ से पुराना सीधा "profile.html" वाला नेविगेशन हटा दिया गया है
        // क्योंकि अब प्रोडक्ट कार्ड का सही नेविगेशन customer.js और profiledata.js हैंडल कर रहे हैं।
    }
});

// ====================================================================
// 🎯 हिस्सा 6: स्मार्ट क्लिक इवेंट्स
// ====================================================================
document.addEventListener('click', function(e) {
    


    // 2. Create Account बटन के लिए
    if (e.target.closest('.alt-color')) {
        window.location.href = 'create-account.html';
        return;
    }
});

// यह फंक्शन अभी सिर्फ टेस्टिंग के लिए है
function handleCreateAccount() {
    // यहाँ Google की लिस्ट खुलेगी
    alert("Google Account List Opening...");
    
    // लॉगिन के बाद ऐसे नाम और फोटो बदलेगा:
    // document.getElementById('user-name').innerText = "Nilesh Kumar";
    // document.getElementById('user-photo').src = "google-photo-link.jpg";
}

// जब सर्च खाली हो तो सब सामान वापस दिखाने के लिए
function rowReset(card) {
    let rows = card.querySelectorAll('.item-row');
    rows.forEach(r => r.style.display = 'flex');
    let extra = card.querySelector('[id^="extra-"]');
    if(extra) extra.style.display = 'none';
    let btn = card.querySelector('.more-toggle');
    if(btn) btn.style.display = 'block';
}

let activeCategory = "All";

function filterCategory(categoryName) {
    activeCategory = categoryName;
    console.log("Selected Category: " + categoryName);
    
    // यहाँ हम उन प्रोडक्ट्स को दिखाएंगे जो इस कैटेगरी के हैं
    let products = document.querySelectorAll('.product-card');
    
    products.forEach(card => {
        // अगर हमने 'Groceries' चुना और कार्ड के अंदर 'groceries' लिखा है
        if(card.innerText.toLowerCase().includes(categoryName.toLowerCase())) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// लाइन 461 से 467 की जगह सिर्फ़ इसे डालें:
const exitBtn = document.querySelector('.exit-btn');
if (exitBtn) {
    exitBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = "singing.html";
        }).catch((error) => {
            console.error("लॉग आउट करने में गड़बड़:", error);
        });
    });
}

const mainSearch = document.getElementById('mainSearch');
const tagContainer = document.getElementById('tag-container');

mainSearch.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
        e.preventDefault(); 
        const value = this.value.trim();
        if (value) {
            addTag(value);
            this.value = ''; 
        }
    }
});

function addTag(text) {
    const tag = document.createElement('span');
    // टैग का डिज़ाइन: हल्का नीला बैकग्राउंड और क्रॉस बटन
    tag.style = "background:#d0e0fc; padding:5px 12px; border-radius:15px; font-size:14px; display:flex; align-items:center; margin-bottom:5px;";
    tag.innerHTML = `${text} <span style="margin-left:8px; cursor:pointer; font-weight:bold;" onclick="this.parentElement.remove()">❌</span>`;
    tagContainer.appendChild(tag);
}

// सर्च फंक्शन: यह उन सभी टैग्स को इकट्ठा करेगा
function startSearch() {
    const tags = Array.from(tagContainer.querySelectorAll('span')).map(t => t.innerText.replace('❌', '').trim());
    alert("ये सामान खोजे जा रहे हैं: " + tags.join(', '));
    // यहाँ अपना पुराना सर्च वाला लॉजिक कॉल कर लो!
}
// एक्स्ट्रा डिटेल्स बॉक्स को खोलने/बंद करने के लिए
function toggleExtraDetails() {
    const box = document.getElementById('extraDetailsBox');
    box.style.display = (box.style.display === "none" || box.style.display === "") ? "block" : "none";
}

// फोटो अपलोड ट्रिगर करने के लिए
function triggerUpload(index) {
    // यहाँ अपना फोटो अपलोड वाला लॉजिक कॉल करो
    console.log("Photo box clicked: " + index);
    // document.getElementById('fileInput').click(); // अगर fileInput पहले से है
}

function toggleSastaDetails() {
    const box = document.getElementById('sasta_details_box');
    const btn = document.getElementById('sasta_toggle_btn');
    
    if (box.style.display === "none" || box.style.display === "") {
        box.style.display = "block";
        btn.innerText = "- Hide Brand, Description & Photos";
    } else {
        box.style.display = "none";
        btn.innerText = "+ View Brand, Description & Photos";
    }
}
// यह कोड script.js के सबसे नीचे चिपका दो
if (typeof triggerProductPhotoUpload === 'undefined') {
    function triggerProductPhotoUpload(photoNum) {
        // यह prodata.js वाले फंक्शन को कॉल करेगा
        window.selectedPhotoIndex = photoNum || null;
        document.getElementById('fileInput').click();
    }
}
// सेटिंग मेनू को खोलने और बंद करने का लॉजिक
function toggleSettingMenu() {
    const dropdown = document.getElementById('setting-dropdown-menu');
    const chevron = document.getElementById('setting-chevron');
    
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        chevron.className = 'fas fa-chevron-up'; // तीर ऊपर घूमेगा
    } else {
        dropdown.style.display = 'none';
        chevron.className = 'fas fa-chevron-down'; // तीर वापस नीचे
    }
}
