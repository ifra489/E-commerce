


let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ✅ Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// ✅ Calculate total items (helper)
function calculateTotalItems() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// ✅ Update cart count on navbar
function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  if (countEl) {
    countEl.textContent = calculateTotalItems();
  }
}

// ✅ Update cart summary (total items & price in cart.html)
function updateCartSummary() {
  const totalItemsEl = document.getElementById("total-items");
  const totalPriceEl = document.getElementById("cart-total");

  const totalItems = calculateTotalItems();
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (totalItemsEl) totalItemsEl.textContent = totalItems;
  if (totalPriceEl) totalPriceEl.textContent = "Rs " + totalPrice;
}

// ✅ Add product to cart (image comes from backend)
function addToCart(productId, name, price, imageUrl) {
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({productId: productId, name, price, quantity: 1, image: imageUrl });
  }
  saveCart();
  updateCartSummary();
  alert(`${name} added to cart 🛒`); 
}

// ✅ View cart
function viewCart() {
  window.location.href = "cart.html";
}

// ✅ Display cart items
function displayCart() {
  const cartItemsEl = document.getElementById("cart-items");

  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="empty-cart">
        <h3>Your cart is empty 🛒</h3>
        <a href="index.html" class="continue-shopping">⬅ Continue Shopping</a>
      </div>
    `;
    updateCartSummary();
    return;
  }

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <div class="item-image">
        <img src="${item.image}" alt="${item.name}">
        console.log("cart item",item.image);
      </div>
      <div class="item-details">
        <h4>${item.name}</h4>
        <p class="item-price">Rs ${item.price}</p>
        <p class="item-quantity">Quantity: ${item.quantity}</p>
      </div>
      <div class="item-subtotal">Rs ${item.price * item.quantity}</div>
      <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
    `;
    cartItemsEl.appendChild(div);
  });

  // ✅ Update summary
  updateCartSummary();
}

// ✅ Remove item
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  displayCart();
}

// ✅ Clear cart
function clearCart() {
  cart = [];
  saveCart();
  displayCart();
}

// ✅ Proceed to checkout
function proceedToCheckout() {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    window.location.href = "checkout.html";
  } else {
    window.location.href = "loginregister.html?redirect=checkout.html";
  }
}

// ✅ Navbar update
function updateNavbarAuth() {
  const authLinks = document.getElementById("auth-links");
  if (!authLinks) return;

  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    authLinks.innerHTML = `
      <button onclick="viewCart()" class="cart-btn">
        🛒 Cart (<span id="cart-count">0</span>)
      </button>
      <a href="profile.html" class="profile-link">👤 Profile</a>
      <button id="logoutBtn" class="logout-btn">Logout</button>
    `;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("user");
      alert("Logged out successfully ✅");
      window.location.href = "index.html";
    });
  } else {
    authLinks.innerHTML = `
      <button onclick="viewCart()" class="cart-btn">
        🛒 Cart (<span id="cart-count">0</span>)
      </button>
      <a href="loginregister.html">Sign In</a> |
      <a href="loginregister.html">Sign Up</a>
    `;
  }

  updateCartCount();
}

// ✅ Init
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  displayCart();
  updateNavbarAuth();
});