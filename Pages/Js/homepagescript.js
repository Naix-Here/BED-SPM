/**
 * HawkerHub User Engagement Dashboard Controller Engine
 * 2026 Core Interface Operations File
 */

// ============================================================
// SECTION 1: MULTI-LANGUAGE SUPPORT
// ============================================================

const languageDictionary = {
    en: {
        title: "User Engagement Dashboard",
        desc: "Monitor customer activity, loyalty rewards, favorite meals, promotional campaigns, notifications and user satisfaction through one centralized dashboard."
    },
    zh: {
        title: "用户互动数据中心",
        desc: "通过统一的中央控制台，实时监控客户活跃度、积分奖励、最受欢迎菜品、推广营销计划以及用户满意度评分。"
    },
    ms: {
        title: "Papan Pemuka Interaksi Pengguna",
        desc: "Pantau aktiviti pelanggan, ganjaran kesetiaan, hidangan kegemaran, kempen promosi, notifikasi dan kepuasan pengguna menerusi satu portal berpusat."
    },
    ta: {
        title: "பயனர் ஈடுபாடு டாஷ்போர்டு",
        desc: "வாடிக்கையாளர் செயல்பாடு, விசுவாச வெகுமதிகள், விருப்பமான உணவுகள் மற்றும் விளம்பர பிரச்சாரங்களை ஒரே மையப்படுத்தப்பட்ட போர்டல் மூலம் கண்காணிக்கவும்."
    }
};

function changeDashboardLanguage() {
    const selectedLang = document.getElementById("languageSelector").value;
    const content = languageDictionary[selectedLang];
    
    if (content) {
        document.getElementById("heroTitle").innerText = content.title;
        document.getElementById("heroDesc").innerText = content.desc;
    }
}

// ============================================================
// SECTION 2: LIKE / ENGAGEMENT SYSTEM
// ============================================================

function registerSimulatedLike(itemId) {
    const counterElement = document.getElementById(`like-count-${itemId}`);
    if (counterElement) {
        // Parse current likes - handle both formats
        let currentText = counterElement.innerText;
        let currentLikes = parseInt(currentText.replace(/,/g, '').trim().split(' ')[0]);
        if (isNaN(currentLikes)) currentLikes = 0;
        currentLikes += 1;
        counterElement.innerText = currentLikes.toLocaleString() + " Likes";
        
        // Visual feedback - pulse animation
        counterElement.style.color = "#ef4444";
        counterElement.style.transform = "scale(1.1)";
        counterElement.style.display = "inline-block";
        setTimeout(() => {
            counterElement.style.color = "var(--accent)";
            counterElement.style.transform = "scale(1)";
        }, 400);
        
        // Animate the heart button
        const btn = counterElement.closest('.trending-like').querySelector('.like-btn');
        if (btn) {
            btn.style.transform = "scale(1.4)";
            btn.style.background = "rgba(239, 68, 68, 0.3)";
            setTimeout(() => {
                btn.style.transform = "scale(1)";
                btn.style.background = "rgba(239, 68, 68, 0.1)";
            }, 300);
        }
    }
}

// ============================================================
// SECTION 3: FEEDBACK SYSTEM
// ============================================================

function submitLiveFeedbackRow() {
    const selectedStars = document.getElementById("feedbackRating").value;
    const writtenComment = document.getElementById("feedbackComment").value.trim();
    const container = document.getElementById("reviews-feed-container");

    if (!writtenComment) {
        // Show a subtle error state
        const input = document.getElementById("feedbackComment");
        input.style.borderColor = "#ef4444";
        input.placeholder = "✏️ Please write your review first...";
        setTimeout(() => {
            input.style.borderColor = "var(--border-subtle)";
            input.placeholder = "Write your review...";
        }, 2000);
        return;
    }

    // Build review node
    const reviewCard = document.createElement("div");
    reviewCard.className = "review";
    reviewCard.style.animation = "slideIn 0.4s ease";
    reviewCard.innerHTML = `
        <div class="review-stars">${selectedStars}</div>
        <p>${writtenComment} <span style="color:var(--text-dimmed); font-size:0.75rem;">• Just now</span></p>
    `;

    container.insertBefore(reviewCard, container.firstChild);
    document.getElementById("feedbackComment").value = "";
    
    // Show success feedback
    const input = document.getElementById("feedbackComment");
    input.style.borderColor = "#22c55e";
    setTimeout(() => {
        input.style.borderColor = "var(--border-subtle)";
    }, 1500);
}

