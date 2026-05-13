'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useRequireSession } from '@/hooks/use-require-session';
import { PageBack } from '@/components/page-back';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Edit, Eye, MoreHorizontal, Play, CheckCircle } from 'lucide-react';

interface Flight {
  _id: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  aircraftType: string;
  aircraftRegistration?: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  crewAssigned?: { crewMemberId?: string; position?: string; status?: string }[];
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = () => ({
  flightNumber: '',
  departureAirport: '',
  arrivalAirport: '',
  aircraftType: '',
  aircraftRegistration: '',
  scheduledDepartureTime: '',
  scheduledArrivalTime: '',
});

export default function FlightsPage() {
  const { user, isLoading: sessionLoading } = useRequireSession();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewFlight, setViewFlight] = useState<Flight | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!sessionLoading && user) {
      void fetchFlights();
    }
  }, [sessionLoading, user]);

  const fetchFlights = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/flights');
      setFlights(response.data.flights);
      setFilteredFlights(response.data.flights);
    } catch (error) {
      console.error('Error fetching flights:', error);
      toast.error('Could not load flights');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = flights;

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.departureAirport.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.arrivalAirport.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    setFilteredFlights(filtered);
  }, [searchTerm, statusFilter, flights]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (flight: Flight) => {
    setEditingId(flight._id);
    setForm({
      flightNumber: flight.flightNumber,
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      aircraftType: flight.aircraftType,
      aircraftRegistration: flight.aircraftRegistration || '',
      scheduledDepartureTime: toDatetimeLocal(flight.scheduledDepartureTime),
      scheduledArrivalTime: toDatetimeLocal(flight.scheduledArrivalTime),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.flightNumber.trim() ||
      !form.departureAirport.trim() ||
      !form.arrivalAirport.trim() ||
      !form.aircraftType.trim() ||
      !form.aircraftRegistration.trim() ||
      !form.scheduledDepartureTime ||
      !form.scheduledArrivalTime
    ) {
      toast.error('Fill in all fields');
      return;
    }
    const dep = new Date(form.scheduledDepartureTime);
    const arr = new Date(form.scheduledArrivalTime);
    if (arr <= dep) {
      toast.error('Arrival must be after departure');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        flightNumber: form.flightNumber.trim().toUpperCase(),
        departureAirport: form.departureAirport.trim().toUpperCase(),
        arrivalAirport: form.arrivalAirport.trim().toUpperCase(),
        aircraftType: form.aircraftType.trim(),
        aircraftRegistration: form.aircraftRegistration.trim().toUpperCase(),
        scheduledDepartureTime: dep.toISOString(),
        scheduledArrivalTime: arr.toISOString(),
      };

      if (editingId) {
        await api.put(`/api/flights/${editingId}`, payload);
        toast.success('Flight updated');
      } else {
        await api.post('/api/flights', payload);
        toast.success('Flight scheduled');
      }
      setDialogOpen(false);
      await fetchFlights();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelFlight = async (flight: Flight) => {
    if (flight.status === 'cancelled') return;
    if (!window.confirm(`Cancel flight ${flight.flightNumber}?`)) return;
    try {
      await api.delete(`/api/flights/${flight._id}`);
      toast.success('Flight cancelled');
      await fetchFlights();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not cancel');
    }
  };

  const handleSetFlightStatus = async (flight: Flight, next: Flight['status']) => {
    if (flight.status === next) return;
    if (flight.status === 'cancelled' || flight.status === 'completed') {
      toast.error('Cannot change status of a finished flight');
      return;
    }
    if (next === 'cancelled') {
      await handleCancelFlight(flight);
      return;
    }
    if (next === 'in_progress' && flight.status !== 'scheduled') {
      toast.error('Only scheduled flights can be marked in progress');
      return;
    }
    if (next === 'completed' && flight.status !== 'in_progress') {
      toast.error('Only in-progress flights can be marked completed');
      return;
    }
    try {
      await api.put(`/api/flights/${flight._id}`, { status: next });
      toast.success(
        next === 'in_progress' ? 'Flight marked in progress' : 'Flight marked completed'
      );
      await fetchFlights();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-muted';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Flight Management</h1>
            <p className="text-muted-foreground mt-1">Schedule and manage flights</p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Flight
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by flight number, airport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    className={statusFilter === status ? 'bg-primary text-primary-foreground' : ''}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Flights</CardTitle>
            <CardDescription>{filteredFlights.length} flights found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading flights...</div>
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No flights found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-foreground">Flight Number</TableHead>
                      <TableHead className="text-foreground">Route</TableHead>
                      <TableHead className="text-foreground">Aircraft</TableHead>
                      <TableHead className="text-foreground">Departure</TableHead>
                      <TableHead className="text-foreground">Arrival</TableHead>
                      <TableHead className="text-foreground">Crew Assigned</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFlights.map((flight) => (
                      <TableRow key={flight._id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-bold text-primary">{flight.flightNumber}</TableCell>
                        <TableCell className="text-foreground">
                          {flight.departureAirport} → {flight.arrivalAirport}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{flight.aircraftType}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(flight.scheduledDepartureTime)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(flight.scheduledArrivalTime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border">
                            {flight.crewAssigned?.length ?? 0} members
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(flight.status)}>
                            {flight.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/10"
                              onClick={() => setViewFlight(flight)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/10"
                              onClick={() => openEdit(flight)}
                              disabled={
                                flight.status === 'cancelled' || flight.status === 'completed'
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-foreground hover:bg-secondary"
                                  aria-label="Flight actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  disabled={flight.status !== 'scheduled'}
                                  onClick={() => void handleSetFlightStatus(flight, 'in_progress')}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Mark in progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={flight.status !== 'in_progress'}
                                  onClick={() => void handleSetFlightStatus(flight, 'completed')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark completed
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={
                                    flight.status === 'cancelled' ||
                                    flight.status === 'completed'
                                  }
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => void handleSetFlightStatus(flight, 'cancelled')}
                                >
                                  Cancel flight
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit flight' : 'Schedule flight'}</DialogTitle>
            <DialogDescription>Duration is calculated from departure and arrival times.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="fn">Flight number</Label>
              <Input
                id="fn"
                value={form.flightNumber}
                onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))}
                disabled={!!editingId}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="dep">Departure airport</Label>
                <Input
                  id="dep"
                  value={form.departureAirport}
                  onChange={(e) => setForm((f) => ({ ...f, departureAirport: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="arr">Arrival airport</Label>
                <Input
                  id="arr"
                  value={form.arrivalAirport}
                  onChange={(e) => setForm((f) => ({ ...f, arrivalAirport: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="act">Aircraft type</Label>
              <Input
                id="act"
                value={form.aircraftType}
                onChange={(e) => setForm((f) => ({ ...f, aircraftType: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg">Registration</Label>
              <Input
                id="reg"
                value={form.aircraftRegistration}
                onChange={(e) => setForm((f) => ({ ...f, aircraftRegistration: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="std">Scheduled departure</Label>
              <Input
                id="std"
                type="datetime-local"
                value={form.scheduledDepartureTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDepartureTime: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sta">Scheduled arrival</Label>
              <Input
                id="sta"
                type="datetime-local"
                value={form.scheduledArrivalTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledArrivalTime: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewFlight} onOpenChange={(o) => !o && setViewFlight(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flight {viewFlight?.flightNumber}</DialogTitle>
            <DialogDescription>Read-only details</DialogDescription>
          </DialogHeader>
          {viewFlight && (
            <div className="text-sm space-y-2 text-foreground">
              <p>
                <span className="text-muted-foreground">Route:</span>{' '}
                {viewFlight.departureAirport} → {viewFlight.arrivalAirport}
              </p>
              <p>
                <span className="text-muted-foreground">Aircraft:</span> {viewFlight.aircraftType}{' '}
                {viewFlight.aircraftRegistration ? `(${viewFlight.aircraftRegistration})` : ''}
              </p>
              <p>
                <span className="text-muted-foreground">Departure:</span>{' '}
                {formatDateTime(viewFlight.scheduledDepartureTime)}
              </p>
              <p>
                <span className="text-muted-foreground">Arrival:</span>{' '}
                {formatDateTime(viewFlight.scheduledArrivalTime)}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {viewFlight.status}
              </p>
              <p>
                <span className="text-muted-foreground">Crew slots:</span>{' '}
                {viewFlight.crewAssigned?.length ?? 0}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewFlight(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
