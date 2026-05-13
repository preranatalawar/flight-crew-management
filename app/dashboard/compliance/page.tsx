'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRequireSession } from '@/hooks/use-require-session';
import { PageBack } from '@/components/page-back';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle, AlertCircle, Search } from 'lucide-react';

interface ComplianceRecord {
  _id: string;
  crewMemberId: string;
  firstName: string;
  lastName: string;
  totalDutyTime: number;
  maxAllowedDutyTime: number;
  complianceStatus: 'compliant' | 'approaching_limit' | 'exceeded';
  violations?: string[];
}

export default function CompliancePage() {
  const { user, isLoading: sessionLoading } = useRequireSession();
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ComplianceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCrew: 0,
    compliant: 0,
    approaching: 0,
    exceeded: 0,
  });

  useEffect(() => {
    if (!sessionLoading && user) {
      void fetchComplianceData();
    }
  }, [sessionLoading, user]);

  const fetchComplianceData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/crew');
      const crewMembers = response.data.crewMembers || [];

      // Mock compliance data based on crew
      const complianceData = crewMembers.map((crew: any) => ({
        _id: crew._id,
        crewMemberId: crew._id,
        firstName: crew.firstName,
        lastName: crew.lastName,
        totalDutyTime: Math.random() * 3600,
        maxAllowedDutyTime: 3600,
        complianceStatus: Math.random() > 0.8 ? 'exceeded' : Math.random() > 0.7 ? 'approaching_limit' : 'compliant',
      }));

      setRecords(complianceData);
      setFilteredRecords(complianceData);

      const compliant = complianceData.filter((r: any) => r.complianceStatus === 'compliant').length;
      const approaching = complianceData.filter((r: any) => r.complianceStatus === 'approaching_limit').length;
      const exceeded = complianceData.filter((r: any) => r.complianceStatus === 'exceeded').length;

      setStats({
        totalCrew: crewMembers.length,
        compliant,
        approaching,
        exceeded,
      });
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.complianceStatus === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, records]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'approaching_limit':
        return 'bg-amber-500/20 text-amber-400';
      case 'exceeded':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'approaching_limit':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'exceeded':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const dutyPercentage = (actual: number, max: number) => Math.round((actual / max) * 100);

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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Duty Time Compliance</h1>
          <p className="text-muted-foreground mt-1">Monitor crew duty time and regulatory compliance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Crew</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalCrew}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Compliant
                </p>
                <p className="text-3xl font-bold text-emerald-400">{stats.compliant}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Approaching Limit
                </p>
                <p className="text-3xl font-bold text-amber-400">{stats.approaching}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Violations
                </p>
                <p className="text-3xl font-bold text-red-400">{stats.exceeded}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by crew name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'compliant', 'approaching_limit', 'exceeded'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    className={statusFilter === status ? 'bg-primary text-primary-foreground' : ''}
                    onClick={() => setStatusFilter(status)}
                    size="sm"
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Crew Compliance Status</CardTitle>
            <CardDescription>7-Day Duty Time Limits (60 hours max)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading compliance data...</div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No records found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-foreground">Crew Member</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">Duty Time (7 days)</TableHead>
                      <TableHead className="text-foreground">Usage %</TableHead>
                      <TableHead className="text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record._id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium text-foreground">
                          {record.firstName} {record.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.complianceStatus)}
                            <Badge className={getStatusColor(record.complianceStatus)}>
                              {record.complianceStatus.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(record.totalDutyTime / 60).toFixed(1)}h / {(record.maxAllowedDutyTime / 60).toFixed(0)}h
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  record.complianceStatus === 'compliant'
                                    ? 'bg-emerald-500'
                                    : record.complianceStatus === 'approaching_limit'
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(dutyPercentage(record.totalDutyTime, record.maxAllowedDutyTime), 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-10">
                              {dutyPercentage(record.totalDutyTime, record.maxAllowedDutyTime)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Guidelines */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Duty Time Compliance Rules</CardTitle>
            <CardDescription>FAA Part 117 Regulations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">7-Day Limits</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Maximum 60 hours duty time</li>
                  <li>• Maximum 8 flight duty periods</li>
                  <li>• Minimum 30 hours rest in 7 days</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Flight Duty Period</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Maximum 9 hours of flight duty</li>
                  <li>• Minimum 10 hours rest between</li>
                  <li>• Extended rest required after 3 duty days</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
