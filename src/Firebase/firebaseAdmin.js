import admin from "firebase-admin";
import fs from "fs";
import "dotenv/config";

const serviceAccount = JSON.parse(process.env.FIREBASE_SECRET_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;
