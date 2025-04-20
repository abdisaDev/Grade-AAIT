import express from "express";
import "dotenv/config";
import cors from "cors";
import { checkGrade } from "./scrape.js";
const app = express();
const PORT = process.env.PORT || 2423;
app.use(express.json());
app.use(cors());
app.get("/", async (_req, res) => {
  res.send("Hello from EMS :)");
});
app.post("/grades", async (_req, res) => {
  const payload = _req.body;
  const grades = await checkGrade(payload);
  res.send(grades);
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
