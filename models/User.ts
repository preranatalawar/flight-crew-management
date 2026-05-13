import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'scheduler' | 'crew_member';
  department: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'scheduler', 'crew_member'],
      default: 'crew_member',
    },
    department: {
      type: String,
      default: 'Operations',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const plainPassword = this.get('password') as string;
  const salt = await bcryptjs.genSalt(10);
  this.set('password', await bcryptjs.hash(plainPassword, salt));
});

UserSchema.methods.comparePassword = async function (password: string) {
  return await bcryptjs.compare(password, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
