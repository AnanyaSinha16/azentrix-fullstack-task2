import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  entity: string; // "task" | "board" | "user" | "standup"
  entityId?: string;
  entityName?: string;
  boardId?: string;
  boardName?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    entityName: { type: String },
    boardId: { type: String },
    boardName: { type: String },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ??
  mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
