// आपका असली फायरबेस कॉन्फ़िगरेशन (v8 स्टाइल में)
const firebaseConfig = {
    apiKey: "AIzaSyDhSc-5KTxLBo0pPEM2Zs5hJGFlXDH44Ao",
    authDomain: "sasta-store-4d565.firebaseapp.com",
    databaseURL: "https://sasta-store-4d565-default-rtdb.firebaseio.com", 
    projectId: "sasta-store-4d565",
    storageBucket: "sasta-store-4d565.firebasestorage.app",
    messagingSenderId: "976421760453",
    appId: "1:976421760453:web:ae62a07f3fbf2392242fac"
};

// फायरबेस शुरू करें (यदि पहले से नहीं हुआ है)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// शॉर्टकट वेरिएबल्स
const auth = firebase.auth();
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

let shopLatitude = null;
let shopLongitude = null;
let uploadedPhotoURLs = []; 

// लोकेशन सेट करने और बॉक्स में भरने का नया फ़ंक्शन
function setShopLocation(buttonElement) {
    if (navigator.geolocation) {
        // बटन पर लोडिंग टेक्स्ट दिखाना
        if (buttonElement && typeof buttonElement === 'object') {
            buttonElement.innerHTML = 'Getting location...';
        }
        
        navigator.geolocation.getCurrentPosition((position) => {
            shopLatitude = position.coords.latitude;
            shopLongitude = position.coords.longitude;
            
            // 1. ऊपर वाले एड्रेस बॉक्स (shopAddress) में exact वही लोकेशन टेक्स्ट भरना
            const addressInput = document.getElementById('shopAddress');
            if (addressInput) {
                addressInput.value = `📍 Lat: ${shopLatitude.toFixed(6)}, Lng: ${shopLongitude.toFixed(6)}`;
            }
            
            // 2. ऑटोमैटिक तारीख और समय सेट करना (अगर पेज पर autoDate नाम की जगह हो)
            const now = new Date();
            const currentDateTime = now.toLocaleDateString('en-IN') + ' | ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            const dateSpan = document.getElementById('autoDate');
            if (dateSpan) {
                dateSpan.innerText = currentDateTime;
            }

            // बटन को हरा और सफल दिखाना
            if (buttonElement && typeof buttonElement === 'object') {
                buttonElement.innerHTML = 'Location Set हो गई! ✅';
                buttonElement.style.backgroundColor = '#2e7d32';
                buttonElement.style.color = '#ffffff';
            } else {
                alert("Shop location saved successfully.");
            }
        }, (error) => {
            console.error("GPS एरर आया:", error);
            alert("लोकेशन निकालने में दिक़्क़त हुई, कृपया मोबाइल का GPS ऑन करें।");
            if (buttonElement && typeof buttonElement === 'object') {
                buttonElement.innerHTML = 'Shop Location Set';
            }
        }, {
            enableHighAccuracy: true,
            timeout: 10000
        });
    } else {
        alert("आपका मोबाइल लोकेशन सपोर्ट नहीं करता है।");
    }
}


// डेटा सेव करने का मुख्य फ़ंक्शन
function saveShopRegistration() {
    // 1. वर्तमान में लॉग इन यूज़र की डिटेल्स निकालना
    const user = firebase.auth().currentUser;
    
    if (!user) {
        alert("Please sign in with Google to save your account details.");
        console.log("लॉगिन एरर: कोई यूजर लॉग इन नहीं है।");
        return;
    }

    // 2. आपके HTML इनपुट्स की ID से डेटा निकालना
    const shopNameEl = document.getElementById('shopName');
    const ownerNameEl = document.getElementById('ownerName');
    const mobileNumberEl = document.getElementById('userPhone');
    const whatsappNumberEl = document.getElementById('whatsappPhone');
    const shopAddressEl = document.getElementById('shopAddress');
    const openTimeEl = document.getElementById('openTime');
    const closeTimeEl = document.getElementById('closeTime');

    // वैल्यूज निकालना (सुरक्षित तरीके से)
    const shopName = shopNameEl ? shopNameEl.value.trim() : "";
    const ownerName = ownerNameEl ? ownerNameEl.value.trim() : "";
    const mobileNumber = mobileNumberEl ? mobileNumberEl.value.trim() : "";
    const whatsappNumber = whatsappNumberEl ? whatsappNumberEl.value.trim() : "";
    const shopAddress = shopAddressEl ? shopAddressEl.value.trim() : "";
    const openTime = openTimeEl ? openTimeEl.value : "09:00";
    const closeTime = closeTimeEl ? closeTimeEl.value : "21:00";

    console.log("इकट्ठा किया गया डेटा:", { shopName, ownerName, mobileNumber, shopAddress, openTime, closeTime });

    // अनिवार्य फ़ील्ड्स चेक करना
    if (!shopName || !ownerName || !shopAddress) {
        alert("Please enter shop name, owner name and shop address.");
        return;
    }

    console.log("Saving data to Firebase...");

    // 3. फायरबेस रियलटाइम डेटाबेस में डेटा सेव करना
    firebase.database().ref('stores/' + user.uid).set({
        userUID: user.uid,
        userEmail: user.email,
        shopName: shopName,
        ownerName: ownerName,
        mobileNumber: mobileNumber,
        whatsappNumber: whatsappNumber,
        shopAddress: shopAddress,
        location: {
            latitude: shopLatitude,
            longitude: shopLongitude
        },
        timing: {
            open: openTime,
            close: closeTime
        },
        photos: uploadedPhotoURLs.length > 0 ? uploadedPhotoURLs : ["rasgulla.jpg", "Chana.jpg"]
    })
    .then(() => {
        alert("Shop account created successfully.");
        window.location.href = "account.html"; 
    })
    .catch((error) => {
        console.error("फायरबेस राइट एरर:", error);
        alert("Unable to save data. Please try again.");
    });
}

