const database = firebase.database();

// Optional connection smoke test. Writes require Firebase Auth under the current rules.
if (firebase.auth && firebase.auth().currentUser) {
  database.ref("test")
    .set({ message: "Firebase is connected!" })
    .catch((error) => {
      console.error('Firebase write failed: connection smoke test at "test"', error);
    });
} else {
  console.warn('Firebase write skipped: connection smoke test at "test" requires an authenticated Firebase user.');
}
