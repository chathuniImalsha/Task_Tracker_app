import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function InternDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [form, setForm] = useState({ taskId: "", type: "update", content: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [taskFilter, setTaskFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  const formSectionRef = useRef(null);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const loadData = async () => {
    try {
      setError("");
      const [tasksRes, updatesRes] = await Promise.all([
        api.get("/tasks/my"),
        api.get("/updates/my"),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setUpdates(updatesRes.data.updates || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/updates", {
        taskId: form.type === "self_task" ? null : form.taskId || null,
        type: form.type,
        content: form.content,
      });
      setForm({ taskId: "", type: "update", content: "" });
      showSuccess("Your update has been permanently logged to the system.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickUpdate = (task) => {
    setForm({
      taskId: task._id,
      type: "update",
      content: "",
    });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const totalSubmissions = updates.length;
    return { total, inProgress, blocked, completed, totalSubmissions };
  }, [tasks, updates]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title?.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(taskSearch.toLowerCase());
      const matchFilter = taskFilter === "all" || t.status === taskFilter;
      return matchSearch && matchFilter;
    });
  }, [tasks, taskSearch, taskFilter]);

  // Filtered Submission History
  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      if (historyFilter === "all") return true;
      return u.type === historyFilter;
    });
  }, [updates, historyFilter]);

  const isOverdue = (dueDateStr, status) => {
    if (!dueDateStr || status === "completed") return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          Loading your intern dashboard...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Intern Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.name}</strong>. Track your assignments, log blockers, and record daily progress.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => formSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Log New Update</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert-box alert-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>&times;</button>
        </div>
      )}

      {successMessage && (
        <div className="alert-box alert-success" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>{successMessage}</div>
        </div>
      )}

      {/* Summary Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Assigned Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#e0e7ff", color: "#4338ca" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#fff1f2", color: "#e11d48" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value" style={{ color: stats.blocked > 0 ? "#e11d48" : "inherit" }}>
              {stats.blocked}
            </div>
            <div className="stat-label">Blocked Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#ecfdf5", color: "#059669" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
        </div>
      </div>

      {/* ===================== SECTION 1: MY TASKS ===================== */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="card-title">My Assigned Tasks ({tasks.length})</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Tasks delegated by your supervisor.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-input-wrapper" style={{ minWidth: 180 }}>
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="form-input search-input"
                style={{ padding: "0.4rem 0.75rem 0.4rem 2rem", fontSize: "0.8125rem" }}
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem", width: "auto" }}
              aria-label="Filter tasks by status"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              {tasks.length === 0 ? "No tasks assigned to you yet." : "No tasks match your filter."}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: 4 }}>
              {tasks.length === 0
                ? "Your supervisor will assign tasks here. In the meantime, you can log self-task entries."
                : "Try clearing your search or status filter."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {filteredTasks.map((t) => {
              const overdue = isOverdue(t.dueDate, t.status);
              return (
                <div
                  key={t._id}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    background: "var(--bg-surface-subtle)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9375rem" }}>
                        {t.title}
                      </span>
                      <span className={`badge badge-priority-${t.priority}`}>
                        {t.priority}
                      </span>
                      <span className={`badge badge-${t.status}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>

                    {t.description && (
                      <p style={{ fontSize: "0.84375rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                        {t.description}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {t.dueDate && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span style={{ color: overdue ? "var(--status-blocked)" : "inherit", fontWeight: overdue ? 700 : 500 }}>
                            Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            {overdue && " (Overdue)"}
                          </span>
                        </div>
                      )}
                      {t.createdBy?.name && (
                        <span>Assigned by: <strong>{t.createdBy.name}</strong></span>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickUpdate(t)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      <span>Post Update</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== SECTION 2: SUBMIT UPDATE FORM ===================== */}
      <div ref={formSectionRef} className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Log Activity, Blocker or Self Task</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Keep your supervisor in the loop. Submissions are permanently saved to maintain an accurate record.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Submission Type Switcher */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="form-label">Type of Entry</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              <div
                onClick={() => setForm({ ...form, type: "update" })}
                style={{
                  padding: "0.875rem",
                  border: `2px solid ${form.type === "update" ? "var(--primary)" : "var(--border-color)"}`,
                  background: form.type === "update" ? "var(--primary-light)" : "white",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)"
                }}
              >
                <div style={{ fontWeight: 700, color: form.type === "update" ? "var(--primary)" : "var(--text-primary)", fontSize: "0.875rem" }}>
                  Progress Update
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  Log progress on an assigned task
                </div>
              </div>

              <div
                onClick={() => setForm({ ...form, type: "blocker" })}
                style={{
                  padding: "0.875rem",
                  border: `2px solid ${form.type === "blocker" ? "var(--status-blocked)" : "var(--border-color)"}`,
                  background: form.type === "blocker" ? "var(--status-blocked-bg)" : "white",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)"
                }}
              >
                <div style={{ fontWeight: 700, color: form.type === "blocker" ? "var(--status-blocked)" : "var(--text-primary)", fontSize: "0.875rem" }}>
                  Flag a Blocker
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  Alert supervisor to obstacles or roadblocks
                </div>
              </div>

              <div
                onClick={() => setForm({ ...form, type: "self_task", taskId: "" })}
                style={{
                  padding: "0.875rem",
                  border: `2px solid ${form.type === "self_task" ? "var(--accent-purple)" : "var(--border-color)"}`,
                  background: form.type === "self_task" ? "var(--accent-purple-light)" : "white",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)"
                }}
              >
                <div style={{ fontWeight: 700, color: form.type === "self_task" ? "var(--accent-purple)" : "var(--text-primary)", fontSize: "0.875rem" }}>
                  Self-Logged Task
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  Independent work or self-initiated tasks
                </div>
              </div>
            </div>
          </div>

          {/* Related Task Dropdown (if not self_task) */}
          {form.type !== "self_task" && (
            <div className="form-group">
              <label className="form-label" htmlFor="select-assigned-task">
                Related Task *
              </label>
              <select
                id="select-assigned-task"
                className="form-select"
                value={form.taskId}
                onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                required
              >
                <option value="">Select an assigned task...</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.status.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Content input */}
          <div className="form-group">
            <label className="form-label" htmlFor="update-content">
              {form.type === "blocker"
                ? "Describe the issue or blocker *"
                : form.type === "self_task"
                ? "Describe the self-initiated work done *"
                : "Progress Details & Notes *"}
            </label>
            <textarea
              id="update-content"
              className="form-textarea"
              placeholder={
                form.type === "blocker"
                  ? "Describe what is impeding your progress and what help or approval you need..."
                  : form.type === "self_task"
                  ? "Describe what you worked on, milestones achieved, or links to references..."
                  : "Detail what milestones or code changes were completed today..."
              }
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
              <span className="form-hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 3 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Submissions are immutable per system policy and cannot be altered once logged.
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {form.content.length} characters
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Logging Entry..." : "Submit to Supervisor"}
          </button>
        </form>
      </div>

      {/* ===================== SECTION 3: MY SUBMISSIONS HISTORY ===================== */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="card-title">My Activity &amp; Submission History ({updates.length})</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 2 }}>
              A verifiable chronological timeline of your submitted entries.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select
              className="form-select"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem", width: "auto" }}
              aria-label="Filter submissions by type"
            >
              <option value="all">All Submission Types</option>
              <option value="update">Progress Updates</option>
              <option value="blocker">Blockers</option>
              <option value="self_task">Self-Logged Tasks</option>
            </select>
          </div>
        </div>

        {filteredUpdates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              No submissions recorded yet.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: 4 }}>
              When you submit progress updates or blockers, they will appear in this timeline.
            </p>
          </div>
        ) : (
          <div className="timeline-list">
            {filteredUpdates.map((u) => (
              <div key={u._id} className={`timeline-item ${u.type === "blocker" ? "is-blocker" : ""}`}>
                <div className="timeline-content-wrapper">
                  <div className="timeline-header">
                    <span className={`badge badge-type-${u.type}`}>
                      {u.type.replace("_", " ")}
                    </span>
                    <span className="timeline-time">
                      {new Date(u.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="timeline-text">{u.content}</p>

                  {u.taskId?.title && (
                    <div className="timeline-task-pill">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span>Task: <strong>{u.taskId.title}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}