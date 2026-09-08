import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function InternDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [form, setForm] = useState({ taskId: "", type: "update", content: "" });
  const [error, setError] = useState("");

  const loadData = async () => {
    const [tasksRes, updatesRes] = await Promise.all([
      api.get("/tasks/my"),
      api.get("/updates/my"),
    ]);
    setTasks(tasksRes.data.tasks);
    setUpdates(updatesRes.data.updates);
  };

  useEffect(() => {
    loadData().catch((e) => setError(e.response?.data?.message || "Load failed"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/updates", {
        taskId: form.type === "self_task" ? null : form.taskId || null,
        type: form.type,
        content: form.content,
      });
      setForm({ taskId: "", type: "update", content: "" });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit");
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 800, margin: "20px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Intern Dashboard</h2>
        <div>
          <span style={{ marginRight: 12 }}>{user?.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginTop: 24 }}>
        <h3>My Tasks ({tasks.length})</h3>
        <ul>
          {tasks.map((t) => (
            <li key={t._id}>
              <strong>{t.title}</strong> — {t.status} — priority: {t.priority}
              {t.dueDate ? ` — due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
              <div style={{ fontSize: 13, color: "#555" }}>{t.description}</div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Submit Update / Self Task</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="update">Progress update</option>
            <option value="blocker">Blocker</option>
            <option value="self_task">Self task entry</option>
          </select>
          {form.type !== "self_task" && (
            <select
              value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              required
            >
              <option value="">Select task...</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}
          <input
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            style={{ flex: 1, minWidth: 200 }}
          />
          <button type="submit">Submit</button>
        </form>
        <p style={{ fontSize: 12, color: "#888" }}>
          Once submitted, entries cannot be edited or deleted.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>My Submission History (read-only)</h3>
        <ul>
          {updates.map((u) => (
            <li key={u._id}>
              [{u.type}] {u.taskId?.title ? `(${u.taskId.title}) ` : ""}
              {u.content} — {new Date(u.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
