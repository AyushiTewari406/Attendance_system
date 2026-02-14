import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./App.css";

function App() {

  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [status, setStatus] = useState("Present");
  const [records, setRecords] = useState([]);
  const [viewMode, setViewMode] = useState("all"); 
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

 
  const [mainView, setMainView] = useState("dashboard"); 


  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [dateAttendance, setDateAttendance] = useState({}); 
  const [isLocked, setIsLocked] = useState(false); 

 
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);

  const [overviewStats, setOverviewStats] = useState({}); 

  const fetchRecords = async (mode = viewMode) => {
    try {
      setLoading(true);
      let url = "/attendance/all";

      if (mode === "today") {
        url = "/attendance/today";
      }

      const res = await axios.get(url);
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRecords("all");
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await axios.get("/students");
      setStudents(res.data);
    
      await fetchAttendanceByDate(selectedDate);
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this attendance record?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await axios.delete(`/attendance/${id}`);
      await fetchRecords();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const fetchAttendanceByDate = async (dateStr) => {
    try {
      const res = await axios.get(`/attendance?date=${dateStr}`);
      const map = {};
      res.data.forEach((rec) => {
        const key =
          typeof rec.studentId === "string"
            ? rec.studentId
            : rec.studentId && rec.studentId._id
              ? rec.studentId._id
              : null;
        if (key) {
          map[key] = rec.status === "Present" ? "Present" : "Absent";
        }
      });
      setDateAttendance(map);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setIsLocked(false);
    if (newDate) {
      await fetchAttendanceByDate(newDate);
    }
  };

  const toggleAttendance = async (student) => {
    if (!selectedDate || isLocked) return;

    setDateAttendance((prev) => {
      const current = prev[student._id] === "Present" ? "Present" : "Absent";
      const nextStatus = current === "Present" ? "Absent" : "Present";
      return {
        ...prev,
        [student._id]: nextStatus,
      };
    });
  };

  const openHistory = async (student) => {
    try {
      setLoading(true);
      const res = await axios.get(`/attendance/student/${student._id}`);
      setHistoryStudent(student);
      setHistoryRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryStudent(null);
    setHistoryRecords([]);
  };

 
  const loadOverviewStats = async () => {
    if (!students.length) return;

    try {
      setLoading(true);
      const results = await Promise.all(
        students.map(async (student) => {
          const res = await axios.get(`/attendance/student/${student._id}`);
          const records = res.data || [];
          const total = records.length;
          const present = records.filter((r) => r.status === "Present").length;
          const absent = total - present;
          const percent =
            total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
          return {
            studentId: student._id,
            total,
            present,
            absent,
            percent,
          };
        })
      );

      const map = {};
      results.forEach((stat) => {
        map[stat.studentId] = stat;
      });
      setOverviewStats(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const total = records.length;
  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;

  const historyTotal = historyRecords.length;
  const historyPresent = historyRecords.filter(
    (r) => r.status === "Present"
  ).length;
  const historyAbsent = historyTotal - historyPresent;
  const historyPercent =
    historyTotal > 0 ? ((historyPresent / historyTotal) * 100).toFixed(1) : "0.0";

 
  const dayTotal = students.length;
  const dayPresent = students.reduce((count, student) => {
    const status = dateAttendance[student._id] || "Absent";
    return count + (status === "Present" ? 1 : 0);
  }, 0);
  const dayAbsent = dayTotal - dayPresent;
  const dayPercent =
    dayTotal > 0 ? ((dayPresent / dayTotal) * 100).toFixed(1) : "0.0";

  const bulkSetAttendance = async (targetStatus) => {
    if (!selectedDate || isLocked) return;

    setDateAttendance((prev) => {
      const next = { ...prev };
      students.forEach((student) => {
        next[student._id] = targetStatus;
      });
      return next;
    });
  };

  const submitAttendance = async () => {
    if (!selectedDate || isLocked) return;

    try {
      setLoading(true);
      for (const student of students) {
        const status = dateAttendance[student._id] || "Absent";
        await axios.post("/attendance", {
          studentId: String(student._id),
          rollNumber: String(student.rollNumber ?? student._id),
          studentName: student.name || "Student",
          date: selectedDate,
          status,
        });
      }

      setIsLocked(true);
      await fetchAttendanceByDate(selectedDate);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const filteredRecords = useMemo(() => {
    const term = search.toLowerCase();

    return records.filter((r) => {
      const name = (r.studentName || "").toLowerCase();
      const roll = (r.rollNumber || "").toString().toLowerCase();
      return name.includes(term) || roll.includes(term);
    });
  }, [records, search]);

  return (
    <div className="app">
      <div className="dashboard">
        <h1 className="title">Smart Attendance Dashboard</h1>

        {/* Main view switch */}
        <div className="main-tabs">
          <button
            type="button"
            className={mainView === "dashboard" ? "tab active" : "tab"}
            onClick={() => setMainView("dashboard")}
          >
            Summary View
          </button>
          <button
            type="button"
            className={mainView === "datewise" ? "tab active" : "tab"}
            onClick={() => setMainView("datewise")}
          >
            Date-wise Attendance
          </button>
          <button
            type="button"
            className={mainView === "overview" ? "tab active" : "tab"}
            onClick={() => {
              setMainView("overview");
              loadOverviewStats();
            }}
          >
            Students Overview
          </button>
        </div>

        {mainView === "dashboard" && (
          <>
            {/* View Mode Tabs */}
            <div className="tabs">
              <button
                type="button"
                className={viewMode === "all" ? "tab active" : "tab"}
                onClick={() => {
                  setViewMode("all");
                  fetchRecords("all");
                }}
              >
                All Records
              </button>
              <button
                type="button"
                className={viewMode === "today" ? "tab active" : "tab"}
                onClick={() => {
                  setViewMode("today");
                  fetchRecords("today");
                }}
              >
                Today
              </button>
            </div>

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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((rec) => (
                    <tr key={rec._id}>
                      <td>{rec.studentName}</td>
                      <td>{rec.rollNumber}</td>
                      <td>
                        <span
                          className={
                            rec.status === "Present"
                              ? "badge present"
                              : "badge absent"
                          }
                        >
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
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(rec._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {mainView === "datewise" && (
          <>
            <div className="datewise-header">
              <div>
                <label htmlFor="date-input">Select Date:</label>
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
              <div className="datewise-actions">
                <button
                  type="button"
                  className="history-btn"
                  disabled={isLocked}
                  onClick={() => bulkSetAttendance("Present")}
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  disabled={isLocked}
                  onClick={() => bulkSetAttendance("Absent")}
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  disabled={isLocked}
                  onClick={submitAttendance}
                >
                  {isLocked ? "Locked" : "Submit Attendance"}
                </button>
              </div>
            </div>

            <div className="stats datewise-stats">
              <div className="card">
                <h3>Total Students</h3>
                <p>{dayTotal}</p>
              </div>
              <div className="card present-card">
                <h3>Present</h3>
                <p>{dayPresent}</p>
              </div>
              <div className="card absent-card">
                <h3>Absent</h3>
                <p>{dayAbsent}</p>
              </div>
              <div className="card">
                <h3>Attendance %</h3>
                <p>{dayPercent}%</p>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Status</th>
                    <th>Toggle</th>
                    <th>History</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const isPresent =
                      (dateAttendance[student._id] || "Absent") === "Present";
                    return (
                      <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.rollNumber}</td>
                        <td>
                          <span
                            className={
                              isPresent ? "badge present" : "badge absent"
                            }
                          >
                            {isPresent ? "Present" : "Absent"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={
                              isPresent ? "toggle-btn present-btn" : "toggle-btn absent-btn"
                            }
                            disabled={isLocked}
                            onClick={() => toggleAttendance(student)}
                          >
                            {isPresent ? "Mark Absent" : "Mark Present"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="history-btn"
                            onClick={() => openHistory(student)}
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {mainView === "overview" && (
          <>
            <div className="datewise-header">
              <h2>Overall Attendance – All Students</h2>
              <button
                type="button"
                className="history-btn"
                onClick={loadOverviewStats}
              >
                Refresh
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Total Days</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const stats = overviewStats[student._id] || {
                      total: 0,
                      present: 0,
                      absent: 0,
                      percent: "0.0",
                    };
                    return (
                      <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.rollNumber}</td>
                        <td>{stats.total}</td>
                        <td>{stats.present}</td>
                        <td>{stats.absent}</td>
                        <td>{stats.percent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Student history modal */}
      {historyStudent && (
        <div className="modal-backdrop" onClick={closeHistory}>
          <div
            className="modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h2>
              {historyStudent.name} (Roll {historyStudent.rollNumber})
            </h2>

            <div className="history-stats">
              <div className="card">
                <h4>Total Days</h4>
                <p>{historyTotal}</p>
              </div>
              <div className="card present-card">
                <h4>Present</h4>
                <p>{historyPresent}</p>
              </div>
              <div className="card absent-card">
                <h4>Absent</h4>
                <p>{historyAbsent}</p>
              </div>
              <div className="card">
                <h4>Attendance %</h4>
                <p>{historyPercent}%</p>
              </div>
            </div>

            <div className="table-container history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((rec) => (
                    <tr key={rec._id}>
                      <td>
                        {new Date(rec.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span
                          className={
                            rec.status === "Present"
                              ? "badge present"
                              : "badge absent"
                          }
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="close-btn" onClick={closeHistory}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
