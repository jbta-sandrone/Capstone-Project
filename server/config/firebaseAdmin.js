import {
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const REQUIRED_FIREBASE_ADMIN_ENV = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_DATABASE_URL",
];

export function getFirebaseAdminEnvironment(environment = process.env) {
  const missingVariables = REQUIRED_FIREBASE_ADMIN_ENV.filter(
    (name) => !environment[name]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missingVariables.join(", ")}`
    );
  }

  return {
    projectId: environment.FIREBASE_PROJECT_ID,
    clientEmail: environment.FIREBASE_CLIENT_EMAIL,
    privateKey: environment.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    databaseURL: environment.FIREBASE_DATABASE_URL,
  };
}

getFirebaseAdminEnvironment();

export const firebaseAdminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

export const firebaseAuth = getAuth(firebaseAdminApp);
export const firebaseDatabase = getDatabase(firebaseAdminApp);
