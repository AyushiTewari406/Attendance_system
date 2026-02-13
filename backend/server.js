const express = require("express");
const cors = require("cors");
require("./db");

const attendanceRoutes = require("./routes/AttendanceRoutes");

const app = express();
const PORT = 5000;

app.use(cors());   // ONLY THIS

app.use(express.json());

app.use("/attendance", attendanceRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
