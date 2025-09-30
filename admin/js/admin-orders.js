console.log("✅ Admin Orders JS Loaded");

const ORDER_API = "http://localhost:5000/api/admin/orders";
const adminAccessToken = localStorage.getItem("adminAccessToken");

let currentOrderId = null; // ✅ For modal PDF button

document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
});

// =====================
// 🔹 Load Orders
// =====================
async function loadOrders(page = 1) {
  const search = document.getElementById("searchOrder")?.value.trim() || "";
  const status = document.getElementById("filterStatus")?.value || "";
  const payment = document.getElementById("filterPayment")?.value || "";
  const from = document.getElementById("filterFrom")?.value || "";
  const to = document.getElementById("filterTo")?.value || "";
  const sort = "desc";

  try {
    const res = await fetch(
      `${ORDER_API}?page=${page}&limit=10&status=${status}&sort=${sort}&search=${search}&payment=${payment}&from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${adminAccessToken}` } }
    );

    const data = await res.json();
    renderOrders(data.orders);
    renderPagination(data.page, data.totalPages);
  } catch (err) {
    console.error("⚠️ Error loading orders:", err);
  }
}

// =====================
// 🔹 Render Orders
// =====================
function renderOrders(orders) {
  const tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">No orders found</td></tr>`;
    return;
  }

  orders.forEach((o, i) => {
    const customerName = o.fullname || o.user?.name || "N/A";
    const customerEmail = o.email || o.user?.email || "N/A";

    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${customerName}</td>
        <td>${customerEmail}</td>
        <td>
          <select class="form-select form-select-sm" onchange="updateOrderStatus('${o._id}', this.value, ${o.isPaid})">
            <option ${o.status === "Pending" ? "selected" : ""}>Pending</option>
            <option ${o.status === "Processing" ? "selected" : ""}>Processing</option>
            <option ${o.status === "Shipped" ? "selected" : ""}>Shipped</option>
            <option ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
            <option ${o.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
        </td>
        <td>${o.isPaid ? "✅ Paid" : "❌ Unpaid"}</td>
        <td>Rs ${o.totalPrice + (o.deliveryCharges || 0)}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="viewOrder('${o._id}')">👁 View</button>
          <button class="btn btn-primary btn-sm" onclick="downloadOrderPDF('${o._id}')">📄 PDF</button>
          <button class="btn btn-danger btn-sm" onclick="deleteOrder('${o._id}')">🗑 Delete</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// =====================
// 🔹 Pagination
// =====================
function renderPagination(current, totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" href="#" onclick="loadOrders(${i})">${i}</a>
      </li>
    `;
  }
}

// =====================
// 🔹 Apply Filters
// =====================
function applyFilters() {
  loadOrders(1);
}

// =====================
// 🔹 View Order (Modal)
// =====================
async function viewOrder(id) {
  try {
    currentOrderId = id;
    const res = await fetch(`${ORDER_API}/${id}`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const order = await res.json();

    let html = `
      <p><b>Customer:</b> ${order.fullname || order.user?.name} (${order.email || order.user?.email})</p>
      <p><b>Status:</b> ${order.status}</p>
      <p><b>Total:</b> Rs ${order.totalPrice + (order.deliveryCharges || 0)}</p>
      <p><b>Payment:</b> ${order.payment} (${order.isPaid ? "✅ Paid" : "❌ Unpaid"})</p>
      <h6>Items:</h6>
      <ul>
        ${order.items.map(it => `<li>${it.name} - ${it.quantity} x Rs ${it.price}</li>`).join("")}
      </ul>
    `;

    document.getElementById("orderDetailContent").innerHTML = html;
    new bootstrap.Modal(document.getElementById("orderDetailModal")).show();
  } catch (err) {
    console.error("⚠️ Error fetching order detail:", err);
  }
}

// =====================
// 🔹 Update Order Status (with Paid handling)
// =====================
async function updateOrderStatus(id, status, isPaid) {
  try {
    // If delivered but unpaid → mark as paid
    const payload = { status, isPaid };
    if (status === "Delivered" && !isPaid) {
      payload.isPaid = true;
    }

    const res = await fetch(`${ORDER_API}/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to update order");

    const result = await res.json();
    alert(`✅ Order updated! Email sent to ${result.email}`);
    loadOrders();
  } catch (err) {
    console.error("⚠️ Error updating status:", err);
  }
}

// =====================
// 🔹 Delete Order
// =====================
async function deleteOrder(id) {
  if (!confirm("⚠️ Delete this order?")) return;
  try {
    await fetch(`${ORDER_API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    loadOrders();
    alert("🗑️ Order deleted successfully!");
  } catch (err) {
    console.error("⚠️ Error deleting order:", err);
  }
}

// =====================
// 🔹 Download single Order PDF
// =====================
async function downloadOrderPDF(id) {
  try {
    const res = await fetch(`${ORDER_API}/${id}/pdf`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    if (!res.ok) throw new Error("Failed to download PDF");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("⚠️ Error downloading order PDF:", err);
  }
}

// =====================
// 🔹 Export Orders (Excel + PDF)
// =====================
async function exportExcel() {
  try {
    const res = await fetch(`${ORDER_API}/export/excel`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("⚠️ Error exporting Excel:", err);
  }
}

async function exportPDF() {
  try {
    const res = await fetch(`${ORDER_API}/export/pdf`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.pdf";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("⚠️ Error exporting PDF:", err);
  }
}