/**
 * HawkerHub Operational Engine Script
 * Handles simple structural scroll jumps and live tracker simulation logic queries.
 */

// Core static data tracking system dictionary lookup parameters
const systemTrackingDatabase = {
    "TX-4821": { items: "1x Signature Chicken Rice", note: "Eco-Packaging Selected", step: "Preparing at Stall #03" },
    "TX-9022": { items: "2x Premium Nasi Lemak Platters", note: "Out for delivery via HubRider", step: "En Route" },
    "TX-1104": { items: "1x Laksa Cutlet Combo", note: "Ready for collection at central locker", step: "Ready" }
};

/**
 * Navbar Navigation Reset Anchor Trigger
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Public Interactivity Emulation Routines
 */
function simulateAppLaunch() {
    alert("Redirecting... In production, this launches the separate standalone digital consumer ordering webapp window application.");
}

function executeTrackerSearch() {
    const targetQueryKey = document.getElementById('order-search-input').value.trim().toUpperCase();
    const resultPanel = document.getElementById('tracker-result-box');
    
    if (!targetQueryKey) {
        alert("Please specify your order reference number first.");
        return;
    }

    // Trace dictionary entries for user view generation
    if (systemTrackingDatabase[targetQueryKey]) {
        const orderNode = systemTrackingDatabase[targetQueryKey];
        document.getElementById('res-id-title').innerText = `${targetQueryKey} — ${orderNode.items}`;
        document.getElementById('res-sub-detail').innerText = `${orderNode.note} | Real-time tracking enabled`;
        document.getElementById('res-status-badge').innerText = orderNode.step;
        resultPanel.style.display = 'block';
    } else {
        alert("Order number not found. Please try with codes: TX-4821 or TX-9022");
        resultPanel.style.display = 'none';
    }
}