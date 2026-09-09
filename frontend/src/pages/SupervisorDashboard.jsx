import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [groupedUpdates, setGroupedUpdates] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "interns" | "updates"
  const [feedGroupBy, setFeedGroupBy] = useState("none"); // "none" | "intern" | "task"

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isInternModalOpen, setIsInternModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Forms state
  const [newIntern, setNewIntern] = useState({ name: "", email: "", password: "" });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
  });

  const [editingTask, setEditingTask] = useState({
    _id: "",
    title: "",
    description: "",
    priority: "medium",
    status: "not_started",
    dueDate: "",
    assignedTo: "",
  });

  // UI status
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const loadData = async () => {
    try {
      setError("");
      const [internsRes, tasksRes] = await Promise.all([
        api.get("/users/interns"),
        api.get("/tasks"),
      ]);

      setInterns(internsRes.data?.interns || []);
      setTasks(tasksRes.data?.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadUpdates = async (groupBy = "none") => {
    try {
      if (groupBy === "none") {
        const res = await api.get("/updates");
        setUpdates(res.data.updates || []);
        setGroupedUpdates(null);
      } else {
        const res = await api.get(`/updates?groupBy=${groupBy}`);
        setGroupedUpdates(res.data.grouped || {});
        setUpdates([]);
      }
    } catch (err) {
      console.warn("Activity updates load failed:", err.message);
    }
  };

  useEffect(() => {
    loadData();
    loadUpdates("none");
  }, []);

  const handleGroupByChange = (groupBy) => {
    setFeedGroupBy(groupBy);
    loadUpdates(groupBy);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalInterns = interns.length;
    const activeInterns = interns.filter((i) => i.isActive).length;
    const totalTasks = tasks.length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    return { totalInterns, activeInterns, totalTasks, inProgressTasks, blockedTasks, completedTasks };
  }, [interns, tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Create Intern
  const handleAddIntern = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/users/intern", newIntern);
      setNewIntern({ name: "", email: "", password: "" });
      setIsInternModalOpen(false);
      showSuccess(`Intern account for ${newIntern.name} created successfully.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add intern");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Intern Active/Deactivated
  const handleToggleInternStatus = async (internId, currentStatus) => {
    try {
      await api.patch(`/users/intern/${internId}/status`, { isActive: !currentStatus });
      showSuccess("Intern status updated.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update intern status");
    }
  };

  // 1. Create & Assign Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/tasks", newTask);
      setNewTask({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
      setIsTaskModalOpen(false);
      showSuccess("Task assigned and created successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Open Edit Task Modal
  const handleOpenEditTask = (task) => {
    setEditingTask({
      _id: task._id,
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      status: task.status || "not_started",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
    });
    setIsEditTaskModalOpen(true);
  };

  // 3. Save Edit Task (Update title, description, priority, status, due date, assignee)
  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask._id) return;
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate || null,
        assignedTo: editingTask.assignedTo,
      };

      await api.patch(`/tasks/${editingTask._id}`, payload);
      setIsEditTaskModalOpen(false);
      showSuccess("Task updated successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Quick Inline Update for status, priority, or due date
  const handleUpdateTaskField = async (taskId, fieldName, value) => {
    try {
      const payload = { [fieldName]: value };
      await api.patch(`/tasks/${taskId}`, payload);

      const fieldLabel =
        fieldName === "dueDate"
          ? "due date"
          : fieldName === "priority"
            ? "priority"
            : fieldName === "status"
              ? "status"
              : fieldName;
      showSuccess(`Task ${fieldLabel} updated successfully.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update task ${fieldName}`);
    }
  };

  // 5. Delete Task
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      setTaskToDelete(null);
      showSuccess("Task removed successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          Loading supervisor dashboard...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Supervisor Dashboard</h1>
          <p className="page-subtitle">
            Oversee interns, delegate assignments, update task details, and review progress submissions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsInternModalOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <span>Add Intern</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create Task</span>
          </button>
        </div>
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

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#e0e7ff", color: "#4338ca" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.totalInterns}</div>
            <div className="stat-label">Interns ({stats.activeInterns} Active)</div>
          </div>
        </div>

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
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">Total Assigned Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#fff1f2", color: "#e11d48" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value" style={{ color: stats.blockedTasks > 0 ? "#e11d48" : "inherit" }}>
              {stats.blockedTasks}
            </div>
            <div className="stat-label">Blocked / Attention Needed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: "#ecfdf5", color: "#059669" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="stat-data">
            <div className="stat-value">{stats.completedTasks}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          type="button"
          className={`tab-button ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <span>Tasks Management</span>
          <span className="tab-count">{tasks.length}</span>
        </button>

        <button
          type="button"
          className={`tab-button ${activeTab === "interns" ? "active" : ""}`}
          onClick={() => setActiveTab("interns")}
        >
          <span>Interns Directory</span>
          <span className="tab-count">{interns.length}</span>
        </button>

        <button
          type="button"
          className={`tab-button ${activeTab === "updates" ? "active" : ""}`}
          onClick={() => setActiveTab("updates")}
        >
          <span>Submissions &amp; Activity Feed</span>
          <span className="tab-count">
            {groupedUpdates
              ? Object.values(groupedUpdates).flat().length
              : updates.length}
          </span>
        </button>
      </div>

      {/* ===================== TAB 1: TASKS ===================== */}
      {activeTab === "tasks" && (
        <div>
          {/* Toolbar */}
          <div className="filter-toolbar">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search tasks by title, description or intern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "auto" }}
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>

              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ width: "auto" }}
                aria-label="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Tasks Table */}
          {filteredTasks.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "1rem", fontWeight: 600 }}>
                No tasks match your filters.
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Try adjusting the search query or create a new task.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => setIsTaskModalOpen(true)}
              >
                + Create Task
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Task Details</th>
                    <th style={{ minWidth: 160 }}>Assigned Intern</th>
                    <th style={{ minWidth: 120 }}>Priority</th>
                    <th style={{ minWidth: 135 }}>Status</th>
                    <th style={{ minWidth: 145 }}>Due Date</th>
                    <th style={{ textAlign: "right", minWidth: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t._id}>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.title}</div>
                        {t.description && (
                          <div
                            style={{
                              fontSize: "0.8125rem",
                              color: "var(--text-secondary)",
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={t.description}
                          >
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {t.assignedTo?.name ? t.assignedTo.name[0].toUpperCase() : "?"}
                          </span>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                              {t.assignedTo?.name || "Unassigned"}
                            </div>
                            {t.assignedTo?.email && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {t.assignedTo.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Quick Inline Priority Updater */}
                      <td>
                        <select
                          className="form-select"
                          value={t.priority}
                          onChange={(e) => handleUpdateTaskField(t._id, "priority", e.target.value)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            width: "auto",
                            borderRadius: "var(--radius-sm)",
                            textTransform: "capitalize",
                            cursor: "pointer",
                            background:
                              t.priority === "high"
                                ? "var(--priority-high-bg)"
                                : t.priority === "low"
                                  ? "var(--priority-low-bg)"
                                  : "var(--priority-med-bg)",
                            color:
                              t.priority === "high"
                                ? "var(--priority-high)"
                                : t.priority === "low"
                                  ? "var(--priority-low)"
                                  : "var(--priority-med)",
                            border: "1px solid var(--border-color)",
                          }}
                          aria-label={`Change priority for ${t.title}`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </td>

                      {/* Quick Inline Status Updater */}
                      <td>
                        <select
                          className="form-select"
                          value={t.status}
                          onChange={(e) => handleUpdateTaskField(t._id, "status", e.target.value)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            width: "auto",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                            background:
                              t.status === "completed"
                                ? "var(--status-completed-bg)"
                                : t.status === "in_progress"
                                  ? "var(--status-inprogress-bg)"
                                  : t.status === "blocked"
                                    ? "var(--status-blocked-bg)"
                                    : "var(--status-notstarted-bg)",
                            color:
                              t.status === "completed"
                                ? "var(--status-completed)"
                                : t.status === "in_progress"
                                  ? "var(--status-inprogress)"
                                  : t.status === "blocked"
                                    ? "var(--status-blocked)"
                                    : "var(--status-notstarted)",
                            border: "1px solid var(--border-color)",
                          }}
                          aria-label={`Change status for ${t.title}`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>

                      {/* Quick Inline Due Date Updater */}
                      <td>
                        <input
                          type="date"
                          className="form-input"
                          value={t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : ""}
                          onChange={(e) => handleUpdateTaskField(t._id, "dueDate", e.target.value)}
                          style={{
                            padding: "0.25rem 0.4rem",
                            fontSize: "0.8125rem",
                            width: "135px",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                          }}
                          title="Click to change due date"
                          aria-label={`Change due date for ${t.title}`}
                        />
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditTask(t)}
                            title="Edit task full details"
                            aria-label={`Edit task ${t.title}`}
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8125rem" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm"
                            onClick={() => setTaskToDelete(t)}
                            title="Delete task"
                            aria-label={`Delete task ${t.title}`}
                            style={{ padding: "0.3rem 0.5rem" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: INTERNS ===================== */}
      {activeTab === "interns" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Total of <strong>{interns.length}</strong> intern accounts registered in the organization.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsInternModalOpen(true)}
            >
              + Add New Intern
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
            {interns.map((i) => {
              const internTaskCount = tasks.filter((t) => t.assignedTo?._id === i._id).length;
              const completedCount = tasks.filter((t) => t.assignedTo?._id === i._id && t.status === "completed").length;

              return (
                <div key={i._id} className="card card-hover" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: i.isActive ? "linear-gradient(135deg, #6366f1, #3b82f6)" : "#cbd5e1",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "1rem"
                        }}>
                          {i.name ? i.name[0].toUpperCase() : "I"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{i.name}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{i.email}</div>
                        </div>
                      </div>

                      <span className={`badge ${i.isActive ? "badge-completed" : "badge-notstarted"}`}>
                        {i.isActive ? "Active" : "Deactivated"}
                      </span>
                    </div>

                    <div style={{
                      display: "flex",
                      gap: "1rem",
                      background: "var(--bg-surface-subtle)",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-md)",
                      margin: "0.75rem 0",
                      fontSize: "0.8125rem"
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{internTaskCount}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Assigned Tasks</div>
                      </div>
                      <div style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "1rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--status-completed)" }}>{completedCount}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Completed</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color-subtle)", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${i.isActive ? "btn-secondary" : "btn-primary"}`}
                      onClick={() => handleToggleInternStatus(i._id, i.isActive)}
                    >
                      {i.isActive ? "Deactivate Access" : "Reactivate Access"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: UPDATES & ACTIVITY ===================== */}
      {activeTab === "updates" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Review immutable daily updates, blockers, and self-logged tasks.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>Group by:</span>
              <button
                type="button"
                className={`btn btn-sm ${feedGroupBy === "none" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleGroupByChange("none")}
              >
                Chronological
              </button>
              <button
                type="button"
                className={`btn btn-sm ${feedGroupBy === "intern" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleGroupByChange("intern")}
              >
                By Intern
              </button>
              <button
                type="button"
                className={`btn btn-sm ${feedGroupBy === "task" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => handleGroupByChange("task")}
              >
                By Task
              </button>
            </div>
          </div>

          {/* Grouped Feed View */}
          {feedGroupBy !== "none" && groupedUpdates ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {Object.keys(groupedUpdates).length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                  <p style={{ color: "var(--text-muted)" }}>No submission entries found.</p>
                </div>
              ) : (
                Object.entries(groupedUpdates).map(([groupName, groupItems]) => (
                  <div key={groupName} className="card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border-color-subtle)", paddingBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {groupName}
                      </h3>
                      <span className="badge badge-completed">{groupItems.length} entries</span>
                    </div>

                    <div className="timeline-list">
                      {groupItems.map((u) => (
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
                            {feedGroupBy !== "task" && u.taskId?.title && (
                              <div className="timeline-task-pill">
                                Task: <strong>{u.taskId.title}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Flat Chronological Feed View */
            <div className="timeline-list">
              {updates.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-muted)" }}>No submissions or updates logged yet.</p>
                </div>
              ) : (
                updates.map((u) => (
                  <div key={u._id} className={`timeline-item ${u.type === "blocker" ? "is-blocker" : ""}`}>
                    <div className="timeline-content-wrapper">
                      <div className="timeline-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span className={`badge badge-type-${u.type}`}>
                            {u.type.replace("_", " ")}
                          </span>
                          <span className="timeline-author">{u.createdBy?.name || "Intern"}</span>
                          {u.createdBy?.email && (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              ({u.createdBy.email})
                            </span>
                          )}
                        </div>
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
                          <span>Assigned Task: <strong>{u.taskId.title}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL: CREATE TASK ===================== */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Assign New Task"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-task-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Assigning..." : "Assign Task"}
            </button>
          </>
        }
      >
        <form id="create-task-form" onSubmit={handleCreateTask}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              className="form-input"
              placeholder="e.g. Implement user authentication endpoints"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description / Objectives</label>
            <textarea
              id="task-desc"
              className="form-textarea"
              placeholder="Detail specifications, acceptance criteria, or links..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Priority Level</label>
              <select
                id="task-priority"
                className="form-select"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-duedate">Due Date</label>
              <input
                id="task-duedate"
                type="date"
                className="form-input"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-assignee">Assign to Intern *</label>
            <select
              id="task-assignee"
              className="form-select"
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              required
            >
              <option value="">Select an intern...</option>
              {interns
                .filter((i) => i.isActive)
                .map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} ({i.email})
                  </option>
                ))}
            </select>
            {interns.filter((i) => i.isActive).length === 0 && (
              <p className="form-hint" style={{ color: "var(--status-blocked)" }}>
                No active interns available. Please add or reactivate an intern first.
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: EDIT TASK ===================== */}
      <Modal
        isOpen={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        title="Edit Task"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditTaskModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-task-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </>
        }
      >
        <form id="edit-task-form" onSubmit={handleSaveEditTask}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-task-title">Task Title *</label>
            <input
              id="edit-task-title"
              type="text"
              className="form-input"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-task-desc">Description / Objectives</label>
            <textarea
              id="edit-task-desc"
              className="form-textarea"
              value={editingTask.description}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-task-priority">Priority Level</label>
              <select
                id="edit-task-priority"
                className="form-select"
                value={editingTask.priority}
                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-task-status">Status</label>
              <select
                id="edit-task-status"
                className="form-select"
                value={editingTask.status}
                onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-task-duedate">Due Date</label>
              <input
                id="edit-task-duedate"
                type="date"
                className="form-input"
                value={editingTask.dueDate}
                onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-task-assignee">Assign / Reassign Intern *</label>
              <select
                id="edit-task-assignee"
                className="form-select"
                value={editingTask.assignedTo}
                onChange={(e) => setEditingTask({ ...editingTask, assignedTo: e.target.value })}
                required
              >
                <option value="">Select an intern...</option>
                {interns
                  .filter((i) => i.isActive)
                  .map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.email})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: ADD INTERN ===================== */}
      <Modal
        isOpen={isInternModalOpen}
        onClose={() => setIsInternModalOpen(false)}
        title="Register Intern Account"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsInternModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-intern-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Registering..." : "Create Account"}
            </button>
          </>
        }
      >
        <form id="add-intern-form" onSubmit={handleAddIntern}>
          <div className="form-group">
            <label className="form-label" htmlFor="intern-name">Full Name *</label>
            <input
              id="intern-name"
              type="text"
              className="form-input"
              placeholder="e.g. Alex Morgan"
              value={newIntern.name}
              onChange={(e) => setNewIntern({ ...newIntern, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="intern-email">Email Address *</label>
            <input
              id="intern-email"
              type="email"
              className="form-input"
              placeholder="alex@company.com"
              value={newIntern.email}
              onChange={(e) => setNewIntern({ ...newIntern, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="intern-password">Initial Password *</label>
            <input
              id="intern-password"
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={newIntern.password}
              onChange={(e) => setNewIntern({ ...newIntern, password: e.target.value })}
              required
            />
            <p className="form-hint">
              The intern will use this password to sign into their portal.
            </p>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: CONFIRM DELETE TASK ===================== */}
      <Modal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task Confirmation"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setTaskToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmDeleteTask}
            >
              Delete Task
            </button>
          </>
        }
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Are you sure you want to delete the task:{" "}
          <strong style={{ color: "var(--text-primary)" }}>{taskToDelete?.title}</strong>?
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
          This action will permanently remove the assignment from the intern's dashboard.
        </p>
      </Modal>
    </div>
  );
}
