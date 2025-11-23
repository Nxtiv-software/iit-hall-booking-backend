import express from "express";
import prisma from "../prismaClient.js";
import upload from "../middleware/uploadMiddleware.js";
import fs from "fs";

const router = express.Router();

//Get all requests
router.get("/", async (req, res) => {
  try {
    const requests = await prisma.request.findMany();

    res.json(requests);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

//Get all attachments by request id
router.get("/:requestId/attachments", async (req, res) => {
  try {
    const { requestId } = req.params;

    const attachments = await prisma.attachment.findMany({
        where: { requestId: requestId },
        include: {
            request: {
                include: {
                    student: {
                        include: { user: true }
                    },
                    venue: true,
                    status: true,
                }
            },
        }
    });

    // Add preview URL
    const host = req.protocol + "://" + req.get("host"); // e.g., http://localhost:8800
    const attachmentsWithPreview = attachments.map(att => ({
      ...att,
      previewUrl: host + "/" + att.filePath.replace(/\\/g, "/"),
    }));

    res.json(attachmentsWithPreview);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

//Post an attachment by request id
router.get("/:requestId/attachments", upload.single("file"), async (req, res) => {
  try {
    const { requestId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        requestId,
        filePath: file.path,           // local server path
        fileName: file.filename,       // unique filename on server
        realName: file.originalname,   // original uploaded filename
        fileSize: file.size.toString(),// file size in bytes
        mimeType: file.mimetype,       // mime type (e.g., image/png)
      },
    });

    res.json({
      message: "File uploaded and saved in database successfully",
      attachment,
    });
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

//Get an attachment by request id
router.get("/:requestId/attachments/:attachmentId", async (req, res) => {
  try {
    const { requestId, attachmentId } = req.params;

    const attachment = await prisma.attachment.findFirst({
        where: { 
            id: attachmentId,
            requestId: requestId
        },
        include: {
            request: {
                include: {
                    student: {
                        include: { user: true }
                    },
                    venue: true,
                    status: true,
                }
            },
        }
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const host = req.protocol + "://" + req.get("host");
    attachment.previewUrl = host + "/" + attachment.filePath.replace(/\\/g, "/");

    res.json(attachment);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500).json({ message: error.message });
  }
});

// //Update an attachment
// router.put("/:requestId/attachments/:attachmentId", async (req, res) => {
//   try {
//     const { requestId, attachmentId } = req.params;
//     const { url } = req.body;

//     const exists = await prisma.attachment.findFirst({
//         where: { 
//             id: attachmentId, 
//             requestId: requestId 
//         },
//     });

//     if (!exists) {
//       return res.status(404).json({ message: "Attachment not found" });
//     }

//     const updated = await prisma.attachment.update({
//       where: { id: attachmentId },
//       data: { url },
//     });

//     res.json(updated);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: error.message });
//   }
// });

//Delete an attachment
router.delete("/:requestId/attachments/:attachmentId", async (req, res) => {
  try {
    const { requestId, attachmentId } = req.params;

    const exists = await prisma.attachment.findFirst({
        where: { 
            id: attachmentId, 
            requestId: requestId 
        },
    });

    if (!exists) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    if (exists.filePath) {
      fs.unlink(exists.filePath, err => {
        if (err) console.error("Failed to delete file:", err);
      });
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
