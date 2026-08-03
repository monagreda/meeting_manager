import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailabilitySlot {
  day: number; // 0 = Lunes, 6 = Domingo
  start: string; // "HH:MM" local time
  end: string;   // "HH:MM" local time
}

export interface ISchedule extends Document {
  userId: mongoose.Types.ObjectId;
  weeklyAvailability: IAvailabilitySlot[];
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySlotSchema = new Schema({
  day: { type: Number, required: true, min: 0, max: 6 },
  start: { type: String, required: true }, // "HH:MM"
  end: { type: String, required: true },   // "HH:MM"
}, { _id: false });

const ScheduleSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    weeklyAvailability: { type: [AvailabilitySlotSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema);
