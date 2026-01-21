import admin from "../Firebase/firebaseAdmin.js"; 
import prisma from "../prismaClient.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    const email = decodedToken.email;
    if (!email) {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { uniEmail: email },
      select: {
        id: true,
        username: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not registered" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email,
      username: user.username,
      role: user.role.name,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;
