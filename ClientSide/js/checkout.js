// ✅ Protect checkout: redirect if not logged in
console.log("✅ checkout.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    window.location.href = "loginregister.html?redirect=checkout.html";
  }
});

// ✅ Helper: calculate cart total
function calculateTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ✅ Handle checkout form
document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("⚠️ Please login first!");
    return window.location.href = "loginregister.html?redirect=checkout.html";
  }

  // ✅ Get cart from localStorage
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (!cart.length) {
    alert("⚠️ Your cart is empty!");
    return;
  }

  // ✅ Payment method
  const paymentMethod = document.querySelector("input[name='payment']:checked")?.value || "cod";

  // ================= Validation for Payment =================
  let transactionId = "";
  let cardNumber = "";
  let expiryDate = "";
  let cvv = "";

  if (paymentMethod === "easypaisa") {
    transactionId = document.getElementById("transactionId").value.trim();
    if (!transactionId) {
      alert("⚠️ Please enter your Transaction ID for Easypaisa / JazzCash.");
      return;
    }
  }

  if (paymentMethod === "card") {
    cardNumber = document.getElementById("cardNumber").value.trim();
    expiryDate = document.getElementById("expiryDate").value.trim();
    cvv = document.getElementById("cvv").value.trim();

    if (!cardNumber || !expiryDate || !cvv) {
      alert("⚠️ Please fill all card details (Card Number, Expiry Date, CVV).");
      return;
    }

    // Optional: Simple regex check for card number
    if (!/^\d{16}$/.test(cardNumber.replace(/\s+/g, ""))) {
      alert("⚠️ Please enter a valid 16-digit card number.");
      return;
    }
  }

  // ✅ Collect form data
  const orderData = {
    fullname: document.getElementById("fullname").value,
    address: document.getElementById("address").value,
    email: document.getElementById("email").value, 
    city: document.getElementById("city").value,
    place: document.getElementById("place").value,
    contact: document.getElementById("contact").value,
    payment: paymentMethod,
    transactionId,   // save only if Easypaisa
    cardNumber,      // save only if Card
    expiryDate,
    cvv,
    items: cart,
    totalPrice: calculateTotal(cart),
    deliveryCharges: 200
  };

  console.log("DEBUG orderData:", orderData); // ✅ Debug

  try {
    const res = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization":` Bearer ${accessToken}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Your order has been placed successfully!\n📧 Confirmation email sent.");
      localStorage.removeItem("cart");
      window.location.href = "http://localhost:5000/index.html"; // proper redirect
    } else {
      alert("❌ Error: " + (data.message || "Order failed"));
    }
  } catch (err) {
    console.error("Order submit error:", err);
    alert("⚠️ Something went wrong. Try again later.");
  }
});

// ✅ Cancel order
document.getElementById("cancelBtn")?.addEventListener("click", () => {
  window.location.href = "http://localhost:5000/index.html";
});