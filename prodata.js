// ==========================================
// 📦 SASTA STORE - PRODUCT MANAGER SYSTEM (FIXED)
// ==========================================

// ग्लोबल वेरिएबल्स (डेटा को रैम में होल्ड करने के लिए)
let currentSelectedBoxIndex = null; // कौन सा डिब्बा क्लिक हुआ है
let currentProductPhotoBase64 = ""; // फॉर्म की फोटो का कंप्रेस्ड डेटा

// 1️⃣ ६ डिब्बों में से किसी डिब्बे पर क्लिक करने पर फॉर्म खोलने का लॉजिक
function openProductForm(boxIndex) {
    currentSelectedBoxIndex = boxIndex; // डिब्बे का नंबर (0 से 5) याद रखो
    currentProductPhotoBase64 = ""; // पुराना फोटो डेटा साफ़ करें
    
    // 💡 यहाँ अपने HTML फॉर्म वाले पेज या पॉपअप को चालू (Show) करें
    const formPage = document.getElementById('add-product-form-page'); 
    if (formPage) {
        formPage.style.display = 'block'; 
    }
    console.log("फॉर्म खुल गया डिब्बा नंबर: " + boxIndex + " के लिए");
}

// 2️⃣ फॉर्म के अंदर फोटो डिब्बे पर क्लिक करने पर गैलरी खोलना और कंप्रेस करना
function triggerProductPhotoUpload() {
    // एक छुपा हुआ इनपुट बनाना ताकि गैलरी खुले
    let hiddenInput = document.getElementById('fileInput'); // product.html में id='fileInput' है
    if (!hiddenInput) {
        hiddenInput = document.getElementById('productFileInput');
    }
    if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.id = 'productFileInput';
        hiddenInput.accept = 'image/*';
        hiddenInput.style.display = 'none';
        document.body.appendChild(hiddenInput);
    }
    
    hiddenInput.click(); // गैलरी ट्रिगर
    
    hiddenInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const max_width = 500; // साइज़ छोटा रखने के लिए
                let width = img.width;
                let height = img.height;
                
                if (width > max_width) {
                    height = Math.round((height * max_width) / width);
                    width = max_width;
                }
                canvas.width = width;
                canvas.height = height;
                
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // ६०% क्वालिटी पर कंप्रेस (KB में करने के लिए)
                currentProductPhotoBase64 = canvas.toDataURL('image/jpeg', 0.6);
                
// फॉर्म के अंदर वाले डिब्बे में फोटो तुरंत दिखाओ (साइज फिक्स कर दिया ताकि इनपुट नीचे न भागे)
const formPhotoBox = document.getElementById('formPhotoPreview') || document.querySelector('.upload-box') || document.querySelector('.upload-section');
if (formPhotoBox) {
    formPhotoBox.innerHTML = `
        <div class="upload-box" style="border:none; padding:0; width:120px; height:120px; margin:0 auto; overflow:hidden; display:flex; align-items:center; justify-content:center;">
            <img src="${currentProductPhotoBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
        </div>
        <p class="hint" style="color:#28a745; font-weight:bold; margin-top:5px;">Photo Loaded! ✅</p>
    `;
}

                console.log("प्रोडक्ट फोटो फॉर्म में लोड हो गई! ✅");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
}

// 3️⃣ 'ADD PRODUCT' बटन दबाने पर पूरा डेटा एक साथ डेटाबेस में भेजना
function submitProductToDatabase() {
    const urlParams = new URLSearchParams(window.location.search);
    const boxFromURL = urlParams.get('box');
    if (boxFromURL !== null) { currentSelectedBoxIndex = parseInt(boxFromURL); }

    const user = firebase.auth().currentUser;
    if (!user) { alert("प्रोडक्ट जोड़ने के लिए पहले अकाउंट लॉगिन करें!"); return; }
    if (currentSelectedBoxIndex === null) { alert("कृपया पहले किसी डिब्बे पर क्लिक करें!"); return; }

    const product_name_value = document.getElementById('pName')?.value.trim() || "";
    const category_value = document.getElementById('pCategory')?.value || "";
    const price_value = document.getElementById('pPrice')?.value.trim() || "";
    const unit_value = document.getElementById('pUnit')?.value.trim() || "";
    const brand_value = document.getElementById('pBrand')?.value.trim() || "";
    const desc_value = document.getElementById('pDesc')?.value.trim() || "";
    
    let stockStatus = "In Stock";
    const stockRadios = document.getElementsByName('stock');
    if (stockRadios) {
        for(let i = 0; i < stockRadios.length; i++) {
            if(stockRadios[i].checked && stockRadios[i].value === "out") { stockStatus = "Out of Stock"; }
        }
    }

    if (!product_name_value || !price_value || !category_value) {
        alert("कृपया Product Name, Category और Price ज़रूर भरें!");
        return;
    }

    // 🌟 अब देखो, यहाँ ब्रैकेट के अंदर सब कुछ सही क्रम में है:
    firebase.database().ref('stores/' + user.uid + '/products/box_' + currentSelectedBoxIndex).update({
        boxIndex: currentSelectedBoxIndex,
        productName: product_name_value,
        category: category_value,
        price: price_value,
        unit: unit_value,
        stockStatus: stockStatus,
        photo: currentProductPhotoBase64 || "no_image.jpg",
        lastUpdate: new Date().toLocaleDateString('en-IN'),
        brand: brand_value,
        description: desc_value
    })
    .then(() => {
        alert("प्रोडक्ट डेटाबेस में सुरक्षित हो गया! 🎉");
        window.location.href = "account.html"; 
    })
    .catch((error) => {
        alert("डेटाबेस एरर: " + error.message);
    });
}


