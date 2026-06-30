import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBoard extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Board: Model<IBoard> =
  mongoose.models.Board ?? mongoose.model<IBoard>("Board", BoardSchema);

export default Board;
