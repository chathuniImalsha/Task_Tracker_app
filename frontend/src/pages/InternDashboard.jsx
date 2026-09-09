import { useEffect, useState, useMemo, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";

export default function InternDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [form, setForm] = useState({ taskId: "", type: "update", content: "" });
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
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
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const loadData = async () => {
    try {
      setError("");
      const [tasksRes, updatesRes] = await Promise.all([
        api.get("/tasks/my"),
        api.get("/updates/my"),
      ]);

      setTasks(tasksRes.data?.tasks || []);
      setUpdates(updatesRes.data?.updates || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load intern dashboard data");
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

    if (form.type !== "self_task" && !form.taskId) {
      setError("Please select an assigned task for this entry.");
      return;
    }
    if (!form.content.trim()) {
      setError("Please provide the required description or notes.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/updates", {
        taskId: form.type === "self_task" ? null : form.taskId || null,
        type: form.type,
        content: form.content.trim(),
      });

      setForm({ taskId: "", type: "update", content: "" });
      showSuccess("✓ Submission logged successfully. Your entry has been permanently recorded and cannot be modified.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit entry. Please try again.");
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

  // Stats calculation
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

  const formatSubmissionDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${datePart} • ${timePart}`;
  };

  const selectedTaskForUpdate = tasks.find((t) => t._id === form.taskId);

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
      {/* ===================== 1. PAGE HEADER ===================== */}
      <div className="page-header" style={{ marginBottom: "1.75rem" }}>
        <div>
          <h1 className="page-title">Intern Dashboard</h1>
          <p className="page-subtitle" style={{ marginTop: "0.25rem" }}>
            Welcome back, <strong>{user?.name || "Intern"}</strong>. Track your assignments, report blockers, and record daily progress.
          </p>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "var(--bg-surface-subtle)",
            border: "1px solid var(--border-color)",
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            marginTop: "0.6rem"
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Intern Access &bull; Read Only</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => formSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Log New Update</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert-box alert-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{ flex: 1 }}>{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "1.25rem", lineHeight: 1 }}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert-box alert-success" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div style={{ flex: 1 }}>{successMessage}</div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "1.25rem", lineHeight: 1 }}
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* ===================== 2. SUMMARY STATISTICS ===================== */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginBottom: "2rem" }}>
        {/* Card 1: Assigned Tasks */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Assigned Tasks</div>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#eef2ff", color: "#4f46e5" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        {/* Card 3: Blocked Tasks */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#fff1f2", color: "#e11d48" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Card 4: Completed Tasks */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#ecfdf5", color: "#059669" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
        </div>

        {/* Card 5: Submissions */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "var(--accent-purple-light)", color: "var(--accent-purple)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.totalSubmissions}</div>
            <div className="stat-label">Submissions</div>
          </div>
        </div>
      </div>

      {/* ===================== 3. MY ASSIGNED TASKS ===================== */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="card-title">My Assigned Tasks ({tasks.length})</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Tasks assigned by your supervisor are view-only.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-input-wrapper" style={{ minWidth: 200 }}>
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="form-input search-input"
                style={{ padding: "0.45rem 0.75rem 0.45rem 2.2rem", fontSize: "0.8125rem" }}
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem", width: "auto" }}
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

        {/* Empty States for Tasks */}
        {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--bg-surface-subtle)",
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem"
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
              No tasks assigned yet
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.35rem", maxWidth: 460, margin: "0.35rem auto 0" }}>
              Your supervisor will assign tasks here. You can still record self-initiated work below.
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              No matching tasks found
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Try changing your search or status filter.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "1rem" }}
              onClick={() => { setTaskSearch(""); setTaskFilter("all"); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Task Cards Grid */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
            {filteredTasks.map((t) => {
              const overdue = isOverdue(t.dueDate, t.status);
              return (
                <div
                  key={t._id}
                  className="card card-hover"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "1.25rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
                        {t.title}
                      </h3>
                      <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <span className={`badge badge-priority-${t.priority}`}>
                          {t.priority}
                        </span>
                        <span className={`badge badge-${t.status}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {t.description && (
                      <p style={{
                        fontSize: "0.84375rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.45,
                        marginBottom: "0.75rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {t.description}
                      </p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78125rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
                      <div>
                        {t.dueDate ? (
                          <span style={{ color: overdue ? "var(--status-blocked)" : "var(--text-secondary)", fontWeight: overdue ? 700 : 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            {overdue && " (Overdue)"}
                          </span>
                        ) : (
                          <span>No due date assigned</span>
                        )}
                      </div>

                      <div style={{ color: "var(--text-secondary)" }}>
                        Assigned by: <strong>{t.createdBy?.name || "Supervisor"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Read-only actions: View Details and Post Update only */}
                  <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--border-color-subtle)", paddingTop: "0.85rem", marginTop: "0.85rem" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setSelectedTaskDetails(t)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
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

      {/* ===================== 4. TASK DETAILS MODAL (READ-ONLY) ===================== */}
      <Modal
        isOpen={!!selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
        title="Task Details"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedTaskDetails(null)}
          >
            Close
          </button>
        }
      >
        {selectedTaskDetails && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Task Title
              </span>
              <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                {selectedTaskDetails.title}
              </h4>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Description
              </span>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                {selectedTaskDetails.description || "No description provided for this task."}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Priority
                </span>
                <div style={{ marginTop: "0.35rem" }}>
                  <span className={`badge badge-priority-${selectedTaskDetails.priority}`}>
                    {selectedTaskDetails.priority}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Status
                </span>
                <div style={{ marginTop: "0.35rem" }}>
                  <span className={`badge badge-${selectedTaskDetails.status}`}>
                    {selectedTaskDetails.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Due Date
                </span>
                <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 600, marginTop: "0.35rem" }}>
                  {selectedTaskDetails.dueDate
                    ? new Date(selectedTaskDetails.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                    : "No due date set"}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Assigned By
                </span>
                <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 600, marginTop: "0.35rem" }}>
                  {selectedTaskDetails.createdBy?.name || "Supervisor"}
                </div>
              </div>
            </div>

            {selectedTaskDetails.createdAt && (
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Date Assigned
                </span>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {new Date(selectedTaskDetails.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            )}

            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface-subtle)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              marginTop: "0.5rem"
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Supervisor tasks are read-only and cannot be modified or deleted.</span>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== 5 & 6. SUBMISSION FORM ===================== */}
      <div ref={formSectionRef} className="card" style={{ marginBottom: "2rem" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Record Activity &amp; Updates</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Keep your supervisor informed with verified progress updates, blockers, or self-initiated tasks.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Submission Type Switcher (Accessible buttons) */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ marginBottom: "0.5rem" }}>
              Select Submission Type *
            </label>
            <div
              role="radiogroup"
              aria-label="Submission Type"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}
            >
              {/* Type 1: Progress Update */}
              <button
                type="button"
                role="radio"
                aria-checked={form.type === "update"}
                onClick={() => setForm({ ...form, type: "update" })}
                style={{
                  padding: "0.875rem 1rem",
                  textAlign: "left",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${form.type === "update" ? "var(--status-inprogress)" : "var(--border-color)"}`,
                  background: form.type === "update" ? "var(--status-inprogress-bg)" : "white",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: form.type === "update" ? "var(--status-inprogress)" : "var(--bg-surface-subtle)",
                      color: form.type === "update" ? "white" : "var(--text-secondary)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    <span style={{ fontWeight: 700, color: form.type === "update" ? "var(--status-inprogress)" : "var(--text-primary)", fontSize: "0.9375rem" }}>
                      Progress Update
                    </span>
                  </div>
                  {form.type === "update" && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-inprogress)" }}></span>
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", paddingLeft: "2.35rem" }}>
                  Log progress on an assigned task
                </span>
              </button>

              {/* Type 2: Flag a Blocker */}
              <button
                type="button"
                role="radio"
                aria-checked={form.type === "blocker"}
                onClick={() => setForm({ ...form, type: "blocker" })}
                style={{
                  padding: "0.875rem 1rem",
                  textAlign: "left",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${form.type === "blocker" ? "var(--status-blocked)" : "var(--border-color)"}`,
                  background: form.type === "blocker" ? "var(--status-blocked-bg)" : "white",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: form.type === "blocker" ? "var(--status-blocked)" : "var(--bg-surface-subtle)",
                      color: form.type === "blocker" ? "white" : "var(--text-secondary)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </span>
                    <span style={{ fontWeight: 700, color: form.type === "blocker" ? "var(--status-blocked)" : "var(--text-primary)", fontSize: "0.9375rem" }}>
                      Flag a Blocker
                    </span>
                  </div>
                  {form.type === "blocker" && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-blocked)" }}></span>
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", paddingLeft: "2.35rem" }}>
                  Alert supervisor to obstacles or roadblocks
                </span>
              </button>

              {/* Type 3: Self-Logged Task */}
              <button
                type="button"
                role="radio"
                aria-checked={form.type === "self_task"}
                onClick={() => setForm({ ...form, type: "self_task", taskId: "" })}
                style={{
                  padding: "0.875rem 1rem",
                  textAlign: "left",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${form.type === "self_task" ? "var(--accent-purple)" : "var(--border-color)"}`,
                  background: form.type === "self_task" ? "var(--accent-purple-light)" : "white",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: form.type === "self_task" ? "var(--accent-purple)" : "var(--bg-surface-subtle)",
                      color: form.type === "self_task" ? "white" : "var(--text-secondary)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="5"></circle>
                      </svg>
                    </span>
                    <span style={{ fontWeight: 700, color: form.type === "self_task" ? "var(--accent-purple)" : "var(--text-primary)", fontSize: "0.9375rem" }}>
                      Self-Logged Task
                    </span>
                  </div>
                  {form.type === "self_task" && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-purple)" }}></span>
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", paddingLeft: "2.35rem" }}>
                  Record independent or self-initiated work
                </span>
              </button>
            </div>
          </div>

          {/* Related Task Dropdown (Required for Progress Update and Blocker) */}
          {form.type !== "self_task" && (
            <div className="form-group">
              <label className="form-label" htmlFor="intern-select-task">
                Related Task *
              </label>
              <select
                id="intern-select-task"
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
              {selectedTaskForUpdate && (
                <p className="form-hint" style={{ color: "var(--primary)", fontWeight: 600 }}>
                  Selected Task: {selectedTaskForUpdate.title}
                </p>
              )}
            </div>
          )}

          {/* Content Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="intern-content-textarea">
              {form.type === "blocker"
                ? "Blocker Description *"
                : form.type === "self_task"
                  ? "Self-Task Description & Notes *"
                  : "Progress Details & Notes *"}
            </label>
            <textarea
              id="intern-content-textarea"
              className="form-textarea"
              placeholder={
                form.type === "blocker"
                  ? "Describe the impediment, what is preventing you from making progress, and any support required..."
                  : form.type === "self_task"
                    ? "Detail the independent work you completed, research conducted, and outcomes..."
                    : "Describe the progress made, tasks completed today, or notes for your supervisor..."
              }
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {form.content.length} characters
              </span>
            </div>
          </div>

          {/* Submission Immutability Notice */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-surface-subtle)",
            border: "1px solid var(--border-color)",
            marginBottom: "1.25rem",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>
              <strong>Notice:</strong> Once submitted, this entry cannot be edited or deleted.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn ${form.type === "blocker"
              ? "btn-danger"
              : form.type === "self_task"
                ? "btn-primary"
                : "btn-primary"
              }`}
            disabled={submitting}
          >
            {submitting
              ? "Recording Entry..."
              : form.type === "blocker"
                ? "Report Blocker"
                : form.type === "self_task"
                  ? "Submit Self Task"
                  : "Submit Progress Update"}
          </button>
        </form>
      </div>

      {/* ===================== 7. SUBMISSION HISTORY (STRICTLY READ-ONLY) ===================== */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="card-title">My Activity &amp; Submission History ({updates.length})</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Submitted entries are permanently locked and cannot be edited or deleted.
            </p>
          </div>

          <div>
            <select
              className="form-select"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem", width: "auto" }}
              aria-label="Filter submissions by type"
            >
              <option value="all">All Submission Types</option>
              <option value="update">Progress Updates</option>
              <option value="blocker">Blockers</option>
              <option value="self_task">Self-Logged Tasks</option>
            </select>
          </div>
        </div>

        {/* Empty States for Submissions */}
        {updates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--bg-surface-subtle)",
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem"
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
              No submissions yet
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.35rem", maxWidth: 460, margin: "0.35rem auto 0" }}>
              Your progress updates, blockers, and self-logged tasks will appear here after you submit them.
            </p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              No matching submissions found
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Try selecting another submission type filter.
            </p>
          </div>
        ) : (
          /* Submission Timeline List (Strictly Read-Only, No Edit/Delete) */
          <div className="timeline-list">
            {filteredUpdates.map((u) => (
              <div
                key={u._id}
                className={`timeline-item ${u.type === "blocker" ? "is-blocker" : ""}`}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.1rem 1.25rem"
                }}
              >
                <div className="timeline-content-wrapper" style={{ width: "100%" }}>
                  {/* Item Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={`badge badge-type-${u.type}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        {u.type === "update" && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                        {u.type === "blocker" && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        )}
                        {u.type === "self_task" && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="5"></circle>
                          </svg>
                        )}
                        <span>
                          {u.type === "update"
                            ? "Progress Update"
                            : u.type === "blocker"
                              ? "Blocker"
                              : "Self-Logged Task"}
                        </span>
                      </span>
                    </div>

                    {/* Prominent LOCKED Badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: "var(--text-muted)",
                        background: "var(--bg-surface-subtle)",
                        border: "1px solid var(--border-color)",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)"
                      }}
                      title="This submission is immutable and locked"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      LOCKED
                    </span>
                  </div>

                  {/* Related Task Title (if available) */}
                  {u.taskId?.title && (
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                      {u.taskId.title}
                    </div>
                  )}

                  {/* Submission Content */}
                  <p style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    margin: "0.25rem 0 0.5rem"
                  }}>
                    {u.content}
                  </p>

                  {/* Timestamp */}
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{formatSubmissionDate(u.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}