const express = require("express");
const router = express.Router();
const {
  createIntern,
  listInterns,
  setInternStatus,
} = require("../controllers/userController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

router.use(protect);

router.post("/intern", allowRoles("supervisor"), createIntern);
router.get("/interns", allowRoles("supervisor"), listInterns);
router.patch("/intern/:id/status", allowRoles("supervisor"), setInternStatus);

module.exports = router;
