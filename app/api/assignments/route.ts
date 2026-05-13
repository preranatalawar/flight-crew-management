import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { Flight } from '@/models/Flight';
import { CrewMember } from '@/models/Crew';
import { complianceService } from '@/services/complianceService';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const crewMemberId = searchParams.get('crewMemberId');
    const flightId = searchParams.get('flightId');
    const status = searchParams.get('status');

    let query: any = {};
    if (crewMemberId) query.crewMemberId = crewMemberId;
    if (flightId) query.flightId = flightId;
    if (status) query.complianceStatus = status;

    const assignments = await DutyAssignment.find(query)
      .populate('crewMemberId', 'firstName lastName position')
      .populate('flightId', 'flightNumber departureAirport arrivalAirport')
      .sort({ dutyStartTime: -1 });

    return NextResponse.json({ assignments }, { status: 200 });
  } catch (error: any) {
    console.error('Get assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const data = await request.json();
    const { crewMemberId, flightId, position, regulationType = 'FAA_Part_117' } = data;

    if (!crewMemberId || !flightId || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch flight and crew details
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    const crew = await CrewMember.findById(crewMemberId);
    if (!crew) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    // Calculate duty times
    const dutyCycleStartTime = flight.scheduledDepartureTime;
    const dutyStartTime = new Date(flight.scheduledDepartureTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const dutyEndTime = new Date(flight.scheduledArrivalTime.getTime() + 1 * 60 * 60 * 1000); // 1 hour after
    const flightDuration = flight.estimatedFlightDuration;
    const restPeriodBefore = 10 * 60; // 10 hours in minutes
    const restPeriodAfter = 10 * 60; // 10 hours
    const totalDutyTime = Math.round((dutyEndTime.getTime() - dutyStartTime.getTime()) / (60 * 1000));

    // Check compliance
    const complianceCheck = await complianceService.checkAssignmentCompliance(
      crewMemberId,
      flightDuration,
      restPeriodBefore,
      regulationType
    );

    // Create duty assignment
    const dutyAssignment = await DutyAssignment.create({
      crewMemberId,
      flightId,
      dutyCycleStartTime,
      dutyStartTime,
      dutyEndTime,
      position,
      flightDuration,
      restPeriodBefore,
      restPeriodAfter,
      totalDutyTime,
      isCompliance: complianceCheck.isCompliant,
      complianceStatus: complianceCheck.status,
      regulationType,
    });

    // Add crew to flight's assigned crew list
    await Flight.findByIdAndUpdate(
      flightId,
      {
        $push: {
          crewAssigned: {
            crewMemberId,
            position,
            status: complianceCheck.isCompliant ? 'assigned' : 'cancelled',
          },
        },
      },
      { new: true }
    );

    await dutyAssignment.populate([
      { path: 'crewMemberId', select: 'firstName lastName position' },
      { path: 'flightId', select: 'flightNumber departureAirport arrivalAirport' },
    ]);

    return NextResponse.json(
      {
        message: 'Duty assignment created successfully',
        dutyAssignment,
        compliance: complianceCheck,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
