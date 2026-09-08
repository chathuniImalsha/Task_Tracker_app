import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newIntern, setNewIntern] = useState({ name: "", email: "", password: "" });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
  });
  const [error, setError] = useState("");

  const loadData = async () => {
    const [internsRes, tasksRes] = await Promise.all([
      api.get("/users/interns"),
      api.get("/tasks"),
    ]);
    setInterns(internsRes.data.interns);
    setTasks(tasksRes.data.tasks);
  };

  useEffect(() => {
    loadData().catch((e) => setError(e.response?.data?.message || "Load failed"));
  }, []);

  const handleAddIntern = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users/intern", newIntern);
      setNewIntern({ name: "", email: "", password: "" });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add intern");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tasks", newTask);
      setNewTask({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    await api.patch(`/tasks/${id}`, { status });
    loadData();
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${id}`);
    loadData();
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Supervisor Dashboard</h2>
        <div>
          <span style={{ marginRight: 12 }}>{user?.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginTop: 24 }}>
        <h3>Add Intern</h3>
        <form onSubmit={handleAddIntern} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Name"
            value={newIntern.name}
            onChange={(e) => setNewIntern({ ...newIntern, name: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={newIntern.email}
            onChange={(e) => setNewIntern({ ...newIntern, email: e.target.value })}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={newIntern.password}
            onChange={(e) => setNewIntern({ ...newIntern, password: e.target.value })}
            required
          />
          <button type="submit">Add Intern</button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Interns ({interns.length})</h3>
        <ul>
          {interns.map((i) => (
            <li key={i._id}>
              {i.name} — {i.email} {i.isActive ? "" : "(deactivated)"}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Create Task</h3>
        <form onSubmit={handleCreateTask} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          />
          <select
            value={newTask.assignedTo}
            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
            required
          >
            <option value="">Assign to...</option>
            {interns.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </select>
          <button type="submit">Create Task</button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>All Tasks ({tasks.length})</h3>
        <table width="100%" cellPadding={6} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
              <th>Title</th>
              <th>Assigned</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t._id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{t.title}</td>
                <td>{t.assignedTo?.name}</td>
                <td>{t.priority}</td>
                <td>
                  <select value={t.status} onChange={(e) => handleUpdateStatus(t._id, e.target.value)}>
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</td>
                <td>
                  <button onClick={() => handleDeleteTask(t._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
