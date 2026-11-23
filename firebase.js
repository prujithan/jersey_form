const firebaseConfig = {
  apiKey: "AIzaSyDzdxGiPYofqewYlSf6Eoez0iqyDmchbCw",
  authDomain: "jersey-system.firebaseapp.com",
  projectId: "jersey-system",
  storageBucket: "jersey-system.appspot.com",
  messagingSenderId: "276391324849",
  appId: "1:276391324849:web:3fe54ee6caa1abe23bc690"
};

// Initialize Firebase (safe check)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

console.log("Firebase connected");