import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'manager', 'admin'],
    default: 'student'
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  studentId: {
    type: String,
    sparse: true,
    validate: {
      validator: function(v) {
        return this.role !== 'student' || v;
      },
      message: 'Student ID is required for students'
    }
  },
  staffId: {
    type: String,
    sparse: true,
    validate: {
      validator: function(v) {
        return (this.role === 'lecturer' || this.role === 'manager' || this.role === 'admin') ? v : true;
      },
      message: 'Staff ID is required for staff members'
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User; 