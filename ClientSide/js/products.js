


const API_URL = `http://${window.location.hostname}:5000/api/products`;

let allProducts = []; // Saare products memory me rakhenge
let activeCategory = "All"; // default category

// Products fetch karo
async function loadProducts() {
  try {
    console.log("🔄 Fetching products from:", API_URL);
    const res = await fetch(API_URL);
    
    console.log("📡 Response status:", res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("📦 Products data:", data);
    
    allProducts = data;

    // Categories banao
    renderCategories(allProducts);

    // Default me All products dikhao 
    renderProducts(allProducts);

  } catch (err) {
    console.error("❌ Error fetching products:", err);
    document.getElementById("products").innerHTML = `
      <div style="text-align: center; padding: 20px; color: red;">
        <h3>❌ Failed to load products!</h3>
        <p>Error: ${err.message}</p>
        <p>Please check if the server is running on port 5000</p>
        <button onclick="loadProducts()" style="margin-top: 10px; padding: 10px 20px; background: #042b80ff; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
      </div>
    `;
  }
}

// 🔹 Products render karna
function renderProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = "<p>No products found!</p>";
    return;
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card fade-in"; // smooth transition

    let imageSection = "";

    // ✅ Multiple images case - slider
    if (Array.isArray(p.images) && p.images.length > 1) {
      imageSection = `
        <div class="slider">
          ${p.images
            .map(
              (img, i) => `
            <div class="slide ${i === 0 ? "active" : ""}">
              <img src="${img}" alt="${p.name}">
            </div>
          `
            )
            .join("")}
          <button class="prev" onclick="prevSlide(this)">❮</button>
          <button class="next" onclick="nextSlide(this)">❯</button>
        </div>
      `;
    } else {
      // ✅ Single image case - no slider
      const singleImage =
        p.image || (p.images && p.images.length ? p.images[0] : "https://via.placeholder.com/200");
      imageSection = `<img src="${singleImage}" alt="${p.name}" />`;
    }

    // Get the product image for cart
    const productImage = p.image || (p.images && p.images.length ? p.images[0] : 'https://via.placeholder.com/200');

    card.innerHTML = `
      ${imageSection}
      <h3>${p.name}</h3>
      <p class="description">${p.description || "No description available"}</p>
      <p><strong>Price: Rs ${p.price}</strong></p>
      <div class="card-footer">
        <button onclick="addToCart('${p._id}', '${p.name}', ${p.price}, '${productImage}')">Add to Cart</button>
      </div>
    `;

    container.appendChild(card);
  });
}

// 🔹 Categories show karna
function renderCategories(products) {
  const uniqueCategories = ["All", ...new Set(products.map(p => p.category || "Other"))];

  const catContainer = document.createElement("div");
  catContainer.className = "categories";

  uniqueCategories.forEach(cat => {
    const btn = document.createElement("button");
    btn.innerText = cat;
    btn.onclick = () => {
      activeCategory = cat;
      applyFilters();
    };
    catContainer.appendChild(btn);
  });

  document.body.insertBefore(catContainer, document.getElementById("products"));
}

// 🔹 Category ke hisaab se filter
function filterProducts(category) {
  activeCategory = category;
  applyFilters();
}

// 🔹 Search function
function searchProducts() {
  applyFilters();
}

// 🔹 Category + Search dono apply
function applyFilters() {
  const query = document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered = allProducts.filter(p =>
    (activeCategory === "All" || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query))
  );

  renderProducts(filtered);
}

// 🔹 Add product to cart
function handleAddToCart(id, name, price, image) {
  // Get the product image (single or first from multiple)
  let productImage = image;
  if (!productImage) {
    // Try to get image from the product data
    const product = allProducts.find(p => p._id === id);
    if (product) {
      productImage = product.image || (product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/200');
    }
  }
  
  // Call the global addToCart function from cart.js
  if (typeof window.addToCart === 'function') {
    window.addToCart(id, name, price, productImage);
  } else {
    // Fallback if cart.js not loaded
    alert(`${name} added to cart!`);
  }
}

// 🔹 Cart functions are now handled by cart.js
// The viewCart() and updateCartCount() functions are defined in cart.js

// ✅ Slider controls
function nextSlide(btn) {
  const slider = btn.closest(".slider");
  const slides = slider.querySelectorAll(".slide");
  let activeIndex = [...slides].findIndex((s) => s.classList.contains("active"));
  slides[activeIndex].classList.remove("active");
  let nextIndex = (activeIndex + 1) % slides.length;
  slides[nextIndex].classList.add("active");
}

function prevSlide(btn) {
  const slider = btn.closest(".slider");
  const slides = slider.querySelectorAll(".slide");
  let activeIndex = [...slides].findIndex((s) => s.classList.contains("active"));
  slides[activeIndex].classList.remove("active");
  let prevIndex = (activeIndex - 1 + slides.length) % slides.length;
  slides[prevIndex].classList.add("active");
}

// Page load hone par
loadProducts();



