// js/firebase-config.js

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsmBIaJnwpWh2MoZs0mqsLjVPUn2p22d0",
  authDomain: "cliq-8dba8.firebaseapp.com",
  databaseURL: "https://cliq-8dba8-default-rtdb.firebaseio.com",
  projectId: "cliq-8dba8",
  storageBucket: "cliq-8dba8.firebasestorage.app",
  messagingSenderId: "545738539503",
  appId: "1:545738539503:web:769fe0d6e5bec95df0361a",
  measurementId: "G-406H3PGLZM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();