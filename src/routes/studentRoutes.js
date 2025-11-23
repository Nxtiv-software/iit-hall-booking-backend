import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get student profile
router.get("/me", async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.json({ student });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Create student profile
router.post("/me", async (req, res) => {
  try {
    const { 
        iitIdNumber, 
        societyName, 
        societyPosition,
        firstName,
        lastName,
        gender,
        avatarUrl,
        phoneNum,
        uniEmail 
    } = req.body;

    const studentExist = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (studentExist) {
      return res.status(400).json({ message: "Student profile already exists" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        gender,
        avatarUrl,
        phoneNum,
        uniEmail,
      },
    });

    const student = await prisma.student.create({
      data: {
        iitIdNumber,
        societyName,
        societyPosition,
        user: {
          connect: { id: req.user.id },
        },
      },
    });

    res.status(201).json({
      message: "Student profile created successfully",
      student,
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Update student profile
router.put("/me", async (req, res) => {
  try {
    const { 
        iitIdNumber, 
        societyName, 
        societyPosition,
        firstName,
        lastName,
        gender,
        avatarUrl,
        phoneNum,
        uniEmail 
    } = req.body;

    const studentExist = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentExist) {
      return res.status(400).json({ message: "Student profile not found" });
    }

    await prisma.user.update({
        where: { id: req.user.id },
        data: {
            firstName,
            lastName,
            gender,
            avatarUrl,
            phoneNum,
            uniEmail,
        },
    });

    const student = await prisma.student.update({
        where: { userId: req.user.id },
        data: {
            iitIdNumber,
            societyName,
            societyPosition,
        },
    });

    res.json({
      message: "Student profile updated successfully",
      student,
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Delete student profile
router.delete("/me", async (req, res) => {
  try {

    await prisma.student.delete({
      where: { userId: req.user.id },
    });

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.json({
      message: "Student profile and user account deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});


export default router;