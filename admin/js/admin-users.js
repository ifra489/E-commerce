console.log("✅ Admin Users JS Loaded");

const USER_API = "http://localhost:5000/api/admin/users";
const adminUsersToken = localStorage.getItem("adminAccessToken");

let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
});

// =====================
// 🔹 Load Users
// =====================
async function loadUsers() {
  try {
    const res = await fetch(USER_API, {
      headers: { Authorization: `Bearer ${adminUsersToken}` },
    });
    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    console.error("⚠️ Error loading users:", err);
  }
}

// =====================
// 🔹 Render Users Table
// =====================
function renderUsers(users) {
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No users found</td></tr>`;
    return;
  }

  users.forEach((u, i) => {
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.status || "active"}</td>
        <td>
          <button class="btn btn-info btn-sm" onclick="viewUser('${u._id}')">👁 View</button>
          <button class="btn btn-warning btn-sm" onclick="toggleBlockUser('${u._id}', '${u.status || "active"}')">
            ${u.status === "blocked" ? "🔓 Unblock" : "🚫 Block"}
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}')">🗑 Delete</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// =====================
// 🔹 View Single User (Modal)
// =====================
async function viewUser(id) {
  try {
    currentUserId = id;
    const res = await fetch(`${USER_API}/${id}`, {
      headers: { Authorization: `Bearer ${adminUsersToken}` },
    });
    const user = await res.json();

    let html = `
      <p><b>Name:</b> ${user.name}</p>
      <p><b>Email:</b> ${user.email}</p>
      <p><b>Role:</b> ${user.role}</p>
      <p><b>Status:</b> ${user.status || "active"}</p>
    `;

    document.getElementById("userDetailContent").innerHTML = html;
    new bootstrap.Modal(document.getElementById("userDetailModal")).show();
  } catch (err) {
    console.error("⚠️ Error fetching user:", err);
  }
}

// =====================
// 🔹 Update User (role, name etc.)
// =====================
async function updateUser(id, name, role) {
  try {
    await fetch(`${USER_API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminUsersToken}`,
      },
      body: JSON.stringify({ name, role }),
    });
    loadUsers();
    alert("✅ User updated successfully!");
  } catch (err) {
    console.error("⚠️ Error updating user:", err);
  }
}

// =====================
// 🔹 Block / Unblock User
// =====================
async function toggleBlockUser(id, status) {
  try {
    const endpoint = status === "blocked" ? "unblock" : "block";
    await fetch(`${USER_API}/${id}/${endpoint}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminUsersToken}` },
    });
    loadUsers();
    alert(status === "blocked" ? "✅ User unblocked!" : "🚫 User blocked!");
  } catch (err) {
    console.error("⚠️ Error blocking/unblocking user:", err);
  }
}

// =====================
// 🔹 Delete User
// =====================
async function deleteUser(id) {
  if (!confirm("⚠️ Delete this user?")) return;
  try {
    await fetch(`${USER_API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminUsersToken}` },
    });
    loadUsers();
    alert("🗑️ User deleted successfully!");
  } catch (err) {
    console.error("⚠️ Error deleting user:", err);
  }
}