import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  const { username, password, roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ message: "roleId is required" });
  }

  // encrypt the password
  const hashedPassword = bcrypt.hashSync(password, 8);

  //save the new user and hashed password to the db
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return res.status(400).json({ message: "Invalid roleId" });
    }

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: {
          connect: { id: role.id },
        },
      },
    });

    // create a token
    const token = jwt.sign(
      { id: user.id, roleId: user.roleId },
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
        roleId: user.roleId,
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
      select: { 
        id: true, 
        roleId: true, 
        password: true, 
        username: true,
        role: {  // include role name
          select: { 
            id: true, 
            name: true 
          }
        }
      },
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
      { id: user.id, roleId: user.roleId },
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
        roleId: user.roleId,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

export default router;