// 4️⃣ लॉगिन होने पर या नया प्रोडक्ट सेव होने पर डेटाबेस से ६ डिब्बों में फोटो सजाना
function loadSavedProductsFromDatabase() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase.database().ref('stores/' + user.uid + '/products').once('value')
    .then((snapshot) => {
        if (snapshot.exists()) {
            const allProducts = snapshot.val();
            
            // लूप चलाकर सभी डिब्बों (0 से 100 तक) में सामान सेट करना
            for (let i = 0; i < 100; i++) {
                const productData = allProducts['box_' + i];
                const outerBox = document.getElementById('outer-box-' + i);
                
                if (productData && outerBox) {
                    outerBox.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:space-between; box-sizing:border-box; position:absolute; top:0; left:0; padding:10px;">
                            <img src="${productData.photo}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 12px;">
                            <p style="margin:4px 0 0 0; font-size:0.85rem; font-weight:bold; text-align:center; color:#333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${productData.productName}</p>
                            <p style="margin:2px 0 0 0; font-size:0.8rem; color:#4285f4; font-weight:bold;">₹${productData.price} / ${productData.unit || 'पीसी'}</p>
                            <span style="position:absolute; top:12px; right:12px; background:${productData.stockStatus === 'In Stock' ? '#2e7d32' : '#d32f2f'}; color:white; font-size:0.65rem; padding:2px 6px; border-radius:6px; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                                ${productData.stockStatus === 'In Stock' ? 'In' : 'Out'}
                            </span>
                        </div>
                    `;
                }
            }
        }
    }).catch((error) => {  // <--- यहाँ ब्रैकेट और .catch को ऐसे आपस में जोड़ दिया
        console.error("प्रोडक्ट लोड करने में एरर:", error);
    });
}


// 5️⃣ फायरबेस का पहरेदार + फॉर्म में पुराना डेटा लोड करने का सिस्टम
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log("यूज़र एक्टिव है, डिब्बों का बैकअप लोड हो रहा है...");
                loadSavedProductsFromDatabase();

                // URL से बॉक्स का नंबर निकालना
                const urlParams = new URLSearchParams(window.location.search);
                const boxId = urlParams.get('box');
                if (boxId !== null) {
                    currentSelectedBoxIndex = parseInt(boxId);
                    
                    // अगर डेटाबेस में पुराना सामान है, तो फॉर्म के खानों में ऑटोमैटिक भर दो
                    firebase.database().ref('stores/' + user.uid + '/products/box_' + boxId).once('value')
                    .then((snapshot) => {
                      if (snapshot.exists()) {
    const data = snapshot.val();
    if(document.getElementById('pName')) document.getElementById('pName').value = data.productName || "";
    if(document.getElementById('pCategory')) document.getElementById('pCategory').value = data.category || "";
    if(document.getElementById('pPrice')) document.getElementById('pPrice').value = data.price || "";
    if(document.getElementById('pUnit')) document.getElementById('pUnit').value = data.unit || "";
    // डेटाबेस से डेटा उठाकर फॉर्म में वापस भर देगा
if (data.brand) document.getElementById('pBrand').value = data.brand;
if (data.description) document.getElementById('pDesc').value = data.description;

    
    // 🚀 नीलेश भाई का स्टॉक लोड फिक्स: पुराना स्टेटस देखकर सही बटन टिक करेगा
    const stockRadios = document.getElementsByName('stock');
    if (stockRadios.length > 0 && data.stockStatus) {
        if (data.stockStatus === "Out of Stock") {
            stockRadios[1].checked = true; // Out stock वाले पर टिक करो
        } else {
            stockRadios[0].checked = true; // In stock वाले पर टिक करो
        }
    }
    
    // पुरानी फोटो को फॉर्म के अंदर तुरंत दिखाना (साइज फिक्स के साथ)

const formPhotoBox = document.getElementById('formPhotoPreview') || document.querySelector('.upload-box') || document.querySelector('.upload-section');
if (formPhotoBox && data.photo && data.photo !== "no_image.jpg") {
    currentProductPhotoBase64 = data.photo;
    formPhotoBox.innerHTML = `
        <div class="upload-box" style="border:none; padding:0; width:120px; height:120px; margin:0 auto; overflow:hidden; display:flex; align-items:center; justify-content:center;">
            <img src="${data.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
        </div>
        <p class="hint" style="color:#28a745; font-weight:bold; margin-top:5px;">Tap to change photo</p>
    `;
}

                        }
                    });
                }
            }
        });
    }
});
// 6️⃣ उत्पाद को डेटाबेस से पूरी तरह डिलीट करने वाला फंक्शन
function deleteProductFromDatabase() {
    // अगर वेरिएबल में नंबर न हो, तो दोबारा URL से कन्फर्म करो
    const urlParams = new URLSearchParams(window.location.search);
    const boxFromURL = urlParams.get('box');
    if (boxFromURL !== null) {
        currentSelectedBoxIndex = parseInt(boxFromURL);
    }

    if (currentSelectedBoxIndex === null) {
        alert("कृपया पहले किसी एक उत्पाद पर क्लिक करें!");
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) return;

    if (confirm("क्या आप इस प्रोडक्ट को सच में डिलीट करना चाहते हैं?")) {
        firebase.database().ref('stores/' + user.uid + '/products/box_' + currentSelectedBoxIndex).remove()
        .then(() => {
            alert("सस्ता स्टोर: प्रोडक्ट पूरी तरह डिलीट हो गया है! 🗑️");
            window.location.href = "account.html"; 
        })
        .catch((error) => {
            alert("डिलीट करने में एरर: " + error.message);
        });
    }
}

// प्रीडाटा.जेएस के एकदम नीचे यह छोटा सा कोड डालो:
function saveProductToDatabase() {
    submitProductToDatabase();
}


// ✅ यह फंक्शन ब्रांड और डिस्क्रिप्शन को डेटाबेस में सेव करने का काम करेगा
function saveExtraDetailsToDatabase(boxIndex) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // फॉर्म से वैल्यू उठाओ
    const brandValue = document.getElementById('pBrand')?.value || "";
    const descValue = document.getElementById('pDesc')?.value || "";

    // फायरबेस में उसी बॉक्स के अंदर इसे अपडेट कर दो
    firebase.database().ref('stores/' + user.uid + '/products/box_' + boxIndex).update({
        brand: brandValue,
        description: descValue
    }).then(() => {
        console.log("Extra details saved successfully!");
    }).catch((error) => {
        console.error("Error saving details:", error);
    });
}
// यह नया फोटो अपलोडर फंक्शन है
// मेन फोटो अपलोडर
function triggerProductPhotoUpload(photoNum) {
    window.selectedPhotoIndex = photoNum; 
    
    // 1. सबसे पहले इनपुट को ढूंढो या बनाओ (ताकि लॉगिन के बाद भी मौजूद रहे)
    let fileInput = document.getElementById('fileInput');
    
    // 2. अगर इनपुट नहीं मिल रहा, तो उसे फोर्सफुली बनाओ
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'fileInput';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }

    // 3. गैलरी खोलने के लिए क्लिक करो
    fileInput.click();

    // 4. लॉगिन के बाद भी कनेक्शन बना रहे इसके लिए onchange को सेट करो
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result;
            
            // UI में फोटो दिखाओ
            const targetBox = document.getElementById('p-box-' + window.selectedPhotoIndex);
            if (targetBox) {
                targetBox.innerHTML = `<img src="${base64}" style="width:100%; height:40px; object-fit:cover;">`;
            }
            
            // डेटाबेस में फोटो सेव करो
            savePhotoToDatabase(window.selectedPhotoIndex, base64);
        };
        reader.readAsDataURL(file);
    };
}

// डेटाबेस में फोटो सेव करने का फंक्शन
function savePhotoToDatabase(photoNum, base64) {
    const user = firebase.auth().currentUser;
    const boxId = new URLSearchParams(window.location.search).get('box');
    
    firebase.database().ref('stores/' + user.uid + '/products/box_' + boxId + '/photos/p' + photoNum).set(base64)
    .then(() => { console.log("Photo " + photoNum + " saved!"); });
}

// .then((snapshot) => { ... }) के अंदर, जहाँ तुम नाम और प्राइस लोड कर रहे हो:
firebase.database().ref('stores/' + user.uid + '/products/box_' + boxId + '/photos').once('value')
.then((snapshot) => {
    if (snapshot.exists()) {
        const photos = snapshot.val();
        for (let i = 1; i <= 10; i++) {
            if (photos['p' + i]) {
                document.getElementById('p-box-' + i).innerHTML = 
                    `<img src="${photos['p' + i]}" style="width:100%; height:40px; object-fit:cover;">`;
            }
        }
    }
});
