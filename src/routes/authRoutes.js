import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get current user profile
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    return res.json({ user });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

// Register a new user
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  // encrypt the password
  const hashedPassword = bcrypt.hashSync(password, 8);

  //save the new user and hashed password to the db
  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role, // Default to student if not provided
      },
    });

    // create a token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.json({
      token,
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
      select: { id: true, role: true, password: true, username: true },
    });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid Password" });
    }

    // then we have a successful login
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.json({
      token,
      message: "User login successfully",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

export default router;
