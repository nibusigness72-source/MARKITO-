// ==========================================
// 📦 SASTA STORE - PRODUCT MANAGER SYSTEM (FIXED v2)
// ==========================================

let currentSelectedBoxIndex = null;
let currentProductPhotoBase64 = "";

// 1️⃣ डिब्बे खोलना
function openProductForm(boxIndex) {
    currentSelectedBoxIndex = boxIndex;
    currentProductPhotoBase64 = "";
    
    const formPage = document.getElementById('add-product-form-page'); 
    if (formPage) {
        formPage.style.display = 'block'; 
    }
    console.log("फॉर्म खुल गया डिब्बा नंबर: " + boxIndex + " के लिए");
}

// 2️⃣ MAIN PHOTO UPLOAD + COMPRESS (सिर्फ एक बार, cleaned up)
function triggerProductPhotoUpload(photoNum = 'main') {
    window.selectedPhotoIndex = photoNum; 
    
    let fileInput = document.getElementById('productFileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'productFileInput';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    fileInput.click();
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result;
            
            if (photoNum === 'main') {
                // MAIN PHOTO - Compress करेंगे
                const img = new Image();
                img.onerror = function() {
                    console.error("Image load error");
                    alert("फोटो लोड नहीं हो सकी। दोबारा कोशिश करें।");
                };
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const max_width = 500;
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
                    
                    currentProductPhotoBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    
                    // Preview दिखाओ
                    const formPhotoBox = document.getElementById('formPhotoPreview') || document.querySelector('.upload-box');
                    if (formPhotoBox) {
                        formPhotoBox.innerHTML = `
                            <div style="width:120px; height:120px; margin:0 auto; overflow:hidden; border-radius:10px;">
                                <img src="${currentProductPhotoBase64}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Crect fill=%27%23ddd%27 width=%27120%27 height=%27120%27/%3E%3C/svg%3E'">
                            </div>
                            <p style="color:#28a745; font-weight:bold; margin-top:5px;">Photo Loaded! ✅</p>
                        `;
                    }
                    console.log("✅ Main photo compressed और ready!");
                };
                img.src = base64;
            } else {
                // GALLERY PHOTOS (p1 to p10) - No compress, direct save
                console.log("📸 Gallery photo " + photoNum + " upload हो रही है...");
                
                // पहले preview दिखाओ
                const targetBox = document.getElementById('p-box-' + photoNum);
                if (targetBox) {
                    targetBox.innerHTML = `
                        <img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:5px;" 
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2750%27 height=%2750%27%3E%3Crect fill=%27%23ddd%27 width=%2750%27 height=%2750%27/%3E%3C/svg%3E'">
                    `;
                }
                
                // फिर database में save करो
                savePhotoToDatabase(photoNum, base64);
            }
        };
        reader.readAsDataURL(file);
    };
}

// 3️⃣ डेटाबेस में गैलरी फोटो सेव करना (Async properly)
function savePhotoToDatabase(photoNum, base64) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("पहले login करें!");
        return;
    }
    
    const boxId = new URLSearchParams(window.location.search).get('box') || currentSelectedBoxIndex;
    
    if (!boxId) {
        alert("Box ID नहीं मिला!");
        return;
    }
    
    firebase.database()
        .ref('stores/' + user.uid + '/products/box_' + boxId + '/gallery/p' + photoNum)
        .set(base64)
        .then(() => {
            console.log("✅ Photo " + photoNum + " database में save हो गई!");
        })
        .catch((error) => {
            console.error("❌ Photo save error:", error);
            alert("फोटो save नहीं हुई: " + error.message);
        });
}

// 4️⃣ पूरा प्रोडक्ट डेटाबेस में सेव करना
function submitProductToDatabase() {
    const urlParams = new URLSearchParams(window.location.search);
    const boxFromURL = urlParams.get('box');
    if (boxFromURL !== null) { 
        currentSelectedBoxIndex = parseInt(boxFromURL); 
    }

    const user = firebase.auth().currentUser;
    if (!user) { 
        alert("पहले अकाउंट लॉगिन करें!"); 
        return; 
    }
    
    if (currentSelectedBoxIndex === null) { 
        alert("कृपया पहले किसी डिब्बे पर क्लिक करें!"); 
        return; 
    }

    const product_name_value = document.getElementById('pName')?.value.trim() || "";
    const category_value = document.getElementById('pCategory')?.value || "";
    const price_value = document.getElementById('pPrice')?.value.trim() || "";
    const unit_value = document.getElementById('pUnit')?.value.trim() || "";
    const brand_value = document.getElementById('pBrand')?.value.trim() || "";
    const desc_value = document.getElementById('pDesc')?.value.trim() || "";
    
    let stockStatus = "In Stock";
    const stockRadios = document.getElementsByName('stock');
    for(let i = 0; i < stockRadios.length; i++) {
        if(stockRadios[i].checked && stockRadios[i].value === "out") { 
            stockStatus = "Out of Stock"; 
        }
    }

    if (!product_name_value || !price_value || !category_value) {
        alert("कृपया Product Name, Category और Price ज़रूर भरें!");
        return;
    }

    // MAIN PHOTO के साथ सब कुछ save करो
    firebase.database()
        .ref('stores/' + user.uid + '/products/box_' + currentSelectedBoxIndex)
        .update({
            boxIndex: currentSelectedBoxIndex,
            productName: product_name_value,
            category: category_value,
            price: price_value,
            unit: unit_value,
            stockStatus: stockStatus,
            photo: currentProductPhotoBase64 || "no_image.jpg",
            brand: brand_value,
            description: desc_value,
            lastUpdate: new Date().toLocaleDateString('en-IN')
        })
        .then(() => {
            alert("✅ प्रोडक्ट डेटाबेस में सुरक्षित हो गया! 🎉");
            window.location.href = "account.html"; 
        })
        .catch((error) => {
            alert("❌ डेटाबेस एरर: " + error.message);
        });
}

