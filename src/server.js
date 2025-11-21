import express from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookings.js";
import approveRoutes from "./routes/approvals.js";
import authMiddleware from "./middleware/authMiddleware.js";
import adminMiddleware from "./middleware/adminMiddleware.js";

const app = express();
const PORT = process.env.PORT || 8800;

//Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  console.log("HI");
  res.send(200);
});

app.use("/auth", authRoutes);
app.use("/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/todos", authMiddleware, todoRoutes);
app.use("/bookings", authMiddleware, bookingRoutes);
app.use("/approvals", authMiddleware, approveRoutes);

app.listen(PORT, () => console.log(`Server has started on ${PORT}`));
