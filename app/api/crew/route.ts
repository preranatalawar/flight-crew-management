import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CrewMember } from '@/models/Crew';
import { getUserIdFromRequest } from '@/lib/request-user';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const position = searchParams.get('position');

    let query: any = {};
    if (status) query.status = status;
    if (position) query.position = position;

    const crewMembers = await CrewMember.find(query)
      .populate('userId', 'name email')
      .sort({ firstName: 1 });

    return NextResponse.json({ crewMembers }, { status: 200 });
  } catch (error: any) {
    console.error('Get crew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const data = await request.json();
    const {
      userId: bodyUserId,
      employeeId,
      firstName,
      lastName,
      position,
      dateOfBirth,
      licenseNumber,
      licenseExpiryDate,
      basedAt,
      joinDate,
      status: statusInput,
    } = data;

    const allowedStatus = ['active', 'on_leave', 'inactive', 'retired'] as const;
    const status =
      typeof statusInput === 'string' && allowedStatus.includes(statusInput as (typeof allowedStatus)[number])
        ? statusInput
        : 'active';

    if (!employeeId || !firstName || !lastName || !position || !licenseNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = bodyUserId || getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const existingCrew = await CrewMember.findOne({ employeeId });
    if (existingCrew) {
      return NextResponse.json({ error: 'Employee ID already exists' }, { status: 400 });
    }

    const joinDateValue = joinDate ? new Date(joinDate) : new Date();
    const dobValue = dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01');
    const licenseExpiryValue = licenseExpiryDate
      ? new Date(licenseExpiryDate)
      : new Date(joinDateValue.getTime() + 365 * 24 * 60 * 60 * 1000);

    const crewMember = await CrewMember.create({
      userId,
      employeeId,
      firstName,
      lastName,
      position,
      dateOfBirth: dobValue,
      licenseNumber,
      licenseExpiryDate: licenseExpiryValue,
      basedAt: basedAt || 'HQ',
      joinDate: joinDateValue,
      status,
    });

    await crewMember.populate('userId', 'name email');

    return NextResponse.json(
      {
        message: 'Crew member created successfully',
        crewMember,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create crew error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Duplicate employee ID or license number' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