// ============================================================
// SECTION 4: COMPLAINT TICKET SYSTEM
// ============================================================

function submitStallComplaintTicket() {
    const assignedStall = document.getElementById("complaintStall").value;
    const operationalType = document.getElementById("complaintReason").value.trim();
    const descriptiveDetails = document.getElementById("complaintDetails").value.trim();
    const listContainer = document.getElementById("complaint-list-container");

    if (!operationalType || !descriptiveDetails) {
        alert("⚠️ Please complete both fields to log this operational incident.");
        return;
    }

    const ticketNode = document.createElement("div");
    ticketNode.className = "complaint-ticket";
    ticketNode.style.animation = "slideIn 0.4s ease";
    ticketNode.innerHTML = `
        <h4>⚠️ Incident Log: ${assignedStall}</h4>
        <p><strong>Issue Type:</strong> ${operationalType}</p>
        <p>${descriptiveDetails}</p>
        <span style="font-size:0.75rem; color:#fca5a5; display:block; margin-top:6px;">Status: Registered for Manager Auditing</span>
    `;

    listContainer.insertBefore(ticketNode, listContainer.firstChild);
    
    // Clear fields
    document.getElementById("complaintReason").value = "";
    document.getElementById("complaintDetails").value = "";
    
    alert("✅ Incident report submitted successfully!");
}

// ============================================================
// SECTION 5: PROMOTIONAL NOTIFICATION SYSTEM
// ============================================================

function dispatchGlobalPromoNotification() {
    alert("📢 System Broadcast Success: Flash push notification message sent to all 8,942 online customer portal applications.");
}

// ============================================================
// SECTION 6: REWARD CLAIM SYSTEM
// ============================================================

function simulateRewardClaim() {
    alert("🎁 You have claimed your rewards! Check your email for voucher codes.");
}

// ============================================================
// SECTION 7: HOME PAGE FUNCTIONS
// ============================================================

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function simulateAppLaunch() {
    alert("📱 Opening order interface for this item...");
}

function executeTrackerSearch() {
    const input = document.getElementById("order-search-input");
    const resultBox = document.getElementById("tracker-result-box");
    const orderId = input.value.trim();
    
    if (!orderId) {
        input.style.borderColor = "#ef4444";
        input.placeholder = "⚠️ Please enter an Order ID";
        setTimeout(() => {
            input.style.borderColor = "var(--border-subtle)";
            input.placeholder = "Enter Order ID (e.g., TX-4821)";
        }, 2000);
        return;
    }
    
    // Show result
    resultBox.style.display = "block";
    document.getElementById("res-id-title").textContent = `${orderId} — 1x Consolidated Cross-Stall Order`;
    document.getElementById("res-sub-detail").textContent = "Payment Method: Online Card | Eco-Packaging Verified";
    
    // Random status updates
    const statuses = [
        "Preparing at Stall #03",
        "Cooking in Progress",
        "Quality Check",
        "Ready for Pickup",
        "Out for Delivery",
        "Delivered ✅"
    ];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    document.getElementById("res-status-badge").textContent = randomStatus;
    
    // Animate result
    resultBox.style.animation = "none";
    setTimeout(() => {
        resultBox.style.animation = "slideIn 0.5s ease";
    }, 10);
}

// ============================================================
// SECTION 8: CSS ANIMATIONS (injected dynamically)
// ============================================================

// Add animation styles if not already present
(function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .trending-like .like-counter {
            transition: all 0.3s ease;
            display: inline-block;
        }
        .complaint-ticket {
            animation: slideIn 0.4s ease;
        }
        .review {
            animation: slideIn 0.4s ease;
        }
    `;
    document.head.appendChild(style);
})();

// ============================================================
// SECTION 9: AUTO-INIT ON PAGE LOAD
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Set default language if selector exists
    const selector = document.getElementById('languageSelector');
    if (selector) {
        // Ensure English is selected by default
        selector.value = 'en';
    }
    
    console.log('🚀 HawkerHub Engagement Dashboard initialized');
});