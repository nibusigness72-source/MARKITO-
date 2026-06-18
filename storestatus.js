// Dukaan khuli hai ya band — check karne wala common function
function isStoreOpenNow(storeData) {
    // 1. Manual off check - agar dukandar ne khud band kar rakha hai
    if (storeData.status === "closed") return false;

    // 2. Open/Close time check
    const timing = storeData.timing;
    if (!timing || !timing.open || !timing.close) return true; // time set nahi hai to always open maano

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = timing.open.split(':').map(Number);
    const [closeH, closeM] = timing.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (openMinutes <= closeMinutes) {
        // Normal case: 9:00 AM se 9:00 PM
        return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    } else {
        // Raat paar karne wala case: 9:00 PM se 6:00 AM
        return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
}