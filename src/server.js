import express from "express";
import "dotenv/config";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
// import todoRoutes from "./routes/todoRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import studentRoutes from "./routes/studentRoutes.js"
// import bookingRoutes from "./routes/bookings.js";
// import approveRoutes from "./routes/approvals.js";
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
  res.json("Welcome to IIT Hall Booking");
});

app.use("/auth", authRoutes);
app.use("/users", authMiddleware, userRoutes);
app.use("/students", authMiddleware, studentRoutes);
app.use("/admins", authMiddleware, adminMiddleware, adminRoutes);
// app.use("/todos", authMiddleware, todoRoutes);
// app.use("/bookings", authMiddleware, bookingRoutes);
// app.use("/approvals", authMiddleware, approveRoutes);

app.listen(PORT, () => console.log(`Server has started on ${PORT}`));
