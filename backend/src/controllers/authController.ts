import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_meeting_manager_2026';

// Helper to generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, timezone, sleepStart, sleepEnd } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email and password are required.' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({ error: 'Username or email already in use.' });
      return;
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create user
    const newUser = new User({
      username,
      email,
      passwordHash,
      timezone: timezone || 'UTC',
      sleepStart: sleepStart || '23:00',
      sleepEnd: sleepEnd || '07:00',
    });

    const savedUser = await newUser.save();

    // Create empty availability schedule for the user
    const newSchedule = new Schedule({
      userId: savedUser._id,
      weeklyAvailability: [],
    });
    await newSchedule.save();

    // Generate JWT token
    const token = generateToken(savedUser._id.toString());

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        timezone: savedUser.timezone,
        sleepStart: savedUser.sleepStart,
        sleepEnd: savedUser.sleepEnd,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during registration.' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials.' });
      return;
    }

    // Check password
    const isMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid credentials.' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        timezone: user.timezone,
        sleepStart: user.sleepStart,
        sleepEnd: user.sleepEnd,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during login.' });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      timezone: user.timezone,
      sleepStart: user.sleepStart,
      sleepEnd: user.sleepEnd,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error retrieving profile.' });
  }
};
