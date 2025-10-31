const express = require("express");
const router = express.Router();
const db = require("../db");
const { refreshCountriesData } = require("../services/dataProcessor");
const { generateSummaryImage } = require("../services/imageService");

// POST /countries/refresh
router.post("/refresh", async (req, res) => {
  try {
    const { totalRecords, timestamp } = await refreshCountriesData();
    res.json({
      message: "Country data successfully refreshed and cached. Summary image generated.",
      total_countries: totalRecords,
      last_refreshed_at: timestamp,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Failed to refresh country data" });
  }
});

// GET /countries (filters & sorting)
if (req.query.sortBy) {
  const order = req.query.order && req.query.order.toLowerCase() === "desc" ? "desc" : "asc";

  if (req.query.sortBy === "estimated_gdp") {
    query = query.orderByRaw("CAST(estimated_gdp AS FLOAT) " + order);
  } else {
    query = query.orderBy(req.query.sortBy, order);
  }
}


// GET /countries/:name
router.get("/:name", async (req, res) => {
  try {
    const country = await db("countries")
      .whereRaw("LOWER(name) = ?", [req.params.name.toLowerCase()])
      .first();
    if (!country) return res.status(404).json({ error: "Country not found" });
    res.json(country);
  } catch (error) {
    console.error("GET /countries/:name error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /countries/:name
router.delete("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const existing = await db("countries")
      .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
      .first();

    if (!existing) return res.status(404).json({ error: "Country not found" });

    await db("countries").whereRaw("LOWER(name) = ?", [name.toLowerCase()]).del();

    const total = await db("countries").count("id as total").first();
    await db("status").where("id", 1).update({
      total_countries: Number(total?.total) || 0,
      last_refreshed_at: new Date(),
    });

    res.json({
      message: `Country '${name}' deleted successfully.`,
      remaining_countries: Number(total?.total) || 0,
    });
  } catch (error) {
    console.error("DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /countries/status
router.get("/status", async (req, res) => {
  try {
    const status = await db("status").first();
    res.json({
      total_countries: Number(status?.total_countries) || 0,
      last_refreshed_at: status?.last_refreshed_at || null,
      cache_status: Number(status?.total_countries) > 0 ? "READY" : "EMPTY",
    });
  } catch (error) {
    console.error("GET /status error:", error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// GET /countries/image
router.get("/image", async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const imagePath = path.join(__dirname, "../public/summary.png");

    if (!fs.existsSync(imagePath)) {
      console.log("Image not found — generating new one...");
      await generateSummaryImage(0, new Date(), []);
    }

    res.setHeader("Content-Type", "image/png");
    const stream = fs.createReadStream(imagePath);
    stream.on("error", (err) => {
      console.error("Error reading image:", err);
      res.status(500).json({ error: "Failed to read summary image" });
    });
    stream.pipe(res);
  } catch (error) {
    console.error("GET /image error:", error);
    res.status(500).json({ error: "Failed to retrieve image" });
  }
});


module.exports = router;
