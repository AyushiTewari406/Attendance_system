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
    const records = await Attendance.find().sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

  
    if (!date) {
      const records = await Attendance.find().sort({ date: -1 });
      return res.json(records);
    }

    const selected = new Date(date);
    if (Number.isNaN(selected.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const startOfDay = new Date(selected);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selected);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Batch submit: save attendance for all students for a given date
// POST /attendance/batch  body: { date: "YYYY-MM-DD", records: [{ studentId, status }, ...] }
router.post("/batch", async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "date and records array are required" });
    }

    const selected = new Date(date);
    if (Number.isNaN(selected.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const startOfDay = new Date(selected);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selected);
    endOfDay.setHours(23, 59, 59, 999);

    const saved = [];
    for (const item of records) {
      const studentId = item.studentId;
      const status = item.status || "Absent";
      if (!studentId) continue;

      let record = await Attendance.findOne({
        studentId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (record) {
        record.status = status;
      } else {
        record = new Attendance({
          studentId,
          date: selected,
          status,
        });
      }
      await record.save();
      saved.push(record);
    }

    res.status(201).json({ message: `Attendance saved for ${saved.length} students`, count: saved.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { studentId, date, status, rollNumber, studentName } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ error: "studentId, date and status are required" });
    }

    const selected = new Date(date);
    if (Number.isNaN(selected.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const startOfDay = new Date(selected);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selected);
    endOfDay.setHours(23, 59, 59, 999);

    let record = await Attendance.findOne({
      studentId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const rollVal = (rollNumber != null && rollNumber !== "") ? String(rollNumber) : String(studentId);

    if (record) {
      record.status = status;
      record.rollNumber = rollVal;
      if (studentName != null) record.studentName = studentName;
    } else {
      record = new Attendance({
        studentId,
        date: selected,
        status,
        rollNumber: rollVal,
        studentName: studentName || "",
      });
    }

    await record.save();

    res.status(201).json({ message: "Attendance saved", attendance: record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/today", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/by-student/:rollNumber", async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const records = await Attendance.find({ rollNumber }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

  
    const records = await Attendance.find({ studentId }).sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/range", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "from and to query params are required" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

   
    toDate.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: { $gte: fromDate, $lte: toDate },
    }).sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
