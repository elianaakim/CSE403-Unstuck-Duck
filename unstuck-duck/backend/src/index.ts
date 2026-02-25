import "dotenv/config";
import express from "express";
import cors from "cors";
import duckRoutes from "./routes/duckRoutes";
import zoomRoutes from "../../app/lib/zoom";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Duck server is quacking!" });
});

// API routes
app.use("/api/duck", duckRoutes);
app.use("/api", duckRoutes);
app.use("/api/zoom", zoomRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Unstuck Duck API running on http://localhost:${PORT}`);
});
