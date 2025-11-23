import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

//Get comments of a request by id
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
    res.sendStatus(500).json({ message: error.message });
  }
});

export default router;
