const express = require("express");
const router = express.Router();
const Attendance = require("../models/attendance");

router.post("/mark", async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.status(201).json({ message: "Attendance marked", attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const records = await Attendance.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
