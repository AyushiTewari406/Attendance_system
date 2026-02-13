

const mongoose = require("mongoose");
const mongoURL = "mongodb+srv://ayushitewari2024_db_user:SuM2iYjqaVHnESJS@cluster0.ac7zxnm.mongodb.net/attendanceDB";



mongoose.connect(mongoURL)
.then(() => {
    console.log("✅ MongoDB Connected Successfully");
})
.catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
});
