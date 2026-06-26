import admin from "firebase-admin";
import fs from "fs";
import "dotenv/config";

if (process.env.FIREBASE_SECRET_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SECRET_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn("FIREBASE_SECRET_ACCOUNT is not set in environment variables. Firebase Admin SDK is not initialized.");
}
// Trigger restart

export default admin;
