console.log("app.js loaded");

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// 🔥 YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCKEPD4fp4GSTv4lD1sKvIga9O8ImYsSHM",
  authDomain: "tankajahariportal.firebaseapp.com",
  projectId: "tankajahariportal",
  storageBucket: "tankajahariportal.firebasestorage.app",
  messagingSenderId: "547424748543",
  appId: "1:547424748543:web:0ec55a74492ffac3b15dca"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Elements
const authDiv = document.getElementById("auth");
const chatDiv = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

const globalMessages = document.getElementById("globalMessages");
const globalInput = document.getElementById("globalInput");
const globalSend = document.getElementById("globalSend");

const dmUser = document.getElementById("dmUser");
const dmMessages = document.getElementById("dmMessages");
const dmInput = document.getElementById("dmInput");
const dmSend = document.getElementById("dmSend");

let currentDMListener = null;

// Helper to make fake email
function fakeEmail(username) {
  return `${username}@chatapp.com`;
}

// Register (prevents duplicate usernames)
registerBtn.onclick = async () => {
  try {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) return alert("Enter username + password");

    // Check if username exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return alert("Username already taken.");
    }

    const email = fakeEmail(username);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    await setDoc(doc(db, "users", user.uid), {
      username: username
    });

    alert("Registered successfully!");
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    alert("Error: " + error.message);
  }
};




// Login
loginBtn.onclick = async () => {
  try {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const email = fakeEmail(username);

    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Login Error: " + error.message);
  }
};


// Logout
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// Auth state
onAuthStateChanged(auth, user => {
  if (user) {
    authDiv.style.display = "none";
    chatDiv.style.display = "block";
    startGlobalChat();
    startDM(); // start DM listener automatically
  } else {
    authDiv.style.display = "block";
    chatDiv.style.display = "none";
    if (currentDMListener) currentDMListener();
  }
});

// Global Chat
function startGlobalChat() {
  const q = query(collection(db, "globalMessages"), orderBy("createdAt", "asc"));
  onSnapshot(q, snapshot => {
    globalMessages.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "message";
      div.innerText = `${data.username}: ${data.text}`;
      globalMessages.appendChild(div);
    });
  });
}

globalSend.onclick = async () => {
  const text = globalInput.value;
  if (!text) return;

  await addDoc(collection(db, "globalMessages"), {
    username: auth.currentUser.displayName,
    text,
    createdAt: Date.now()
  });

  globalInput.value = "";
};

// Direct Message
dmSend.onclick = async () => {
  const toUser = dmUser.value.trim();
  const text = dmInput.value;
  if (!toUser || !text) return;

  const from = auth.currentUser.displayName;
  const id = [from, toUser].sort().join("_");

  await addDoc(collection(db, "dms", id, "messages"), {
    from,
    to: toUser,
    text,
    createdAt: Date.now()
  });

  dmInput.value = "";
};

function startDM() {
  const toUser = dmUser.value.trim();
  const from = auth.currentUser.displayName;
  const id = [from, toUser].sort().join("_");

  if (currentDMListener) currentDMListener(); // remove old listener

  const q = query(collection(db, "dms", id, "messages"), orderBy("createdAt", "asc"));
  currentDMListener = onSnapshot(q, snapshot => {
    dmMessages.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "message";
      div.innerText = `${data.from}: ${data.text}`;
      dmMessages.appendChild(div);
    });
  });
}

dmUser.onchange = startDM;
