'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useRequireSession } from '@/hooks/use-require-session';
import { PageBack } from '@/components/page-back';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Plus } from 'lucide-react';

const POSITIONS = [
  { value: 'captain', label: 'Captain' },
  { value: 'first_officer', label: 'First Officer' },
  { value: 'flight_engineer', label: 'Flight Engineer' },
  { value: 'cabin_crew', label: 'Cabin Crew' },
] as const;

interface CrewRow {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

interface FlightRow {
  _id: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  status?: string;
}

interface Assignment {
  _id: string;
  crewMemberId: CrewRow | string;
  flightId: FlightRow | string;
  dutyStartTime: string;
  dutyEndTime: string;
  position: string;
  totalDutyTime: number;
  complianceStatus: 'compliant' | 'violation' | 'warning';
}

function crewCellLabel(v: CrewRow | string) {
  if (v && typeof v === 'object' && 'firstName' in v) {
    return `${v.firstName} ${v.lastName} (${v.employeeId})`;
  }
  return String(v);
}

function flightCellLabel(v: FlightRow | string) {
  if (v && typeof v === 'object' && 'flightNumber' in v) {
    return `${v.flightNumber} ${v.departureAirport}→${v.arrivalAirport}`;
  }
  return String(v);
}

export default function SchedulingPage() {
  const { user, isLoading: sessionLoading } = useRequireSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [crewList, setCrewList] = useState<CrewRow[]>([]);
  const [flightList, setFlightList] = useState<FlightRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCrew, setSelectedCrew] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('');
  const [position, setPosition] = useState<string>('captain');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user) {
      void loadAll();
    }
  }, [sessionLoading, user]);

  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [aRes, cRes, fRes] = await Promise.all([
        api.get('/api/assignments'),
        api.get('/api/crew'),
        api.get('/api/flights'),
      ]);
      setAssignments(aRes.data.assignments || []);
      setCrewList(cRes.data.crewMembers || []);
      setFlightList(
        (fRes.data.flights || []).filter((f: FlightRow) => f.status === 'scheduled')
      );
    } catch (e) {
      console.error(e);
      toast.error('Could not load scheduling data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCrew = async () => {
    if (!selectedCrew || !selectedFlight) {
      toast.error('Select a crew member and a flight');
      return;
    }

    setAssigning(true);
    try {
      await api.post('/api/assignments', {
        crewMemberId: selectedCrew,
        flightId: selectedFlight,
        position,
        regulationType: 'FAA_Part_117',
      });
      toast.success('Assignment created');
      setSelectedCrew('');
      setSelectedFlight('');
      setPosition('captain');
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign crew');
    } finally {
      setAssigning(false);
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'violation':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400';
      case 'violation':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-muted';
    }
  };

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageBack href="/dashboard" className="-ml-1" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crew Scheduling</h1>
          <p className="text-muted-foreground mt-1">Assign crews to flights with compliance checking</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Assign Crew to Flight</CardTitle>
            <CardDescription>
              Pick crew and a scheduled flight; compliance is checked on save.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Crew member</Label>
                {crewList.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Add crew in Crew Management first.</p>
                ) : (
                  <Select value={selectedCrew || undefined} onValueChange={setSelectedCrew}>
                    <SelectTrigger className="bg-secondary border-border w-full">
                      <SelectValue placeholder="Select crew" />
                    </SelectTrigger>
                    <SelectContent>
                      {crewList.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.firstName} {c.lastName} ({c.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Flight</Label>
                {flightList.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Schedule a flight in Flights first.</p>
                ) : (
                  <Select value={selectedFlight || undefined} onValueChange={setSelectedFlight}>
                    <SelectTrigger className="bg-secondary border-border w-full">
                      <SelectValue placeholder="Select flight" />
                    </SelectTrigger>
                    <SelectContent>
                      {flightList.map((f) => (
                        <SelectItem key={f._id} value={f._id}>
                          {f.flightNumber} {f.departureAirport}→{f.arrivalAirport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="bg-secondary border-border w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => void handleAssignCrew()}
                  disabled={assigning || !selectedCrew || !selectedFlight}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {assigning ? 'Assigning…' : 'Assign'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Crew Assignments</CardTitle>
            <CardDescription>{assignments.length} assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading assignments...</div>
              </div>
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="text-muted-foreground">No assignments yet. Create one above.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-foreground">Crew Member</TableHead>
                      <TableHead className="text-foreground">Flight</TableHead>
                      <TableHead className="text-foreground">Position</TableHead>
                      <TableHead className="text-foreground">Duty Time</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment._id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium text-foreground">
                          {crewCellLabel(assignment.crewMemberId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {flightCellLabel(assignment.flightId)}
                        </TableCell>
                        <TableCell className="text-foreground">{assignment.position}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {(assignment.totalDutyTime / 60).toFixed(1)}h
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getComplianceIcon(assignment.complianceStatus)}
                            <Badge className={getComplianceColor(assignment.complianceStatus)}>
                              {assignment.complianceStatus.toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Scheduling Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-accent/10 border-accent/20">
              <AlertTriangle className="h-4 w-4 text-accent" />
              <AlertDescription className="text-accent">
                The system automatically checks all crew assignments against FAA Part 117 duty time regulations
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Before Assigning</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check crew availability status</li>
                  <li>Verify license and medical current</li>
                  <li>Review duty time remaining</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Compliance Alerts</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Green: Compliant assignment</li>
                  <li>Yellow: Approaching limits</li>
                  <li>Red: Violation detected</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
