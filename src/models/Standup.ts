import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStandup extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  yesterday: string;
  today: string;
  blockers: string;
  date: string; // YYYY-MM-DD
  createdAt: Date;
}

const StandupSchema = new Schema<IStandup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    yesterday: { type: String, required: true },
    today: { type: String, required: true },
    blockers: { type: String, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

StandupSchema.index({ userId: 1, date: 1 }, { unique: true });

const Standup: Model<IStandup> =
  mongoose.models.Standup ?? mongoose.model<IStandup>("Standup", StandupSchema);

export default Standup;
