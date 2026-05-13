import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleRequest extends Document {
  crewMemberId: mongoose.Types.ObjectId;
  requestType: 'leave' | 'off_duty' | 'schedule_change' | 'unavailable';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  rejectionReason?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleRequestSchema: Schema = new Schema(
  {
    crewMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      required: true,
    },
    requestType: {
      type: String,
      enum: ['leave', 'off_duty', 'schedule_change', 'unavailable'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalDate: Date,
    rejectionReason: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

export const ScheduleRequest =
  mongoose.models.ScheduleRequest || mongoose.model<IScheduleRequest>('ScheduleRequest', ScheduleRequestSchema);
