import { getAuth, GoogleAuthProvider, signInWithPopup } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { app } from "../../firebase-config";   // ✅ correct path 

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.getElementById("googleLogin").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      alert("Welcome " + user.displayName);
      console.log("User Info:", user);
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Login Failed: " + error.message);
    });
});
