console.log("✅ Admin Login JS loaded");

document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("error");

  errorBox.textContent = ""; // clear previous error

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      if (data.user.role === "admin") {
        // ✅ Save tokens & admin info
        localStorage.setItem("adminAccessToken", data.accessToken);
        localStorage.setItem("adminUser", JSON.stringify(data.user));

        // ✅ Redirect to admin dashboard
        window.location.href = "index.html";
      } else {
        errorBox.textContent = "❌ You are not authorized as Admin!";
      }
    } else {
      errorBox.textContent = data.message || "❌ Login failed!";
    }
  } catch (err) {
    console.error("⚠️ Login error:", err);
    errorBox.textContent = "⚠️ Server not responding!";
  }
});