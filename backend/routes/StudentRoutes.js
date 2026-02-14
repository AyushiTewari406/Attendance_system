const express = require("express");
const router = express.Router();
const Student = require("../models/student");


router.post("/seed", async (req, res) => {
  try {
    const studentsToSeed = Array.from({ length: 20 }).map((_, idx) => ({
      name: `Student ${idx + 1}`,
      rollNumber: idx + 1,
    }));

  
    const operations = studentsToSeed.map((s) => ({
      updateOne: {
        filter: { rollNumber: s.rollNumber },
        update: { $setOnInsert: s },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Student.bulkWrite(operations);
    }

    const allStudents = await Student.find().sort({ rollNumber: 1 });
    res.json({ message: "Students seeded successfully", students: allStudents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ rollNumber: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

