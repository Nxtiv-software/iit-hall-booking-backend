const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role.toLowerCase() != "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  next();
};

export default adminMiddleware;
