import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

router.get("/admin1/pending", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                username: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/admin1-review", async (req, res) => {
  const { action, comment } = req.body;
  const bookingId = parseInt(req.params.id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // create an approval
      const approval = await tx.approval.create({
        data: {
          bookingId,
          approverId: req.user.id,
          action,
          comment,
          level: "admin",
        },
      });

      // update booking
      const newStatus = action === "approved" ? "admin1_approved" : "rejected";
      const updatedBooking = await tx.booking.update({
        where: {
          id: bookingId,
        },
        data: { status: newStatus },
        include: {
          user: {
            select: { id: true, username: true },
          },
          approvals: {
            include: {
              approver: {
                select: { username: true, role: true },
              },
            },
          },
        },
      });

      return { approval, booking: updatedBooking };
    });

    const message =
      action === "approved"
        ? "Booking approved by Admin1. Waiting for Admin2 approval."
        : "Booking rejected by Admin1.";

    res.json({
      message,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/admin2/pending", async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "admin1_approved",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                username: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/admin2-review", async (req, res) => {
  const { action, comment } = req.body;
  const bookingId = parseInt(req.params.id);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const approval = await tx.approval.create({
        data: {
          bookingId,
          approverId: req.user.id,
          action,
          comment,
          level: "admin2",
        },
      });

      const newStatus = action === "approved" ? "admin2_approved" : "rejected";

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
        include: {
          user: {
            select: { id: true, username: true },
          },
          approvals: {
            include: {
              approver: {
                select: { username: true, role: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      return { approval, booking: updatedBooking };
    });
    const message =
      action === "approved"
        ? "Booking fully approved! Student can now use the hall."
        : "Booking rejected by Admin2.";

    res.json({
      message,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
