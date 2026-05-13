import mongoose, { Schema, Document } from 'mongoose';

export interface IFlight extends Document {
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  aircraftType: string;
  aircraftRegistration: string;
  scheduledDepartureTime: Date;
  scheduledArrivalTime: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  estimatedFlightDuration: number; // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  crewAssigned: Array<{
    crewMemberId: mongoose.Types.ObjectId;
    position: string;
    status: 'assigned' | 'confirmed' | 'completed' | 'cancelled';
  }>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlightSchema: Schema = new Schema(
  {
    flightNumber: {
      type: String,
      required: true,
      unique: true,
    },
    departureAirport: {
      type: String,
      required: true,
    },
    arrivalAirport: {
      type: String,
      required: true,
    },
    aircraftType: {
      type: String,
      required: true,
    },
    aircraftRegistration: {
      type: String,
      required: true,
    },
    scheduledDepartureTime: {
      type: Date,
      required: true,
    },
    scheduledArrivalTime: {
      type: Date,
      required: true,
    },
    actualDepartureTime: Date,
    actualArrivalTime: Date,
    estimatedFlightDuration: {
      type: Number,
      required: true, // in minutes
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    crewAssigned: [
      {
        crewMemberId: {
          type: Schema.Types.ObjectId,
          ref: 'CrewMember',
        },
        position: String,
        status: {
          type: String,
          enum: ['assigned', 'confirmed', 'completed', 'cancelled'],
          default: 'assigned',
        },
      },
    ],
    notes: String,
  },
  { timestamps: true }
);

export const Flight = mongoose.models.Flight || mongoose.model<IFlight>('Flight', FlightSchema);
