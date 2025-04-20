import express from "express";
import "dotenv/config";
import { test } from "./scrape";

const app = express();
const PORT = process.env.PORT;

app.get("/", async (_req, res) => {
  res.send("Hello from EMS :)");
});

app.get("/grades", async (_req, res) => {
  const grades = await test();
  res.send(grades);
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
