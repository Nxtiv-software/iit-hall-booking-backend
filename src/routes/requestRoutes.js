import express from "express";
import prisma from "../prismaClient.js";
import { upload, uploadToS3, s3 } from "../middleware/uploadMiddleware.js";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

//Helper function to get the url of the document
async function getSignedUrlV3(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
}

//Get all requests
router.get("/", async (req, res) => {
  try {
    const requests = await prisma.request.findMany();

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Get a specific request by ID
router.get("/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        venue: {
          include: {
            building: true,
          },
        },
        status: true,
        requestSlots: {
          include: {
            timeSlot: true,
          },
        },
        attachments: true,
        approvals: {
          include: {
            admin: {
              include: {
                user: true,
                building: true,
                department: true,
              },
            },
            status: true,
          },
          orderBy: {
            adminLevel: "asc",
          },
        },
        bookings: {
          include: {
            admin: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Add signed URLs for attachments if any
    if (request.attachments && request.attachments.length > 0) {
      request.attachments = await Promise.all(
        request.attachments.map(async (att) => ({
          ...att,
          previewUrl: await getSignedUrlV3(att.fileName),
        })),
      );
    }

    return res.json(request);
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
              include: { user: true },
            },
            venue: true,
            status: true,
          },
        },
      },
    });

    const attachmentsWithPreview = await Promise.all(
      attachments.map(async (att) => ({
        ...att,
        previewUrl: await getSignedUrlV3(att.fileName),
      })),
    );

    return res.json(attachmentsWithPreview);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Post an attachment by request id
router.post(
  "/:requestId/attachments",
  upload.single("file"),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "File is required" });
      }

      const key = await uploadToS3(file);

      const attachment = await prisma.attachment.create({
        data: {
          requestId,
          fileName: key,
          realName: file.originalname,
          fileSize: file.size.toString(),
          mimeType: file.mimetype,
        },
      });

      attachment.previewUrl = await getSignedUrlV3(attachment.fileName);

      return res
        .status(201)
        .json({ message: "File uploaded successfully", attachment });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

//Get an attachment by request id
router.get("/:requestId/attachments/:attachmentId", async (req, res) => {
  try {
    const { requestId, attachmentId } = req.params;

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        requestId: requestId,
      },
      include: {
        request: {
          include: {
            student: {
              include: { user: true },
            },
            venue: true,
            status: true,
          },
        },
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    attachment.previewUrl = await getSignedUrlV3(attachment.fileName);

    return res.json(attachment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//Delete an attachment
router.delete("/:requestId/attachments/:attachmentId", async (req, res) => {
  try {
    const { requestId, attachmentId } = req.params;

    const exists = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        requestId: requestId,
      },
    });

    if (!exists) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Delete from s3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: exists.fileName,
      }),
    );

    // Delete from db
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get full approval history
router.get("/:requestId/approvals", async (req, res) => {
  try {
    const { requestId } = req.params;

    const approvals = await prisma.approval.findMany({
      where: { requestId },
      include: {
        status: true,
        admin: { 
          include: { 
            user: true, 
          } 
        },
      },
    });

    return res.json(approvals);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
