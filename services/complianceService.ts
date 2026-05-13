import { DutyAssignment } from '@/models/DutyAssignment';
import { DutyTimeTracking } from '@/models/DutyTimeTracking';
import { ComplianceRule } from '@/models/ComplianceRule';
import mongoose from 'mongoose';

export interface ComplianceCheckResult {
  isCompliant: boolean;
  status: 'compliant' | 'violation' | 'warning';
  violations: string[];
  warnings: string[];
  remainingDutyTime: number;
  currentDutyTime: number;
}

export const complianceService = {
  // Default FAA Part 117 limits
  defaults: {
    max7DaysDutyTime: 60 * 60 * 1000, // 60 hours in minutes
    max14DaysDutyTime: 110 * 60 * 1000, // 110 hours
    maxFlightDutyPeriod: 9 * 60 * 1000, // 9 hours
    minRestPeriod: 10 * 60 * 1000, // 10 hours
    maxConsecutiveDays: 7,
  },

  async getComplianceRules(
    regulationType: 'FAA_Part_117' | 'ICAO' | 'DGCA' = 'FAA_Part_117'
  ) {
    try {
      const rules = await ComplianceRule.find({
        regulationType,
        isActive: true,
      });

      if (rules.length === 0) {
        return this.getDefaultRules(regulationType);
      }

      return rules;
    } catch (error) {
      console.error('Error fetching compliance rules:', error);
      return this.getDefaultRules(regulationType);
    }
  },

  getDefaultRules(regulationType: string) {
    const baseRules = [
      {
        ruleName: 'Maximum 7-Day Duty Time',
        category: 'maximum_duty_time',
        maxDutyTime: 60 * 60, // 60 hours in minutes
      },
      {
        ruleName: 'Maximum 14-Day Duty Time',
        category: 'maximum_duty_time',
        maxDutyTime: 110 * 60, // 110 hours
      },
      {
        ruleName: 'Maximum Flight Duty Period',
        category: 'flight_duty_period',
        maxTime: 9 * 60, // 9 hours
      },
      {
        ruleName: 'Minimum Rest Period',
        category: 'minimum_rest',
        minRestTime: 10 * 60, // 10 hours
      },
      {
        ruleName: 'Maximum Consecutive Duty Days',
        category: 'rest_requirement',
        maxDays: 7,
      },
    ];

    return baseRules;
  },

  async checkCrewCompliance(
    crewMemberId: string | mongoose.Types.ObjectId,
    regulationType: 'FAA_Part_117' | 'ICAO' | 'DGCA' = 'FAA_Part_117'
  ): Promise<ComplianceCheckResult> {
    try {
      const violations: string[] = [];
      const warnings: string[] = [];

      // Get last 7 days of duty assignments
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dutyAssignments = await DutyAssignment.find({
        crewMemberId,
        dutyStartTime: { $gte: sevenDaysAgo },
      });

      let totalDutyTime = 0;
      let currentDutyTime = 0;
      let dutyDays = 0;
      let maxFlightDutyPeriod = 0;
      const lastRestDates: Date[] = [];

      dutyAssignments.forEach((assignment) => {
        totalDutyTime += assignment.totalDutyTime || 0;
        maxFlightDutyPeriod = Math.max(maxFlightDutyPeriod, assignment.flightDuration || 0);

        // Track consecutive duty days
        const dutyDate = assignment.dutyStartTime.toDateString();
        if (!lastRestDates.includes(assignment.dutyStartTime)) {
          dutyDays++;
        }
      });

      const rules = await this.getComplianceRules(regulationType);

      // Check 7-day duty time limit (60 hours = 3600 minutes)
      const max7DaysDuty = 60 * 60; // minutes
      if (totalDutyTime > max7DaysDuty) {
        violations.push(`Exceeded 7-day duty time limit: ${totalDutyTime} minutes > ${max7DaysDuty} minutes`);
      } else if (totalDutyTime > max7DaysDuty * 0.85) {
        warnings.push(`Approaching 7-day duty time limit: ${totalDutyTime} of ${max7DaysDuty} minutes`);
      }

      // Check maximum flight duty period (9 hours = 540 minutes)
      const maxFlightDutyAllowed = 9 * 60; // minutes
      if (maxFlightDutyPeriod > maxFlightDutyAllowed) {
        violations.push(`Exceeded max flight duty period: ${maxFlightDutyPeriod} > ${maxFlightDutyAllowed} minutes`);
      }

      // Check consecutive duty days (max 7)
      const maxConsecutiveDays = 7;
      if (dutyDays > maxConsecutiveDays) {
        violations.push(`Exceeded consecutive duty days: ${dutyDays} > ${maxConsecutiveDays}`);
      } else if (dutyDays >= 6) {
        warnings.push(`Approaching maximum consecutive duty days: ${dutyDays} of ${maxConsecutiveDays}`);
      }

      // Check rest requirements (minimum 10 hours)
      const minRestRequired = 10 * 60; // minutes
      const lastDutyAssignment = dutyAssignments[dutyAssignments.length - 1];
      if (lastDutyAssignment && lastDutyAssignment.restPeriodAfter < minRestRequired) {
        violations.push(`Insufficient rest period: ${lastDutyAssignment.restPeriodAfter} < ${minRestRequired} minutes`);
      }

      const remainingDutyTime = Math.max(0, max7DaysDuty - totalDutyTime);
      const isCompliant = violations.length === 0;

      return {
        isCompliant,
        status: violations.length > 0 ? 'violation' : warnings.length > 0 ? 'warning' : 'compliant',
        violations,
        warnings,
        remainingDutyTime,
        currentDutyTime: totalDutyTime,
      };
    } catch (error) {
      console.error('Error checking crew compliance:', error);
      return {
        isCompliant: false,
        status: 'violation',
        violations: ['Error checking compliance'],
        warnings: [],
        remainingDutyTime: 0,
        currentDutyTime: 0,
      };
    }
  },

  async checkAssignmentCompliance(
    crewMemberId: string | mongoose.Types.ObjectId,
    proposedFlightDuration: number, // in minutes
    proposedRestBefore: number, // in minutes
    regulationType: 'FAA_Part_117' | 'ICAO' | 'DGCA' = 'FAA_Part_117'
  ): Promise<ComplianceCheckResult> {
    try {
      const currentCompliance = await this.checkCrewCompliance(crewMemberId, regulationType);

      const projectedDutyTime = currentCompliance.currentDutyTime + proposedFlightDuration;
      const max7DaysDuty = 60 * 60; // 60 hours in minutes
      const minRestRequired = 10 * 60; // 10 hours

      const violations = [...currentCompliance.violations];
      const warnings = [...currentCompliance.warnings];

      if (proposedRestBefore < minRestRequired) {
        violations.push(`Proposed rest period insufficient: ${proposedRestBefore} < ${minRestRequired} minutes`);
      }

      if (projectedDutyTime > max7DaysDuty) {
        violations.push(
          `Assignment would exceed 7-day duty limit: ${projectedDutyTime} > ${max7DaysDuty} minutes`
        );
      } else if (projectedDutyTime > max7DaysDuty * 0.85) {
        warnings.push(`Assignment would approach duty limit: ${projectedDutyTime} of ${max7DaysDuty} minutes`);
      }

      if (proposedFlightDuration > 9 * 60) {
        violations.push(`Proposed flight exceeds max duty period: ${proposedFlightDuration} > ${9 * 60} minutes`);
      }

      return {
        isCompliant: violations.length === 0,
        status: violations.length > 0 ? 'violation' : warnings.length > 0 ? 'warning' : 'compliant',
        violations,
        warnings,
        remainingDutyTime: Math.max(0, max7DaysDuty - projectedDutyTime),
        currentDutyTime: projectedDutyTime,
      };
    } catch (error) {
      console.error('Error checking assignment compliance:', error);
      return {
        isCompliant: false,
        status: 'violation',
        violations: ['Error checking compliance'],
        warnings: [],
        remainingDutyTime: 0,
        currentDutyTime: 0,
      };
    }
  },
};
