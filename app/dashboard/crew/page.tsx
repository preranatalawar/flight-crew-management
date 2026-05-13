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
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

const POSITIONS = ['captain', 'first_officer', 'flight_engineer', 'cabin_crew'] as const;
const CREW_STATUSES = ['active', 'on_leave', 'inactive', 'retired'] as const;

interface CrewMember {
  _id: string;
  firstName: string;
  lastName: string;
  position: string;
  employeeId: string;
  status: string;
  licenseExpiryDate?: string;
  dateOfBirth?: string;
  joinDate?: string;
  basedAt?: string;
  licenseNumber?: string;
}

function toDateInput(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const emptyForm = () => ({
  employeeId: '',
  firstName: '',
  lastName: '',
  position: 'captain' as (typeof POSITIONS)[number],
  status: 'active' as (typeof CREW_STATUSES)[number],
  licenseNumber: '',
  dateOfBirth: '1990-01-01',
  joinDate: new Date().toISOString().slice(0, 10),
  licenseExpiryDate: '',
  basedAt: 'HQ',
});

export default function CrewManagementPage() {
  const { user, isLoading: sessionLoading } = useRequireSession();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [filteredCrew, setFilteredCrew] = useState<CrewMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!sessionLoading && user) {
      void fetchCrew();
    }
  }, [sessionLoading, user]);

  const fetchCrew = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/crew');
      setCrew(response.data.crewMembers);
      setFilteredCrew(response.data.crewMembers);
    } catch (error) {
      console.error('Error fetching crew:', error);
      toast.error('Could not load crew');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = crew;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredCrew(filtered);
  }, [searchTerm, statusFilter, crew]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (member: CrewMember) => {
    setEditingId(member._id);
    setForm({
      employeeId: member.employeeId,
      firstName: member.firstName,
      lastName: member.lastName,
      position: (POSITIONS.includes(member.position as (typeof POSITIONS)[number])
        ? member.position
        : 'captain') as (typeof POSITIONS)[number],
      status: (CREW_STATUSES.includes(member.status as (typeof CREW_STATUSES)[number])
        ? member.status
        : 'active') as (typeof CREW_STATUSES)[number],
      licenseNumber: member.licenseNumber || '',
      dateOfBirth: toDateInput(member.dateOfBirth) || '1990-01-01',
      joinDate: toDateInput(member.joinDate) || new Date().toISOString().slice(0, 10),
      licenseExpiryDate: toDateInput(member.licenseExpiryDate),
      basedAt: member.basedAt || 'HQ',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employeeId.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.licenseNumber.trim()) {
      toast.error('Fill in employee ID, name, and license number');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        employeeId: form.employeeId.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        position: form.position,
        status: form.status,
        licenseNumber: form.licenseNumber.trim(),
        dateOfBirth: form.dateOfBirth,
        joinDate: form.joinDate,
        licenseExpiryDate: form.licenseExpiryDate || undefined,
        basedAt: form.basedAt.trim() || 'HQ',
      };

      if (editingId) {
        await api.put(`/api/crew/${editingId}`, payload);
        toast.success('Crew member updated');
      } else {
        await api.post('/api/crew', payload);
        toast.success('Crew member added');
      }
      setDialogOpen(false);
      await fetchCrew();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (member: CrewMember) => {
    if (!window.confirm(`Deactivate ${member.firstName} ${member.lastName}?`)) return;
    try {
      await api.delete(`/api/crew/${member._id}`);
      toast.success('Crew member deactivated');
      await fetchCrew();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not deactivate');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'on_leave':
        return 'bg-amber-500/20 text-amber-400';
      case 'inactive':
        return 'bg-red-500/20 text-red-400';
      case 'retired':
        return 'bg-slate-500/20 text-slate-400';
      default:
        return 'bg-muted';
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'captain':
        return 'bg-blue-500/20 text-blue-400';
      case 'first_officer':
        return 'bg-purple-500/20 text-purple-400';
      case 'flight_engineer':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'cabin_crew':
        return 'bg-pink-500/20 text-pink-400';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crew Management</h1>
            <p className="text-muted-foreground mt-1">Manage flight crew members and certifications</p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Crew Member
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', ...CREW_STATUSES].map((status) => (
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
            <CardTitle>Crew Members</CardTitle>
            <CardDescription>{filteredCrew.length} crew members found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading crew members...</div>
              </div>
            ) : filteredCrew.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No crew members found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-foreground">Name</TableHead>
                      <TableHead className="text-foreground">Position</TableHead>
                      <TableHead className="text-foreground">Employee ID</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">License Expiry</TableHead>
                      <TableHead className="text-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCrew.map((member) => (
                      <TableRow key={member._id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium text-foreground">
                          {member.firstName} {member.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPositionColor(member.position)}>
                            {member.position.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.employeeId}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.licenseExpiryDate
                            ? new Date(member.licenseExpiryDate).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10"
                            onClick={() => openEdit(member)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeactivate(member)}
                            disabled={member.status === 'inactive'}
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit crew member' : 'Add crew member'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update details below.' : 'Creates a crew profile linked to your account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="emp-id">Employee ID</Label>
              <Input
                id="emp-id"
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                disabled={!!editingId}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fn">First name</Label>
                <Input
                  id="fn"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ln">Last name</Label>
                <Input
                  id="ln"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Position</Label>
              <Select
                value={form.position}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, position: v as (typeof POSITIONS)[number] }))
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as (typeof CREW_STATUSES)[number] }))
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lic">License number</Label>
              <Input
                id="lic"
                value={form.licenseNumber}
                onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jd">Join date</Label>
                <Input
                  id="jd"
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lex">License expiry (optional)</Label>
              <Input
                id="lex"
                type="date"
                value={form.licenseExpiryDate}
                onChange={(e) => setForm((f) => ({ ...f, licenseExpiryDate: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="base">Based at</Label>
              <Input
                id="base"
                value={form.basedAt}
                onChange={(e) => setForm((f) => ({ ...f, basedAt: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
