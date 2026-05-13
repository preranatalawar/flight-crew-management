'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useRequireSession } from '@/hooks/use-require-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Plane, Calendar, AlertTriangle, CheckCircle,
  LogOut, Menu, X, PlaneTakeoff, Ban
} from 'lucide-react';
import Link from 'next/link';
import { PageBack } from '@/components/page-back';

interface DashboardStats {
  totalCrew: number;
  activeCrew: number;
  onLeaveCrew: number;
  inactiveCrew: number;
  retiredCrew: number;
  totalFlights: number;
  scheduledFlights: number;
  inProgressFlights: number;
  completedFlights: number;
  cancelledFlights: number;
  complianceViolations: number;
  pendingRequests: number;
}

interface CrewRow {
  status?: string;
}

interface FlightRow {
  scheduledDepartureTime: string;
  estimatedFlightDuration?: number;
  status?: string;
}

function startOfWeekMonday(ref: Date) {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function stripLocalDate(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function buildWeeklyActivity(flights: FlightRow[]) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekStart = startOfWeekMonday(new Date());
  const weekStartMs = stripLocalDate(weekStart);
  const flightsCount = [0, 0, 0, 0, 0, 0, 0];
  const blockHours = [0, 0, 0, 0, 0, 0, 0];

  for (const f of flights) {
    const t = new Date(f.scheduledDepartureTime);
    if (Number.isNaN(t.getTime())) continue;
    const dayIndex = Math.round((stripLocalDate(t) - weekStartMs) / 86400000);
    if (dayIndex < 0 || dayIndex > 6) continue;
    flightsCount[dayIndex]++;
    const mins = typeof f.estimatedFlightDuration === 'number' ? f.estimatedFlightDuration : 0;
    blockHours[dayIndex] += mins / 60;
  }

  return labels.map((name, i) => ({
    name,
    flights: flightsCount[i],
    blockHours: Math.round(blockHours[i] * 10) / 10,
  }));
}

export default function DashboardPage() {
  const { user, isLoading: sessionLoading } = useRequireSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalCrew: 0,
    activeCrew: 0,
    onLeaveCrew: 0,
    inactiveCrew: 0,
    retiredCrew: 0,
    totalFlights: 0,
    scheduledFlights: 0,
    inProgressFlights: 0,
    completedFlights: 0,
    cancelledFlights: 0,
    complianceViolations: 0,
    pendingRequests: 0,
  });
  const [crewRows, setCrewRows] = useState<CrewRow[]>([]);
  const [flightRows, setFlightRows] = useState<FlightRow[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!sessionLoading && user) {
      void fetchStats();
    }
  }, [sessionLoading, user]);

  const fetchStats = async () => {
    try {
      const [crewRes, flightsRes] = await Promise.all([
        api.get('/api/crew'),
        api.get('/api/flights'),
      ]);

      const crewData = crewRes.data.crewMembers || [];
      const flightsData = flightsRes.data.flights || [];

      setCrewRows(crewData);
      setFlightRows(flightsData);

      setStats({
        totalCrew: crewData.length,
        activeCrew: crewData.filter((c: any) => c.status === 'active').length,
        onLeaveCrew: crewData.filter((c: any) => c.status === 'on_leave').length,
        inactiveCrew: crewData.filter((c: any) => c.status === 'inactive').length,
        retiredCrew: crewData.filter((c: any) => c.status === 'retired').length,
        totalFlights: flightsData.length,
        scheduledFlights: flightsData.filter((f: any) => f.status === 'scheduled').length,
        inProgressFlights: flightsData.filter((f: any) => f.status === 'in_progress').length,
        completedFlights: flightsData.filter((f: any) => f.status === 'completed').length,
        cancelledFlights: flightsData.filter((f: any) => f.status === 'cancelled').length,
        complianceViolations: 0,
        pendingRequests: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      localStorage.clear();
      window.location.assign('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const weeklyChartData = useMemo(() => buildWeeklyActivity(flightRows), [flightRows]);

  const flightStatusChartData = useMemo(() => {
    const labelMap: Record<string, string> = {
      scheduled: 'Scheduled',
      in_progress: 'In progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    const colors: Record<string, string> = {
      scheduled: 'oklch(0.55 0.15 250)',
      in_progress: 'oklch(0.62 0.22 41.12)',
      completed: 'oklch(0.5 0.15 142.84)',
      cancelled: 'oklch(0.56 0.24 25.33)',
    };
    const keys = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
    return keys.map((key) => ({
      name: labelMap[key],
      value: flightRows.filter((f) => f.status === key).length,
      fill: colors[key],
    }));
  }, [flightRows]);

  const crewStatusChartData = useMemo(() => {
    const labelMap: Record<string, string> = {
      active: 'Active',
      on_leave: 'On leave',
      inactive: 'Inactive',
      retired: 'Retired',
    };
    const colors: Record<string, string> = {
      active: 'oklch(0.5 0.15 142.84)',
      on_leave: 'oklch(0.62 0.22 41.12)',
      inactive: 'oklch(0.56 0.24 25.33)',
      retired: 'oklch(0.45 0.02 260)',
    };
    const keys = ['active', 'on_leave', 'inactive', 'retired'] as const;
    return keys.map((key) => ({
      name: labelMap[key],
      value: crewRows.filter((c) => c.status === key).length,
      fill: colors[key],
    }));
  }, [crewRows]);

  const complianceData = [
    { name: 'Compliant', value: 85, fill: 'oklch(0.5 0.15 142.84)' },
    { name: 'Warning', value: 10, fill: 'oklch(0.62 0.22 41.12)' },
    { name: 'Violation', value: 5, fill: 'oklch(0.56 0.24 25.33)' },
  ];

  if (sessionLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-lg font-bold text-sidebar-foreground">FlightCrew</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-sidebar-accent rounded"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            href="/dashboard"
            icon={<Plane className="w-5 h-5" />}
            label="Dashboard"
            sidebarOpen={sidebarOpen}
            active
          />
          <NavLink
            href="/dashboard/crew"
            icon={<Users className="w-5 h-5" />}
            label="Crew Management"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/flights"
            icon={<Plane className="w-5 h-5" />}
            label="Flights"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/scheduling"
            icon={<Calendar className="w-5 h-5" />}
            label="Scheduling"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/compliance"
            icon={<CheckCircle className="w-5 h-5" />}
            label="Compliance"
            sidebarOpen={sidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          {sidebarOpen && (
            <div className="mb-4 p-3 bg-sidebar-accent rounded">
              <p className="text-xs text-sidebar-accent-foreground">Logged in as</p>
              <p className="font-semibold text-sidebar-foreground truncate">{user?.name}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-sidebar-accent-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border p-6">
          <PageBack href="/" label="Home" className="mb-3 -ml-1" />
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}!</p>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Crew status */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Crew status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Active"
                value={stats.activeCrew}
                subtitle={`${stats.totalCrew} crew total`}
                icon={<Users className="w-8 h-8" />}
                color="text-emerald-500"
              />
              <StatCard
                title="On leave"
                value={stats.onLeaveCrew}
                subtitle="unavailable for assignment"
                icon={<Calendar className="w-8 h-8" />}
                color="text-amber-500"
              />
              <StatCard
                title="Inactive"
                value={stats.inactiveCrew}
                subtitle="not on active roster"
                icon={<AlertTriangle className="w-8 h-8" />}
                color="text-red-500"
              />
              <StatCard
                title="Retired"
                value={stats.retiredCrew}
                subtitle="archived profiles"
                icon={<Users className="w-8 h-8" />}
                color="text-muted-foreground"
              />
            </div>
          </div>

          {/* Flight scheduling */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Flight scheduling</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Scheduled"
                value={stats.scheduledFlights}
                subtitle={`${stats.totalFlights} flights total`}
                icon={<Plane className="w-8 h-8" />}
                color="text-blue-500"
              />
              <StatCard
                title="In progress"
                value={stats.inProgressFlights}
                subtitle="airborne / operating"
                icon={<PlaneTakeoff className="w-8 h-8" />}
                color="text-amber-500"
              />
              <StatCard
                title="Completed"
                value={stats.completedFlights}
                subtitle="finished legs"
                icon={<CheckCircle className="w-8 h-8" />}
                color="text-emerald-500"
              />
              <StatCard
                title="Cancelled"
                value={stats.cancelledFlights}
                subtitle="removed from schedule"
                icon={<Ban className="w-8 h-8" />}
                color="text-destructive"
              />
            </div>
          </div>

          {/* Charts */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Weekly activity</CardTitle>
                  <CardDescription>
                    Flights and estimated block hours by scheduled departure day (this calendar week, Mon–Sun)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                      <Legend />
                      <Bar dataKey="blockHours" name="Block hours (est.)" fill="var(--primary)" />
                      <Bar dataKey="flights" name="Flights" fill="var(--accent)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Flights by status</CardTitle>
                    <CardDescription>From your flight list</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center min-h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={flightStatusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => (value ? `${name}: ${value}` : '')}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {flightStatusChartData.map((entry, index) => (
                            <Cell key={`flight-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Crew by status</CardTitle>
                    <CardDescription>From your roster</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center min-h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={crewStatusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => (value ? `${name}: ${value}` : '')}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {crewStatusChartData.map((entry, index) => (
                            <Cell key={`crew-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Crew Compliance Status</CardTitle>
                  <CardDescription>Distribution of compliance across crew</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {complianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/dashboard/crew">Add Crew Member</Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/dashboard/flights">Schedule Flight</Link>
              </Button>
              <Button asChild variant="outline" className="border-border">
                <Link href="/dashboard/scheduling">View Schedule</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  sidebarOpen,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sidebarOpen: boolean;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent'
      }`}
    >
      {icon}
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`${color} opacity-80`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
