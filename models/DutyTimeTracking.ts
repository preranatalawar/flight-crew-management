import mongoose, { Schema, Document } from 'mongoose';

export interface IDutyTimeTracking extends Document {
  crewMemberId: mongoose.Types.ObjectId;
  trackingPeriodStart: Date;
  trackingPeriodEnd: Date;
  periodType: '7_days' | '30_days' | 'calendar_month';
  totalDutyTime: number; // in minutes
  totalFlightTime: number; // in minutes
  totalRestTime: number; // in minutes
  numberOfDutyPeriods: number;
  flightLegsCompleted: number;
  complianceStatus: 'compliant' | 'approaching_limit' | 'exceeded';
  maxAllowedDutyTime: number; // in minutes
  remainingDutyTime: number; // in minutes
  dutyAssignments: mongoose.Types.ObjectId[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DutyTimeTrackingSchema: Schema = new Schema(
  {
    crewMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      required: true,
    },
    trackingPeriodStart: {
      type: Date,
      required: true,
    },
    trackingPeriodEnd: {
      type: Date,
      required: true,
    },
    periodType: {
      type: String,
      enum: ['7_days', '30_days', 'calendar_month'],
      default: '7_days',
    },
    totalDutyTime: {
      type: Number,
      default: 0, // in minutes
    },
    totalFlightTime: {
      type: Number,
      default: 0, // in minutes
    },
    totalRestTime: {
      type: Number,
      default: 0, // in minutes
    },
    numberOfDutyPeriods: {
      type: Number,
      default: 0,
    },
    flightLegsCompleted: {
      type: Number,
      default: 0,
    },
    complianceStatus: {
      type: String,
      enum: ['compliant', 'approaching_limit', 'exceeded'],
      default: 'compliant',
    },
    maxAllowedDutyTime: {
      type: Number,
      required: true, // in minutes
    },
    remainingDutyTime: {
      type: Number,
      required: true, // in minutes
    },
    dutyAssignments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DutyAssignment',
      },
    ],
    notes: String,
  },
  { timestamps: true }
);

export const DutyTimeTracking =
  mongoose.models.DutyTimeTracking || mongoose.model<IDutyTimeTracking>('DutyTimeTracking', DutyTimeTrackingSchema);
