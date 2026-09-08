const express = require("express");
const router = express.Router();
const {
  createUpdate,
  getAllUpdates,
  getMyUpdates,
  blockMutation,
} = require("../controllers/updateController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

router.use(protect);

router.post("/", allowRoles("intern"), createUpdate);
router.get("/my", allowRoles("intern"), getMyUpdates);
router.get("/", allowRoles("supervisor"), getAllUpdates);

// Explicitly forbidden per spec: submissions cannot be edited or deleted
// by anyone (including supervisors), so return 403 rather than 404.
router.patch("/:id", blockMutation);
router.delete("/:id", blockMutation);

module.exports = router;
