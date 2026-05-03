import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    unique: false,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  faculty: {
    type: String,
    default: '',
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('Department', departmentSchema);