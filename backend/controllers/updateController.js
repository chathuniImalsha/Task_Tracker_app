const TaskUpdate = require("../models/TaskUpdate");

// POST /api/updates  (intern only) - submit progress update, blocker, or self task
exports.createUpdate = async (req, res) => {
  try {
    const { taskId, type, content } = req.body;
    if (!type || !content) {
      return res.status(400).json({ message: "type and content are required" });
    }
    if (!["update", "blocker", "self_task"].includes(type)) {
      return res.status(400).json({ message: "Invalid update type" });
    }

    const update = await TaskUpdate.create({
      taskId: taskId || null,
      createdBy: req.user._id,
      type,
      content,
      locked: true, // immutable once submitted, per spec
    });

    res.status(201).json({ update });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/updates  (supervisor only) - all submissions, optionally grouped
exports.getAllUpdates = async (req, res) => {
  try {
    const { groupBy } = req.query; // "intern" | "task" | undefined
    const updates = await TaskUpdate.find()
      .populate("createdBy", "name email")
      .populate("taskId", "title")
      .sort({ createdAt: -1 });

    if (groupBy === "intern") {
      const grouped = {};
      updates.forEach((u) => {
        const key = u.createdBy?.name || "Unknown";
        grouped[key] = grouped[key] || [];
        grouped[key].push(u);
      });
      return res.json({ grouped });
    }

    if (groupBy === "task") {
      const grouped = {};
      updates.forEach((u) => {
        const key = u.taskId?.title || "Self Task / No Task";
        grouped[key] = grouped[key] || [];
        grouped[key].push(u);
      });
      return res.json({ grouped });
    }

    res.json({ updates });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/updates/my  (intern only) - own submission history, read-only
exports.getMyUpdates = async (req, res) => {
  try {
    const updates = await TaskUpdate.find({ createdBy: req.user._id })
      .populate("taskId", "title")
      .sort({ createdAt: -1 });
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH/DELETE /api/updates/:id - explicitly forbidden for everyone.
// Submissions are immutable by design; route exists only to return 403
// instead of 404, per the project brief.
exports.blockMutation = (req, res) => {
  res.status(403).json({
    message: "Task updates are immutable and cannot be edited or deleted",
  });
};
