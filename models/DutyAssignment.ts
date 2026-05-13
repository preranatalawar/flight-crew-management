import mongoose, { Schema, Document } from 'mongoose';

export interface IDutyAssignment extends Document {
  crewMemberId: mongoose.Types.ObjectId;
  flightId: mongoose.Types.ObjectId;
  dutyCycleStartTime: Date;
  dutyStartTime: Date;
  dutyEndTime: Date;
  position: string;
  flightDuration: number; // in minutes
  restPeriodBefore: number; // in minutes
  restPeriodAfter: number; // in minutes
  totalDutyTime: number; // in minutes
  isCompliance: boolean;
  complianceStatus: 'compliant' | 'violation' | 'warning';
  regulationType: 'FAA_Part_117' | 'ICAO' | 'DGCA';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DutyAssignmentSchema: Schema = new Schema(
  {
    crewMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      required: true,
    },
    flightId: {
      type: Schema.Types.ObjectId,
      ref: 'Flight',
      required: true,
    },
    dutyCycleStartTime: {
      type: Date,
      required: true,
    },
    dutyStartTime: {
      type: Date,
      required: true,
    },
    dutyEndTime: {
      type: Date,
      required: true,
    },
    position: String,
    flightDuration: Number, // in minutes
    restPeriodBefore: Number, // in minutes
    restPeriodAfter: Number, // in minutes
    totalDutyTime: Number, // in minutes
    isCompliance: {
      type: Boolean,
      default: true,
    },
    complianceStatus: {
      type: String,
      enum: ['compliant', 'violation', 'warning'],
      default: 'compliant',
    },
    regulationType: {
      type: String,
      enum: ['FAA_Part_117', 'ICAO', 'DGCA'],
      default: 'FAA_Part_117',
    },
    notes: String,
  },
  { timestamps: true }
);

export const DutyAssignment =
  mongoose.models.DutyAssignment || mongoose.model<IDutyAssignment>('DutyAssignment', DutyAssignmentSchema);
