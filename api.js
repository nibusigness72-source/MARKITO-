// ==========================================
// 🛣️ ROAD DISTANCE — Multiple Free APIs ke saath
// ==========================================

// Yahan apni free API keys daalna (signup ke baad milti hain)
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE3ZmI2YjA1YjFhMjQ2MWQ4MWFmYWE3N2MzZjc3NmQ5IiwiaCI6Im11cm11cjY0In0=";
const LOCATIONIQ_API_KEY = "pk.554407d96baf134c7506563efad2b770";

// 1️⃣ OSRM - Free, koi key nahi chahiye
async function tryOSRM(lat1, lon1, lat2, lon2) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.routes && data.routes[0]) {
        return data.routes[0].distance / 1000; // meters ko km mein convert
    }
    throw new Error("OSRM failed");
}

// 2️⃣ OpenRouteService - Free key chahiye
async function tryOpenRouteService(lat1, lon1, lat2, lon2) {
    if (!ORS_API_KEY || ORS_API_KEY.includes("YAHAN")) throw new Error("ORS key nahi hai");
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${lon1},${lat1}&end=${lon2},${lat2}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features[0]) {
        return data.features[0].properties.segments[0].distance / 1000;
    }
    throw new Error("ORS failed");
}

// 3️⃣ LocationIQ - Free key chahiye
async function tryLocationIQ(lat1, lon1, lat2, lon2) {
    if (!LOCATIONIQ_API_KEY || LOCATIONIQ_API_KEY.includes("YAHAN")) throw new Error("LocationIQ key nahi hai");
    const url = `https://us1.locationiq.com/v1/directions/driving/${lon1},${lat1};${lon2},${lat2}?key=${LOCATIONIQ_API_KEY}&overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
        return data.routes[0].distance / 1000;
    }
    throw new Error("LocationIQ failed");
}

// 🎯 Main function — yeh sabse pehle OSRM try karega, fail hone par doosra, fail hone par teesra
// Aur agar sab fail ho jaye to fallback distance (straight line * 1.7) use hoga
window.getRoadDistance = async function(lat1, lon1, lat2, lon2, fallbackDistance) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return fallbackDistance;

    try {
        return await tryOSRM(lat1, lon1, lat2, lon2);
    } catch(e) {
        console.log("OSRM fail, OpenRouteService try kar rahe hain...");
    }

    try {
        return await tryOpenRouteService(lat1, lon1, lat2, lon2);
    } catch(e) {
        console.log("ORS fail, LocationIQ try kar rahe hain...");
    }

    try {
        return await tryLocationIQ(lat1, lon1, lat2, lon2);
    } catch(e) {
        console.log("Sab API fail, fallback distance use ho raha hai...");
    }

    return fallbackDistance;
};