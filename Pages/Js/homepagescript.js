/**
 * HawkerHub Operational Engine Script
 * Handles marketing view switching, simulation routing prompts, and live query tracker queries.
 */

// Central system state database dictionary mock values for the tracker query box
const systemTrackingDatabase = {
    "TX-4821": { items: "1x Signature Chicken Rice", bill: "$5.80", step: "Preparing at Stall #03" },
    "TX-9022": { items: "2x Premium Nasi Lemak Platters", bill: "$13.00", step: "Out for Delivery via HubRider" },
    "TX-1104": { items: "1x Laksa Cutlet Combo", bill: "$7.50", step: "Ready for Collection at Counter B" }
};

/**
 * Main Interface View Toggle Configuration
 */
function switchToStaffView(loadStaffWorkspace) {
    const customerBlock = document.getElementById('customer-view-container');
    const staffBlock = document.getElementById('staff-view-container');
    const customerNav = document.getElementById('customer-nav-links');
    const loginBtn = document.getElementById('portalToggleBtn');
    const exitBtn = document.getElementById('exitPortalBtn');

    if (loadStaffWorkspace) {
        // Completely take over the viewport for the internal cloud hub dashboards
        customerBlock.style.display = 'none';
        customerNav.style.display = 'none';
        loginBtn.style.display = 'none';
        
        staffBlock.style.display = 'block';
        exitBtn.style.display = 'inline-flex';
    } else {
        // Return to standard corporate homepage configurations
        staffBlock.style.display = 'none';
        exitBtn.style.display = 'none';
        
        customerBlock.style.display = 'block';
        customerNav.style.display = 'block';
        loginBtn.style.display = 'inline-flex';
        
        // Auto reset entry criteria
        document.getElementById('portal-authenticated-view').style.display = 'none';
        document.getElementById('portal-login-form-view').style.display = 'block';
    }
}

function exitToHomepage() {
    switchToStaffView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Staff Matrix Access & Operational Gates
 */
function authenticateStaffLogin() {
    const chosenRoleKey = document.getElementById('staff-role-selector').value;
    
    document.getElementById('portal-login-form-view').style.display = 'none';
    document.getElementById('portal-authenticated-view').style.display = 'block';
    document.querySelectorAll('.staff-dashboard-subview').forEach(view => view.style.display = 'none');
    
    const profileBadge = document.getElementById('staff-badge');
    
    if (chosenRoleKey === 'vendor') {
        profileBadge.innerText = "Authorized Vendor Profile";
        document.getElementById('dashboard-vendor').style.display = 'block';
    } else if (chosenRoleKey === 'nea') {
        profileBadge.innerText = "NEA Field Inspector Clearance";
        document.getElementById('dashboard-nea').style.display = 'block';
    } else if (chosenRoleKey === 'admin') {
        profileBadge.innerText = "System Administrator (Root Account)";
        document.getElementById('dashboard-admin').style.display = 'block';
    }
}

function logoutStaffPortal() {
    document.getElementById('portal-authenticated-view').style.display = 'none';
    document.getElementById('portal-login-form-view').style.display = 'block';
    alert("Administrative terminal connection terminated securely.");
}

/**
 * Marketing Platform Interactive Simulation Elements
 */
function simulateAppLaunch(terminalProfileName) {
    alert(`Redirecting... In production, this launches the separate standalone digital consumer ordering webapp application window.`);
}

function executeTrackerSearch() {
    const targetQueryKey = document.getElementById('order-search-input').value.trim().toUpperCase();
    const resultPanel = document.getElementById('tracker-result-box');
    
    if (!targetQueryKey) {
        alert("Please specify a systematic tracking code value parameter first.");
        return;
    }

    // Lookup index credentials in static map variables
    if (systemTrackingDatabase[targetQueryKey]) {
        const orderNode = systemTrackingDatabase[targetQueryKey];
        document.getElementById('res-id-title').innerText = `${targetQueryKey} — ${orderNode.items}`;
        document.getElementById('res-sub-detail').innerText = `Gross Payment: ${orderNode.bill} | System Fund Splits: Cleared`;
        document.getElementById('res-status-badge').innerText = orderNode.step;
        resultPanel.style.display = 'block';
    } else {
        alert("Order parameter ID index node not detected. Try checking with code: TX-4821 or TX-9022");
        resultPanel.style.display = 'none';
    }
}

function submitNeaInspectionLog() {
    alert("Statutory log successfully verified and signed by inspection badge index key.");
    document.getElementById('ins-stall-id').value = '';
    document.getElementById('ins-remarks').value = '';
}