// --- पुराना document.addEventListener('click'...) हटाकर इसे डालें ---
document.addEventListener('click', function(e) {
    // हम केवल तभी कोड चलाएंगे जब यूजर ने असली सबमिट बटन (SAVE) पर ही क्लिक किया हो
    if (e.target && e.target.tagName === 'BUTTON' && e.target.textContent.trim() === 'SAVE') {
        e.preventDefault(); // फॉर्म को डिफ़ॉल्ट रीलोड होने से रोकें
        console.log("परफेक्ट क्लिक: केवल SAVE बटन पर क्लिक हुआ! प्रोसेसिंग शुरू...");
        saveShopRegistration(); // डेटा सेव करने वाला फंक्शन चलाएं
    }
});


// --- लॉगिन होने पर पुराना डेटा ऑटोमैटिक फॉर्म में लोड करने के लिए कोड (फोटो लोड फिक्स के साथ) ---
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("यूज़र लॉग इन है, डेटाबेस से पुरानी जानकारी चेक की जा रही है...");
        
        // डेटाबेस के 'stores/user.uid' पाथ से डेटा पढ़ना
        firebase.database().ref('stores/' + user.uid).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const storeData = snapshot.val();
                console.log("पुरानी जानकारी मिल गई:", storeData);

                // अगर एचटीएमएल एलिमेंट्स स्क्रीन पर मौजूद हैं, तो उनमें वैल्यू भरें
                if(document.getElementById('shopName')) document.getElementById('shopName').value = storeData.shopName || "";
                if(document.getElementById('ownerName')) document.getElementById('ownerName').value = storeData.ownerName || "";
                if(document.getElementById('userPhone')) document.getElementById('userPhone').value = storeData.mobileNumber || "";
                if(document.getElementById('whatsappPhone')) document.getElementById('whatsappPhone').value = storeData.whatsappNumber || "";
                if(document.getElementById('shopAddress')) document.getElementById('shopAddress').value = storeData.shopAddress || "";
                if(document.getElementById('openTime')) document.getElementById('openTime').value = storeData.timing?.open || "09:00";
                if(document.getElementById('closeTime')) document.getElementById('closeTime').value = storeData.timing?.close || "21:00";
                
                // लोकेशन्स और फोटोज़ को भी वेरिएबल्स में सेट कर लें
                shopLatitude = storeData.location?.latitude || null;
                shopLongitude = storeData.location?.longitude || null;
                uploadedPhotoURLs = storeData.photos || [];

                // ⬇️ नई लाइनें: डेटाबेस से आई पुरानी फोटोज़ को उन 4 डिब्बों में दिखाना
                const boxes = document.querySelectorAll('.photo-box');
                if (boxes && boxes.length > 0 && uploadedPhotoURLs.length > 0) {
                    uploadedPhotoURLs.forEach((photo, index) => {
                        // चेक करें कि डिब्बा मौजूद है और उसमें डेटाबेस वाली सही फ़ोटो है
                        if (boxes[index] && photo && !photo.includes('.jpg')) {
                            boxes[index].innerHTML = `<img src="${photo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px; display: block;">`;
                        }
                    });
                }
            } else {
                console.log("इस यूज़र का पहले से कोई रजिस्ट्रेशन नहीं है। नया फ़ॉर्म भरें।");
            }
        })
        .catch((error) => {
            console.error("डेटा लोड करने में एरर:", error);
        });
    } else {
        console.log("कोई यूज़र लॉग इन है।");
    }
});


