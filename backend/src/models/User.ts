import mongoose, { Schema, Document } from 'mongoose';

// 1. Definir la interfaz para los bloques de disponibilidad
export interface IAvailabilitySlot {
  day: number;
  start: string;
  end: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  timezone: string;
  sleepStart: string; // "HH:MM" local time
  sleepEnd: string;   // "HH:MM" local time
  availability: any[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    timezone: { type: String, required: true, default: 'UTC' },
    sleepStart: { type: String, required: true, default: '23:00' },
    sleepEnd: { type: String, required: true, default: '07:00' },
    availability: [
      {
        day: { type: Number, required: true },
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
