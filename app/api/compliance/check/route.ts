import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { complianceService } from '@/services/complianceService';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { crewMemberId, proposedFlightDuration, proposedRestBefore, regulationType = 'FAA_Part_117' } = await request.json();

    if (!crewMemberId) {
      return NextResponse.json({ error: 'Crew member ID required' }, { status: 400 });
    }

    let complianceResult;

    if (proposedFlightDuration && proposedRestBefore) {
      // Check if a specific assignment would be compliant
      complianceResult = await complianceService.checkAssignmentCompliance(
        crewMemberId,
        proposedFlightDuration,
        proposedRestBefore,
        regulationType
      );
    } else {
      // Check current overall compliance
      complianceResult = await complianceService.checkCrewCompliance(crewMemberId, regulationType);
    }

    return NextResponse.json(
      {
        compliance: complianceResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Compliance check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
