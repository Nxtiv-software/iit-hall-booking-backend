import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get admin profile
router.get("/me", async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }

    res.json({ admin });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Create admin profile
router.post("/me", async (req, res) => {
  try {
    const { 
      adminLevel,
      firstName,
      lastName,
      gender,
      avatarUrl,
      phoneNum,
      uniEmail,
    } = req.body;

    const adminExist = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (adminExist) {
      return res.status(400).json({ message: "Admin profile already exists" });
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

    const admin = await prisma.admin.create({
      data: {
        adminLevel,
        user: {
          connect: { id: req.user.id },
        },
      },
    });

    res.status(201).json({
      message: "Admin profile created successfully",
      admin,
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Update admin profile
router.put("/me", async (req, res) => {
  try {
    const { 
      adminLevel,
      firstName,
      lastName,
      gender,
      avatarUrl,
      phoneNum,
      uniEmail,
     } = req.body;

    const adminExist = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (!adminExist) {
      return res.status(400).json({ message: "Admin profile not found" });
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

    const admin = await prisma.admin.update({
        where: { userId: req.user.id },
        data: {
            adminLevel,
        },
    });

    res.json({
      message: "Admin profile updated successfully",
      admin,
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Delete admin profile
router.delete("/me", async (req, res) => {
  try {

    await prisma.admin.delete({
      where: { userId: req.user.id },
    });

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.json({
      message: "Admin profile and user account deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503);
  }
});

//Get all comments for request
router.get("/requests/:requestId/comments", async (req, res) => {
  try {
    const { requestId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { requestId },
      include: {
        admin: { 
          include: { user: true } 
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return res.json(comments);

  } catch (error) {
    console.log(error.message);
    res.sendStatus(503); 
  }
});

//Create comment for request by a admin
router.post("/requests/:requestId/comments", async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }
    
    const { requestId } = req.params;
    const { commentText } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required." });
    }

    const newComment = await prisma.comment.create({
      data: {
        adminId: admin.id,
        requestId,
        commentText,
      }
    })
    return res.status(201).json(newComment);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(503); 
  }
});

// Update a comment for request by a admin
router.put("/requests/:requestId/comments/:commentId", async (req, res) => {
  try {
    const { requestId, commentId } = req.params;
    const { commentText } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ message: "commentText is required." });
    }

    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (existing.requestId !== requestId) {
      return res.status(400).json({ 
        message: "This comment does not belong to the given requestId." 
      });
    }

    if (existing.adminId !== admin.id) {
      return res.status(403).json({ message: "You cannot edit another admin's comment" });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { commentText: commentText.trim() },
    });

    return res.json(updated);
  } catch (error) {
    console.log(error.message);
    return res.sendStatus(503);
  }
});

// Delete a comment for request by a admin
router.delete("/requests/:requestId/comments/:commentId", async (req, res) => {
  try {
    const { requestId, commentId } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (existing.requestId !== requestId) {
      return res.status(400).json({
        message: "This comment does not belong to the given requestId.",
      });
    }

    if (existing.adminId !== admin.id) {
      return res.status(403).json({
        message: "You cannot delete another admin's comment",
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.json({ message: "Comment deleted successfully" });

  } catch (error) {
    console.log(error.message);
    return res.sendStatus(503);
  }
});



export default router;