// --- होम पेज पर 'on/off' बटन से असली GPS ट्रिगर करने और ब्लर हटाने का फाइनल कोड ---

function homePageGPSActivate(btnElement) {
    if (navigator.geolocation) {
        console.log("होम पेज पर असली GPS ट्रिगर हो रहा है...");
        
        // बटन का टेक्स्ट बदलकर लोडिंग दिखाना
        if (btnElement) {
            btnElement.textContent = "...";
        }

        // मोबाइल का असली GPS ऑन करने की रिक्वेस्ट
        navigator.geolocation.getCurrentPosition((position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            console.log("यूज़र ने GPS ऑन कर दिया! लोकेशन मिल गई:", userLat, userLng);

            // 1. बटन का टेक्स्ट 'on' कर देना
            if (btnElement) {
                btnElement.textContent = "on";
                btnElement.style.backgroundColor = "#2e7d32"; // बटन को हरा कर देना
            }

            // 2. पूरे पेज से ब्लर (Blur) हटाना और लाल लोकेशन बॉक्स गायब करना
            // हम सीधे उन क्लासेस को टारगेट कर रहे हैं जो आपने स्क्रीनशॉट में दिखाई थीं
            const blurOverlay = document.querySelector('.blur-container') || document.querySelector('.overlay') || document.querySelector('.location-off-box');
            if (blurOverlay) {
                blurOverlay.style.display = 'none'; // लाल बॉक्स और धुंधलापन गायब
            }

            // अगर आपने पूरे बॉडी या कंटेनर पर फ़िल्टर लगाया है तो उसे साफ़ करना
            const mainApp = document.querySelector('body');
            if (mainApp) {
                mainApp.style.filter = 'none';
            }

            console.log("होम पेज एकदम चकाचक खुल गया भाई! ✅");

        }, (error) => {
            console.error("GPS एरर आया:", error);
            alert("Please turn on GPS and try again.");
            
            // अगर एरर आए तो बटन को वापस पहले जैसा कर दें
            if (btnElement) {
                btnElement.textContent = "off";
                btnElement.style.backgroundColor = ""; 
            }
        }, {
            enableHighAccuracy: true, // एकदम सटीक रियल लोकेशन के लिए
            timeout: 10000
        });
    } else {
        alert("Location services are not supported on this device.");
    }
}

// --- पूरे होम पेज पर क्लिक को ट्रैक करने का लिसनर ---
document.addEventListener('click', function(e) {
    // अगर यूज़र ने आपके .change-btn (on/off वाले बटन) पर क्लिक किया है
    if (e.target && e.target.classList.contains('change-btn')) {
        e.preventDefault();
        console.log("होम पेज का ऑन-ऑफ बटन दबाया गया!");
        homePageGPSActivate(e.target); // फ़ंक्शन चालू करें और बटन का एलिमेंट भेजें
    }

    // क्रिएट अकाउंट वाले पेज का पुराना 'Shop Location Set' बटन लॉजिक (सुरक्षित रखने के लिए)
    const locBtn = e.target.closest('.location-btn') || (e.target.textContent && e.target.textContent.includes('Shop Location Set'));
    if (locBtn && typeof locBtn === 'object') {
        e.preventDefault();
        const actualButton = document.querySelector('.location-btn') || locBtn;
        if (typeof setShopLocation === 'function') {
            setShopLocation(actualButton);
        }
    }

    // क्रिएट अकाउंट का SAVE बटन लॉजिक
    if (e.target && e.target.tagName === 'BUTTON' && e.target.textContent.trim() === 'SAVE') {
        e.preventDefault();
        if (typeof saveShopRegistration === 'function') {
            saveShopRegistration();
        }
    }
});

