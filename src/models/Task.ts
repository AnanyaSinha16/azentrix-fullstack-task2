import mongoose, { Schema, Document, Model } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  order: number;
  boardId: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date },
    order: { type: Number, default: 0 },
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User" },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

TaskSchema.index({ boardId: 1, status: 1, order: 1 });

const Task: Model<ITask> =
  mongoose.models.Task ?? mongoose.model<ITask>("Task", TaskSchema);

export default Task;
