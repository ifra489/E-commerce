console.log("✅ Admin Dashboard JS Loaded");

// Protect route
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("adminAccessToken");
  const adminUser = JSON.parse(localStorage.getItem("adminUser"));

  if (!token || !adminUser || adminUser.role !== "admin") {
    alert("❌ Unauthorized! Please login as Admin.");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("adminName").innerText = `👋 ${adminUser.name}`;
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    showSection(hash);
  } else {
    showSection("dashboard");
  }

  fetchStats();
});

// Section toggle
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
  document.getElementById("pageTitle").innerText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
}

// Logout
function logout() {
  localStorage.removeItem("adminAccessToken");
  localStorage.removeItem("adminUser");
  alert("🚪 Logged out successfully");
  window.location.href = "login.html";
}

// Fetch stats from backend
async function fetchStats() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/stats", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("adminAccessToken")}` }
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById("dashboardTotalOrders").innerText = data.totalOrders;
      document.getElementById("dashboardTotalProducts").innerText = data.totalProducts;
      document.getElementById("dashboardTotalUsers").innerText = data.totalUsers;
    } else {
      console.error("❌ Stats fetch error:", data.message);
    }
  } catch (err) {
    console.error("⚠️ Error fetching stats:", err);
  }
}