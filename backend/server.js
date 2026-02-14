const express = require("express");
const cors = require("cors");
require("./db");

const attendanceRoutes = require("./routes/AttendanceRoutes");
const studentRoutes = require("./routes/StudentRoutes");

const app = express();
const PORT = 5000;

app.use(cors());   

app.use(express.json());

app.use("/attendance", attendanceRoutes);
app.use("/students", studentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
