import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Flight } from '@/models/Flight';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query: any = {};
    if (status) query.status = status;
    
    if (dateFrom || dateTo) {
      query.scheduledDepartureTime = {};
      if (dateFrom) query.scheduledDepartureTime.$gte = new Date(dateFrom);
      if (dateTo) query.scheduledDepartureTime.$lte = new Date(dateTo);
    }

    const flights = await Flight.find(query)
      .populate('crewAssigned.crewMemberId', 'firstName lastName position')
      .sort({ scheduledDepartureTime: 1 });

    return NextResponse.json({ flights }, { status: 200 });
  } catch (error: any) {
    console.error('Get flights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const data = await request.json();
    const {
      flightNumber,
      departureAirport,
      arrivalAirport,
      aircraftType,
      aircraftRegistration,
      scheduledDepartureTime,
      scheduledArrivalTime,
      estimatedFlightDuration: durationInput,
    } = data;

    if (
      !flightNumber ||
      !departureAirport ||
      !arrivalAirport ||
      !aircraftType ||
      !aircraftRegistration ||
      !scheduledDepartureTime ||
      !scheduledArrivalTime
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dep = new Date(scheduledDepartureTime);
    const arr = new Date(scheduledArrivalTime);
    const estimatedFlightDuration =
      typeof durationInput === 'number' && !Number.isNaN(durationInput)
        ? durationInput
        : Math.max(1, Math.round((arr.getTime() - dep.getTime()) / 60000));

    const existingFlight = await Flight.findOne({ flightNumber });
    if (existingFlight) {
      return NextResponse.json({ error: 'Flight number already exists' }, { status: 400 });
    }

    const flight = await Flight.create({
      flightNumber,
      departureAirport,
      arrivalAirport,
      aircraftType,
      aircraftRegistration,
      scheduledDepartureTime: dep,
      scheduledArrivalTime: arr,
      estimatedFlightDuration,
      status: 'scheduled',
    });

    return NextResponse.json(
      {
        message: 'Flight created successfully',
        flight,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create flight error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Flight number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
