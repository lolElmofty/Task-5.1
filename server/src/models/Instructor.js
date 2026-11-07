import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Instructor Portal account.
// Passwords are hashed with bcrypt. Secret fields are excluded from queries
// by default (select: false) and must be requested explicitly.
const instructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    department: { type: String },
    role: { type: String, enum: ['instructor', 'superadmin'], default: 'instructor' },

    apiKey: { type: String, select: false },
    privateEmail: { type: String, select: false },
    privatePhone: { type: String, select: false }
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed.
instructorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export const Instructor = mongoose.model('Instructor', instructorSchema);