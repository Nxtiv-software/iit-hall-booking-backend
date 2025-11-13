import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const authMiddleware = async (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //Fetch user with role
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, username: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  next();
  // jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  //   if (err) {
  //     return res.status(401).json({ message: "Invalid token" });
  //   }

  //   // is the token is correct then we modified the incoming req and set the userId and pass the req to the next endpoint
  //   req.userId = decoded.id;
  //   next();
  // });
};

export default authMiddleware;
