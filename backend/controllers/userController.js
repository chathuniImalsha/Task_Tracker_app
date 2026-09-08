const bcrypt = require("bcryptjs");
const User = require("../models/User");

// POST /api/users/intern  (supervisor only)
exports.createIntern = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const intern = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "intern",
    });

    res.status(201).json({ user: intern });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/users/interns  (supervisor only)
exports.listInterns = async (req, res) => {
  try {
    const interns = await User.find({ role: "intern" }).sort({
      createdAt: -1,
    });
    res.json({ interns });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/users/intern/:id/status  (supervisor only) - activate/deactivate
exports.setInternStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const intern = await User.findOneAndUpdate(
      { _id: req.params.id, role: "intern" },
      { isActive: !!isActive },
      { new: true }
    );
    if (!intern) return res.status(404).json({ message: "Intern not found" });
    res.json({ user: intern });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
