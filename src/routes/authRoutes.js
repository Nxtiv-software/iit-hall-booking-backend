import express from "express";
import prisma from "../prismaClient.js";
import admin from "../Firebase/firebaseAdmin.js";

const router = express.Router();

// Login to account
router.post("/login", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) return res.status(400).json({ message: "ID token is required" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) 
      return res.status(401).json({ message: "Invalid token" });

    const user = await prisma.user.findUnique({
      where: { uniEmail: email },
      select: {
        id: true,
        username: true,
        role: { select: { id: true, name: true } },
      },
    });

    if (!user) 
      return res.status(404).json({ message: "User not found" });

    res.json({ user });

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
});


// Register to website
router.post("/register", async (req, res) => {
  const { idToken, roleId } = req.body;

  if (!idToken || !roleId) {
    return res.status(400).json({ message: "ID token and roleId are required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) 
      return res.status(401).json({ message: "Invalid token" });

    const existingUser = await prisma.user.findUnique({ where: { uniEmail: email } });
    if (existingUser) 
      return res.status(409).json({ message: "User already exists" });

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) 
      return res.status(400).json({ message: "Invalid roleId" });

    const user = await prisma.user.create({
      data: {
        uniEmail: email,
        username: email.split("@")[0], 
        role: { connect: { id: roleId } },
      },
      select: { id: true, username: true, role: { select: { id: true, name: true } } },
    });

    res.json({ user, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
});

export default router;
