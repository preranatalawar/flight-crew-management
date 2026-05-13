import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Flight } from '@/models/Flight';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid flight ID' }, { status: 400 });
    }

    const flight = await Flight.findById(id).populate('crewAssigned.crewMemberId');

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    return NextResponse.json({ flight }, { status: 200 });
  } catch (error: any) {
    console.error('Get flight error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid flight ID' }, { status: 400 });
    }

    const data = await request.json();

    const flight = await Flight.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('crewAssigned.crewMemberId');

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'Flight updated successfully',
        flight,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update flight error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid flight ID' }, { status: 400 });
    }

    const flight = await Flight.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'Flight cancelled successfully',
        flight,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cancel flight error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
