const API_URL = "http://localhost:5000/api/products";
const token = localStorage.getItem("adminAccessToken");

async function loadProducts() {
  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch products");

    const products = await res.json();
    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = "";

    products.forEach((p, i) => {
      const img = p.image || (p.images && p.images[0]) || "https://via.placeholder.com/80";

      const statusBadge = p.inStock
        ? `<span class="badge bg-success">In Stock</span>`
        : `<span class="badge bg-danger">Out of Stock</span>`;

      const row = `
        <tr>
          <td>${i + 1}</td>
          <td><img src="${img}" width="60" height="60" style="object-fit:cover; border-radius:6px;"/></td>
          <td>${p.name}</td>
          <td>${p.category || "-"}</td>
          <td>Rs ${p.price}</td>
          <td>${p.stock ?? 0}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="editProduct('${p._id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}')">Delete</button>
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error(err);
    alert("Error loading products");
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert("❌ Error deleting: " + errorData.message);
      return;
    }

    alert("✅ Product deleted");
    loadProducts();
  } catch (err) {
    console.error(err);
    alert("Error deleting product");
  }
}

function editProduct(id) {
  window.location.href = `add-product.html?id=${id}`;
}

// Load products on page load
loadProducts();