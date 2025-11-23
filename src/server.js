import express from "express";
import "dotenv/config";
import cors from "cors";

//API route imports
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js"
import requestRoutes from "./routes/requestRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import timeSlotRoutes from "./routes/timeSlotRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";

//Middleware imports
import authMiddleware from "./middleware/authMiddleware.js";
import adminMiddleware from "./middleware/adminMiddleware.js";

import { seedDatabase } from "./seed.js";

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
app.use("/comments", authMiddleware, commentRoutes);
app.use("/bookings", authMiddleware, bookingRoutes);
app.use("/requests", authMiddleware, requestRoutes);
app.use("/roles", roleRoutes);
app.use("/statuses", statusRoutes);
app.use("/time-slots", timeSlotRoutes);
app.use("/logs", logRoutes);
app.use("/resources", resourceRoutes);
app.use("/venues", venueRoutes);

//Seeding data before starting the roles
async function startServer() {
  await seedDatabase();

  app.listen(PORT, () => console.log(`Server has started on ${PORT}`));
}

startServer();
