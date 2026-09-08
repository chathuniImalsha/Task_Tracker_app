const express = require("express");
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

router.use(protect);

// Order matters: /my must come before /:id-style routes if any existed.
router.get("/my", allowRoles("intern"), getMyTasks);

router.post("/", allowRoles("supervisor"), createTask);
router.get("/", allowRoles("supervisor"), getAllTasks);
router.patch("/:id", allowRoles("supervisor"), updateTask);
router.delete("/:id", allowRoles("supervisor"), deleteTask);

module.exports = router;
