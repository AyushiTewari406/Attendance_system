import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [status, setStatus] = useState("Present");
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/attendance/all");
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName || !rollNumber) return;

    await axios.post("/attendance/mark", {
      studentName,
      rollNumber,
      status,
    });

    setStudentName("");
    setRollNumber("");
    setStatus("Present");
    fetchRecords();
  };

  // 📊 Stats
  const total = records.length;
  const presentCount = records.filter(r => r.status === "Present").length;
  const absentCount = records.filter(r => r.status === "Absent").length;

  // 🔍 Search Filter
  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <div className="app">
      <div className="dashboard">

        <h1 className="title">Smart Attendance Dashboard</h1>

        {/* Stats Cards */}
        <div className="stats">
          <div className="card">
            <h3>Total</h3>
            <p>{total}</p>
          </div>
          <div className="card present-card">
            <h3>Present</h3>
            <p>{presentCount}</p>
          </div>
          <div className="card absent-card">
            <h3>Absent</h3>
            <p>{absentCount}</p>
          </div>
        </div>

        {/* Form */}
        <form className="form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Roll Number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>

          <button type="submit">
            {loading ? "Adding..." : "Mark"}
          </button>
        </form>

        {/* Search */}
        <input
          className="search"
          type="text"
          placeholder="🔍 Search by name or roll no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr key={rec._id}>
                  <td>{rec.studentName}</td>
                  <td>{rec.rollNumber}</td>
                  <td>
                    <span className={
                      rec.status === "Present"
                        ? "badge present"
                        : "badge absent"
                    }>
                      {rec.status}
                    </span>
                  </td>
                  <td>
                    {new Date(rec.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default App;
