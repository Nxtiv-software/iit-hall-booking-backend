// import fs from "fs";

// let env = fs.readFileSync(".env", "utf-8");
// env = env.replace(/FIREBASE_SECRET_ACCOUNT=.*/s, "");
// const jsonStr = fs.readFileSync("./src/Firebase/iit-hallbooking-firebase-adminsdk-fbsvc-c0431956fd.json", "utf-8");
// const jsonObj = JSON.parse(jsonStr);
// const singleLineJson = JSON.stringify(jsonObj);

// env += `\nFIREBASE_SECRET_ACCOUNT='${singleLineJson}'\n`;
// fs.writeFileSync(".env", env.trim() + "\n");
// console.log("Fixed FIREBASE_SECRET_ACCOUNT in .env as single line");
