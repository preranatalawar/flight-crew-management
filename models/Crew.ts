import mongoose, { Schema, Document } from 'mongoose';

export interface ICrewMember extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: 'captain' | 'first_officer' | 'flight_engineer' | 'cabin_crew';
  dateOfBirth: Date;
  licenseNumber: string;
  licenseType: string;
  licenseExpiryDate: Date;
  medicalCertificate: {
    date: Date;
    expiryDate: Date;
    class: string;
  };
  trainingCertifications: Array<{
    name: string;
    certificationDate: Date;
    expiryDate: Date;
    issuer: string;
  }>;
  totalFlightHours: number;
  basedAt: string;
  homeAddress: string;
  phoneNumber: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
  };
  status: 'active' | 'on_leave' | 'inactive' | 'retired';
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CrewMemberSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: ['captain', 'first_officer', 'flight_engineer', 'cabin_crew'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    licenseType: String,
    licenseExpiryDate: Date,
    medicalCertificate: {
      date: Date,
      expiryDate: Date,
      class: String,
    },
    trainingCertifications: [
      {
        name: String,
        certificationDate: Date,
        expiryDate: Date,
        issuer: String,
      },
    ],
    totalFlightHours: {
      type: Number,
      default: 0,
    },
    basedAt: String,
    homeAddress: String,
    phoneNumber: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },
    bankDetails: {
      accountNumber: String,
      bankName: String,
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'inactive', 'retired'],
      default: 'active',
    },
    joinDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const CrewMember = mongoose.models.CrewMember || mongoose.model<ICrewMember>('CrewMember', CrewMemberSchema);
