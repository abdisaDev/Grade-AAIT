import express from "express";
import cors from "cors";
import { scrapeGrades } from "./scrape";
const app = express();
const port = 2423;
app.use(cors());
app.use(express.json());
app.post("/scrape", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }
    try {
        console.log(`[Server] Received scrape request for user: ${username}`);
        const grades = await scrapeGrades(username, password);
        console.log("[Server] Scraping successful, sending data.");
        res.json(grades);
    }
    catch (error) {
        console.error("[Server] Scraping failed:", error.message);
        res
            .status(500)
            .json({ error: "Failed to scrape grades. " + error.message });
    }
});
app.listen(port, () => {
    console.log(`[Server] Listening on http://localhost:${port}`);
});