// 5️⃣ डेटाबेस से सभी प्रोडक्ट्स लोड करना (boxes में)
function loadSavedProductsFromDatabase() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase.database()
        .ref('stores/' + user.uid + '/products')
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const allProducts = snapshot.val();
                
                for (let i = 0; i < 100; i++) {
                    const productData = allProducts['box_' + i];
                    const outerBox = document.getElementById('outer-box-' + i);
                    
                    if (productData && outerBox) {
                        outerBox.innerHTML = `
                            <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:space-between; box-sizing:border-box; position:absolute; top:0; left:0; padding:10px;">
                                <img src="${productData.photo}" 
                                     style="width: 100%; height: 95px; object-fit: cover; border-radius: 12px;"
                                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%2795%27%3E%3Crect fill=%27%23e0e0e0%27 width=%27100%27 height=%2795%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 fill=%27%23999%27 font-size=%2714%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3ENo Image%3C/text%3E%3C/svg%3E'">
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
        })
        .catch((error) => {
            console.error("❌ प्रोडक्ट लोड error:", error);
        });
}

// 6️⃣ जब फॉर्म edit के लिए खुले तो पुरानी information load करना
function loadProductFormDataFromDatabase() {
    const urlParams = new URLSearchParams(window.location.search);
    const boxId = urlParams.get('box');
    
    if (boxId === null) return;
    
    currentSelectedBoxIndex = parseInt(boxId);
    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase.database()
        .ref('stores/' + user.uid + '/products/box_' + boxId)
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Form fields fill करो
                if (document.getElementById('pName')) 
                    document.getElementById('pName').value = data.productName || "";
                if (document.getElementById('pCategory')) 
                    document.getElementById('pCategory').value = data.category || "";
                if (document.getElementById('pPrice')) 
                    document.getElementById('pPrice').value = data.price || "";
                if (document.getElementById('pUnit')) 
                    document.getElementById('pUnit').value = data.unit || "";
                if (document.getElementById('pBrand')) 
                    document.getElementById('pBrand').value = data.brand || "";
                if (document.getElementById('pDesc')) 
                    document.getElementById('pDesc').value = data.description || "";

                // Stock status set करो
                const stockRadios = document.getElementsByName('stock');
                if (stockRadios.length > 0 && data.stockStatus) {
                    if (data.stockStatus === "Out of Stock") {
                        stockRadios[1].checked = true;
                    } else {
                        stockRadios[0].checked = true;
                    }
                }
                
                // Main photo preview दिखाओ
                if (data.photo && data.photo !== "no_image.jpg") {
                    currentProductPhotoBase64 = data.photo;
                    const formPhotoBox = document.getElementById('formPhotoPreview');
                    if (formPhotoBox) {
                        formPhotoBox.innerHTML = `
                            <div style="width:120px; height:120px; margin:0 auto; overflow:hidden; border-radius:10px;">
                                <img src="${data.photo}" 
                                     style="width:100%; height:100%; object-fit:cover;"
                                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Crect fill=%27%23ddd%27 width=%27120%27 height=%27120%27/%3E%3C/svg%3E'">
                            </div>
                            <p style="color:#666; font-weight:bold; margin-top:5px;">Tap to change</p>
                        `;
                    }
                }
                
                // Gallery photos load करो
                if (data.gallery) {
                    for (let i = 1; i <= 10; i++) {
                        if (data.gallery['p' + i]) {
                            const galleryBox = document.getElementById('p-box-' + i);
                            if (galleryBox) {
                                galleryBox.innerHTML = `
                                    <img src="${data.gallery['p' + i]}" 
                                         style="width:100%; height:100%; object-fit:cover; border-radius:5px;"
                                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2750%27 height=%2750%27%3E%3Crect fill=%27%23e0e0e0%27 width=%2750%27 height=%2750%27/%3E%3C/svg%3E'">
                                `;
                            }
                        }
                    }
                }
            }
        })
        .catch((error) => {
            console.error("❌ Form data load error:", error);
        });
}

// 7️⃣ डिलीट करना
function deleteProductFromDatabase() {
    const urlParams = new URLSearchParams(window.location.search);
    const boxFromURL = urlParams.get('box');
    if (boxFromURL !== null) {
        currentSelectedBoxIndex = parseInt(boxFromURL);
    }

    if (currentSelectedBoxIndex === null) {
        alert("कृपया पहले किसी एक प्रोडक्ट पर क्लिक करें!");
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) return;

    if (confirm("क्या आप इस प्रोडक्ट को डिलीट करना चाहते हैं?")) {
        firebase.database()
            .ref('stores/' + user.uid + '/products/box_' + currentSelectedBoxIndex)
            .remove()
            .then(() => {
                alert("✅ प्रोडक्ट डिलीट हो गया! 🗑️");
                window.location.href = "account.html"; 
            })
            .catch((error) => {
                alert("❌ डिलीट error: " + error.message);
            });
    }
}

// 8️⃣ Firebase listener + Auto-load on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log("✅ यूज़र logged in, डेटा लोड हो रहा है...");
                loadSavedProductsFromDatabase();
                
                // अगर URL में box है तो form data भी load करो
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('box') !== null) {
                    loadProductFormDataFromDatabase();
                }
            }
        });
    }
});

// 9️⃣ Utility: Product को save करने वाला wrapper
function saveProductToDatabase() {
    submitProductToDatabase();
}
