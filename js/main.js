const database = firebase.database();

// Create a test entry
database.ref("test").set({ message: "Firebase is connected!" });