// --- हिस्सा १: फ़ोटो को छोटा (Compress) करने और रैम स्टाइल में रखने का फ़ंक्शन ---
function handlePhotoSelection(event) {
    const files = event.target.files;
    
    if (files.length > 4) {
        alert("You can upload up to 4 photos only.");
        event.target.value = ""; 
        uploadedPhotoURLs = [];
        return;
    }

    uploadedPhotoURLs = []; // पुराना डेटा साफ़ करें
    console.log("फ़ोटो को छोटा करने का काम शुरू...");

    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // फ़ोटो की चौड़ाई ६०० पिक्सेल की जगह अब ६०rem के हिसाब से सेट होगी
                const max_width = 600; 
                let width = img.width;
                let height = img.height;
                
                if (width > max_width) {
                    height = Math.round((height * max_width) / width);
                    width = max_width;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // क्वालिटी को सिर्फ ६०% रखकर साइज़ एकदम छोटा (KB में) करना
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                uploadedPhotoURLs.push(compressedBase64);
                console.log(`फ़ोटो ${i + 1} छोटी होकर डेटाबेस के लिए तैयार है! ✅`);
            };
        };
        reader.readAsDataURL(files[i]);
    }
}

// --- पुरानी फ़ोटो को स्क्रीन पर दिखाने का असली कोड ---
const previewContainer = document.getElementById('photoPreviewContainer');
if (previewContainer) {
    previewContainer.innerHTML = ""; 
    
    if (uploadedPhotoURLs && uploadedPhotoURLs.length > 0) {
        uploadedPhotoURLs.forEach((photoData) => {
            if (photoData && !photoData.includes('.jpg')) {
                const imgTag = document.createElement('img');
                imgTag.src = photoData;
                imgTag.style.width = "4.375rem"; 
                imgTag.style.height = "4.375rem";
                imgTag.style.objectFit = "cover";
                imgTag.style.marginRight = "0.5rem";
                imgTag.style.borderRadius = "0.25rem";
                imgTag.style.border = "0.0625rem solid #ccc";
                previewContainer.appendChild(imgTag);
            }
        });
    }
}


// --- हिस्सा २: फ़ोटो इनपुट बदलते ही कोड चालू करना ---
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'shopPhotos') {
        handlePhotoSelection(e);
    }
});
// --- पुराने डिब्बों पर क्लिक करने और फोटो दिखाने का फाइनल फिक्स ---
document.addEventListener('click', function(e) {
    const photoBox = e.target.closest('.photo-box');
    if (photoBox) {
        const fileInput = document.getElementById('shopPhotos');
        if (fileInput) fileInput.click(); // गैलरी खुल जाएगी
    }
});

// जब यूजर गैलरी से फोटो चुन लेगा
function handlePhotoSelection(event) {
    const files = event.target.files;
    const boxes = document.querySelectorAll('.photo-box');
    
    if (!files || files.length === 0) return;

    // जितने फोटो चुने हैं, उन पर एक-एक करके काम करेंगे
    for (let i = 0; i < files.length; i++) {
        
        // चेक करो कि कुल 4 फोटो से ज़्यादा न होने पाएँ
        if (uploadedPhotoURLs.length >= 4) {
            alert("You can upload up to 4 photos only.");
            break;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            
            // ब्लैक स्क्रीन से बचने के लिए इमेज को पूरी तरह लोड होने का इंतजार करेंगे
            img.onload = function() {
                setTimeout(function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const max_width = 600;
                    let width = img.width;
                    let height = img.height;
                    
                    // अगर फोटो की चौड़ाई-लंबाई 0 आ रही है, तो डिफ़ॉल्ट सेट कर देंगे ताकि ब्लैक न हो
                    if (width === 0 || height === 0) {
                        width = 600;
                        height = 450;
                    } else if (width > max_width) {
                        height = Math.round((height * max_width) / width);
                        width = max_width;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // बैकग्राउंड को सफेद सेट कर रहे हैं ताकि ब्लैक स्क्रीन का चांस ही खत्म हो जाए
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    
                    // फ़ोटो को आपकी पुरानी लिस्ट में जोड़ेंगे
                    uploadedPhotoURLs.push(compressedBase64);
                    
                    // अब जो सबसे पहला खाली डिब्बा है, उसमें फ़ोटो दिखाओ
                    for (let j = 0; j < boxes.length; j++) {
                        if (!boxes[j].querySelector('img')) {
                            boxes[j].innerHTML = `<img src="${compressedBase64}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px; display: block;">`;
                            break; 
                        }
                    }
                }, 100); // 100 मिलीसेकंड का छोटा सा गैप ताकि बड़ी फोटो पूरी खुल जाए
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(files[i]);
    }
    
    // इनपुट खाली करो ताकि अगला फोटो चुन सकें
    event.target.value = ""; 
}

// फोटो बदलते ही फंक्शन एक्टिव करना
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'shopPhotos') {
        handlePhotoSelection(e);
    }
});
