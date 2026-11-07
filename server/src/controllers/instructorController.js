import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { Instructor } from '../models/Instructor.js';

const PUBLIC_FIELDS = 'name department role';

function publicProfile(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    username: doc.username,
    department: doc.department,
    role: doc.role
  };
}

const loginSchema = Joi.object({
  username: Joi.string().trim().min(1).max(50).required(),
  password: Joi.string().min(1).max(100).required()
});

// Only these two fields can be searched. Everything else is ignored.
const searchSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50),
  department: Joi.string().trim().min(1).max(50)
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/instructors/login
export async function loginInstructor(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const instructor = await Instructor.findOne({ username: value.username })
      .select('+password');

    const ok = instructor && (await bcrypt.compare(value.password, instructor.password));
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    return res.json({ instructor: publicProfile(instructor) });
  } catch (err) {
    next(err);
  }
}

// GET /api/instructors
export async function getDirectory(req, res, next) {
  try {
    const instructors = await Instructor.find()
      .select(PUBLIC_FIELDS)
      .sort({ name: 1 })
      .lean();
    res.json({ instructors });
  } catch (err) {
    next(err);
  }
}

// GET /api/instructors/search
export async function searchInstructors(req, res, next) {
  try {
    const { value } = searchSchema.validate(req.query, {
      stripUnknown: true,   // drops $where, role, username, password, etc.
      abortEarly: false
    });

    const filter = {};
    if (value && value.name) filter.name = new RegExp(escapeRegex(value.name), 'i');
    if (value && value.department) filter.department = new RegExp(escapeRegex(value.department), 'i');

    const instructors = await Instructor.find(filter)
      .select(PUBLIC_FIELDS)
      .lean();
    res.json({ count: instructors.length, instructors });
  } catch (err) {
    next(err);
  }
}