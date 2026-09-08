// Creates demo Supervisor and Intern accounts.
// Run with: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding demo users...");

  const demoUsers = [
    {
      name: "Demo Supervisor",
      email: "supervisor@demo.com",
      password: "Supervisor123!",
      role: "supervisor",
    },
    {
      name: "Demo Intern",
      email: "intern@demo.com",
      password: "Intern123!",
      role: "intern",
    },
  ];

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`Skipped (already exists): ${u.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    await User.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
    });
    console.log(`Created: ${u.email} / ${u.password}`);
  }

  console.log("Done.");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
