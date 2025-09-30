const API_URL = "http://localhost:5000/api/products";
const CATEGORY_API = "http://localhost:5000/api/categories";
const token = localStorage.getItem("adminAccessToken");

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// 👉 Load categories into dropdown from DB
async function loadCategories(selectedCategory = "") {
  const select = document.getElementById("categorySelect");
  select.innerHTML = '<option value="">-- Select Category --</option>';

  try {
    const res = await fetch(CATEGORY_API);
    const cats = await res.json();

    cats.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.innerText = cat.name;
      if (cat.name === selectedCategory) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (err) {
    console.error("⚠️ Error loading categories:", err);
  }
}

// 👉 Add new category dynamically (backend save)
async function addNewCategory() {
  const newCat = document.getElementById("newCategory").value.trim();
  if (!newCat) return;

  try {
    const res = await fetch(CATEGORY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // admin required
      },
      body: JSON.stringify({ name: newCat }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("❌ Error: " + err.message);
      return;
    }

    document.getElementById("newCategory").value = "";
    await loadCategories(newCat); // refresh + auto select new one
  } catch (err) {
    console.error("⚠️ Error adding category:", err);
  }
}

// 👉 Add more image input fields
function addImageField() {
  const container = document.getElementById("imagesContainer");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control mb-2";
  input.name = "image";
  input.placeholder = "Enter image URL";
  container.appendChild(input);
}

// 👉 Handle form submit
document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Collect images
  const imageInputs = document.querySelectorAll("input[name='image']");
  const images = Array.from(imageInputs)
    .map(input => input.value)
    .filter(url => url.trim() !== "");

  const productData = {
    name: document.getElementById("name").value,
    price: parseFloat(document.getElementById("price").value),
    stock: parseInt(document.getElementById("stock").value),
    inStock: document.getElementById("inStock").checked,
    category: document.getElementById("categorySelect").value,
    images: images,
  };

  if (images.length > 0) {
    productData.image = images[0]; // main image = first one
  }

  try {
    const res = await fetch(productId ? `${API_URL}/${productId}` : API_URL, {
      method: productId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert("❌ Error: " + errorData.message);
      return;
    }

    alert(productId ? "✅ Product updated successfully" : "✅ Product added successfully");
    window.location.href = "index.html#products";
  } catch (err) {
    console.error("⚠️ Error saving product:", err);
    alert("⚠️ Error saving product");
  }
});

// 👉 Edit mode (populate existing product)
if (productId) {
  document.getElementById("formTitle").innerText = "Edit Product";
  fetch(`${API_URL}/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(p => {
      document.getElementById("name").value = p.name;
      document.getElementById("price").value = p.price;
      document.getElementById("stock").value = p.stock;
      document.getElementById("inStock").checked = p.inStock;

      // ✅ Load categories and auto-select product category
      loadCategories(p.category);

      // Load images
      if (p.images && p.images.length > 0) {
        const container = document.getElementById("imagesContainer");
        container.innerHTML = "";
        p.images.forEach(url => {
          const input = document.createElement("input");
          input.type = "text";
          input.className = "form-control mb-2";
          input.name = "image";
          input.value = url;
          container.appendChild(input);
        });
      }
    })
    .catch(err => console.error("⚠️ Error loading product:", err));
} else {
  // Add mode -> just load categories
  document.addEventListener("DOMContentLoaded", () => loadCategories());
}