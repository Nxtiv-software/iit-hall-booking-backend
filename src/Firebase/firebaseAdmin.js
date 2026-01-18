import admin from "firebase-admin";
import fs from "fs";

// Make sure the path points correctly to your JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("./iit-hallbooking-firebase-adminsdk-fbsvc-c0431956fd.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;
