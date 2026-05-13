import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CrewMember } from '@/models/Crew';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid crew member ID' }, { status: 400 });
    }

    const crewMember = await CrewMember.findById(id).populate('userId', 'name email');

    if (!crewMember) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    return NextResponse.json({ crewMember }, { status: 200 });
  } catch (error: any) {
    console.error('Get crew detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid crew member ID' }, { status: 400 });
    }

    const data = await request.json();

    const crewMember = await CrewMember.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email');

    if (!crewMember) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'Crew member updated successfully',
        crewMember,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update crew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid crew member ID' }, { status: 400 });
    }

    const crewMember = await CrewMember.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!crewMember) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'Crew member deactivated successfully',
        crewMember,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete crew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
