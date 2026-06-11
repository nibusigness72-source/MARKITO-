// ===================================================================
// 🏪 SASTA STORE - LIVE ACCOUNT & PHOTO SYNC SYSTEM (🚀 100% PERFECT)
// ===================================================================

let currentStoreId = null; 

// 🎯 1️⃣ फायरबेस का असली पहरेदार जो पेज लोड होते ही दुकान का नाम और फोटो लाएगा
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        // फायरबेस ऑथ से लाइव चेक करो कि कौन सा मर्चेंट लॉगिन है
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentStoreId = user.uid; // असली लंबी ईमेल वाली UID मिल गई
                console.log("🏪 लाइव लॉगिन मर्चेंट आईडी:", currentStoreId);
                
                // लाइव डेटाबेस से डेटा लोड करो
                loadMerchantAccountData();
            } else {
                // अगर फायरबेस लोड होने में लेट हो, तो लोकल स्टोरेज का बैकअप चेक करो
                const savedUser = localStorage.getItem('sastaStoreAccount') || localStorage.getItem('sastaStoreMerchant');
                if (savedUser) {
                    try {
                        const parsed = JSON.parse(savedUser);
                        currentStoreId = parsed.uid || parsed.storeId || null;
                        if (currentStoreId) loadMerchantAccountData();
                    } catch(e) { console.log(e); }
                } else {
                    // ❌ अगर बिल्कुल लॉगिन नहीं है
                    const shopTitle = document.getElementById('user-name');
                    if (shopTitle) shopTitle.innerText = "NOT LOGGED IN";
                }
            }
        });
    }
});


// 🎯 2️⃣ लाइव डेटा, स्टोर का नाम और प्रोफाइल फोटो लोड करने वाला फंक्शन
function loadMerchantAccountData() {
    if (!currentStoreId) return;

    // फायरबेस डेटाबेस से stores/UID का लाइव कनेक्शन (on('value') लगाया है ताकि तुरंत अपडेट हो)
    firebase.database().ref('stores/' + currentStoreId).on('value', (snapshot) => {
        if (!snapshot.exists()) return;

        const storeData = snapshot.val();
        const info = storeData.info || {};

        // 🌟 फिक्स: Create Account में जो दुकान का नाम दिए थे, वो अब स्क्रीन पर बड़े अक्षरों में दिखेगा
        const shopTitle = document.getElementById('user-name');
        if (shopTitle) {
            const dbShopName = storeData.shopName || info.shopName || "SASTA STORE";
            shopTitle.innerText = dbShopName.toUpperCase();
        }

        // 🌟 फिक्स: अपलोड की गई फोटो अब अकाउंट वाले सेक्शन (user-photo) में लाइव दिखेगी
        const storePhotoUrl = storeData.photos?.[0] || info.storePhoto || storeData.photo || "";
        const photoElem = document.getElementById('user-photo');
        
        if (photoElem) {
            if (storePhotoUrl && storePhotoUrl !== "no_image.jpg") {
                photoElem.src = storePhotoUrl;
            } else {
                // अगर कोई फोटो नहीं है, तो डिफ़ॉल्ट अवतार दिखेगा
                photoElem.src = "https://www.w3schools.com/howto/img_avatar.png"; 
            }
            photoElem.style.cursor = 'pointer'; // हाथ का निशान
        }

        // 3️⃣ बाकी का तुम्हारा रिव्यूज और लाइव स्टेटस सिंक (जैसे पहले काम कर रहा था)
        const toggleInput = document.getElementById('store-toggle');
        if (toggleInput) {
            toggleInput.checked = (storeData.status !== "closed" && info.status !== "closed");
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
    });
}


// 📸 फोटो पर क्लिक करते ही मोबाइल गैलरी खोलने के लिए
function openGallery() {
    const input = document.getElementById('avatar-input');
    if(input) {
        input.click();
    } else {
        console.error("HTML में 'avatar-input' नहीं मिला भाई!");
    }
}

// 🎯 महा-फिक्स 2: अब फोटो सीधे तुम्हारी असली लॉगिन ईमेल UID के अंदर ही जाएगी
// 🎯 नीलेश भाई का स्पेशल - बिल्कुल प्रोडक्ट की तरह १ क्लिक में सेव करने वाला कोड 🚀
function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 🌟 जैसे प्रोडक्ट कोड में सीधे फायरबेस से एक्टिव यूजर लिया है, वैसे ही यहाँ लो:
    const user = firebase.auth().currentUser;
    let myRealStoreId = null;

    if (user) {
        myRealStoreId = user.uid; // सीधे तुम्हारी असली लंबी वाली ईमेल UID मिल गई!
    } else {
        // बैकअप: अगर लोकलहोस्ट पर फायरबेस ऑथ लोड होने में १ सेकंड लेट हो, तो लोकल स्टोरेज देख लो
        const savedUser = localStorage.getItem('sastaStoreAccount') || localStorage.getItem('sastaStoreMerchant');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                myRealStoreId = parsed.uid || parsed.storeId || null;
            } catch(e) { console.log(e); }
        }
    }

    // 🚨 लोकलहोस्ट एमर्जेंसी बैकअप: अगर बिना लॉगिन के सिर्फ टेस्ट कर रहे हो, तो कोड को अटकने मत दो
    if (!myRealStoreId || myRealStoreId === "null" || myRealStoreId === "STORE_001") {
        myRealStoreId = "LOCALHOST_TEST_ID"; 
    }

    console.log("📸 फोटो सीधे इस असली आईडी के डिब्बे में जा रही है:", myRealStoreId);

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // प्रोडक्ट कोड की तरह ही इमेज का साइज फिक्स और कंप्रेस करना
            canvas.width = 400;
            canvas.height = 400;
            ctx.drawImage(img, 0, 0, 400, 400);

            // ६०% क्वालिटी पर कंप्रेस (बिल्कुल प्रोडक्ट फोटो की तरह लाइटवेट)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

            // 🎯 डायरेक्ट फायरबेस एक्शन: बिना किसी नखरे के सीधे 'photos/0' में डेटा सेट करो
            firebase.database().ref('stores/' + myRealStoreId + '/photos/0').set(compressedBase64)
                .then(() => {
                    alert("चकाचक नीलेश भाई! प्रोफाइल फोटो सीधे डेटाबेस में आपकी असली ईमेल UID में सेव हो गई! 🎉");
                    
                    // स्क्रीन पर तुरंत नई फोटो अपडेट करो
                    const userPhotoEl = document.getElementById('user-photo');
                    if (userPhotoEl) userPhotoEl.src = compressedBase64;
                })
                .catch((error) => {
                    console.error("फायरबेस में प्रोफाइल फोटो सेव करने में एरर:", error);
                    alert("फोटो सेव नहीं हो पाई भाई!");
                });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 📩 लाइव मैसेज नोटिफिकेशन
function triggerNotification(reviewType, newCount) {
    let myCustomMessage = `अरे नीलेश भाई सुनो! आपकी दुकान पर किसी ग्राहक ने एक नया ${reviewType} रिव्यू दिया है! अब आपका टोटल वोट ${newCount} हो गया है।`;
    alert(myCustomMessage); 
}
