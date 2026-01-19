import prisma from "../prismaClient.js";

export const superAdminMiddleware = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.id },
    });

    if (!admin || !admin.isSuperAdmin) {
      return res.status(403).json({ message: "Not authorized: Super Admin only" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
