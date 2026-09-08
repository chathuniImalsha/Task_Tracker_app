const mongoose = require("mongoose");

const taskUpdateSchema = new mongoose.Schema(
  {
    // nullable: a self_task entry may not reference an existing Task
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["update", "blocker", "self_task"],
      required: true,
    },
    content: { type: String, required: true },
    // Once created, interns cannot edit/delete -> enforced at route level,
    // this flag exists so the data model itself documents the rule.
    locked: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("TaskUpdate", taskUpdateSchema);
