import mongoose, { Schema, Document } from 'mongoose';

export interface IComplianceRule extends Document {
  ruleName: string;
  regulationType: 'FAA_Part_117' | 'ICAO' | 'DGCA';
  ruleCategory:
    | 'maximum_duty_time'
    | 'minimum_rest'
    | 'flight_duty_period'
    | 'flight_time_limitation'
    | 'rest_requirement';
  maxDutyTimePer7Days?: number; // in minutes
  maxDutyTimePer14Days?: number; // in minutes
  maxDutyTimePer28Days?: number; // in minutes
  maxFlightTime?: number; // in minutes
  minRestPeriod?: number; // in minutes
  maxFlightDutyPeriod?: number; // in minutes
  description: string;
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceRuleSchema: Schema = new Schema(
  {
    ruleName: {
      type: String,
      required: true,
    },
    regulationType: {
      type: String,
      enum: ['FAA_Part_117', 'ICAO', 'DGCA'],
      required: true,
    },
    ruleCategory: {
      type: String,
      enum: [
        'maximum_duty_time',
        'minimum_rest',
        'flight_duty_period',
        'flight_time_limitation',
        'rest_requirement',
      ],
      required: true,
    },
    maxDutyTimePer7Days: Number, // in minutes
    maxDutyTimePer14Days: Number, // in minutes
    maxDutyTimePer28Days: Number, // in minutes
    maxFlightTime: Number, // in minutes
    minRestPeriod: Number, // in minutes
    maxFlightDutyPeriod: Number, // in minutes
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    expiryDate: Date,
  },
  { timestamps: true }
);

export const ComplianceRule =
  mongoose.models.ComplianceRule || mongoose.model<IComplianceRule>('ComplianceRule', ComplianceRuleSchema);
