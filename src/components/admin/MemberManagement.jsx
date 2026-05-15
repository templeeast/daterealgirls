import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Ban, Eye, RotateCcw } from 'lucide-react';

export default function MemberManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [suspendDialog, setSuspendDialog] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.MemberProfile.list('-created_date', 100),
    initialData: [],
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspend }) =>
      base44.entities.MemberProfile.update(id, {
        is_suspended: suspend,
        suspension_reason: suspend ? suspendReason : '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      setSuspendDialog(null);
      setSuspendReason('');
    },
  });

  const filtered = profiles.filter(p => {
    if (statusFilter === 'suspended' && !p.is_suspended) return false;
    if (statusFilter === 'active' && p.is_suspended) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.display_name?.toLowerCase().includes(s) || p.location_country?.toLowerCase().includes(s);
    }
    return true;
  });

  const verificationColors = {
    unverified: 'bg-muted text-muted-foreground',
    pending: 'bg-accent text-accent-foreground',
    verified: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className={p.is_suspended ? 'opacity-60' : ''}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.photo_1 ? (
                      <img src={p.photo_1} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{p.display_name}</p>
                      <p className="text-xs text-muted-foreground">Age: {p.age}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-sm">{p.gender}</TableCell>
                <TableCell className="text-sm">{[p.location_city, p.location_country].filter(Boolean).join(', ') || '—'}</TableCell>
                <TableCell>
                  <Badge className={verificationColors[p.verification_status] + ' text-xs'}>
                    {p.verification_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.is_suspended ? (
                    <Badge variant="destructive" className="text-xs">Suspended</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {p.is_suspended ? (
                      <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => suspendMutation.mutate({ id: p.id, suspend: false })}>
                        <RotateCcw className="w-3 h-3" /> Restore
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs gap-1 text-destructive" onClick={() => setSuspendDialog(p)}>
                        <Ban className="w-3 h-3" /> Suspend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendDialog} onOpenChange={() => setSuspendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {suspendDialog?.display_name}?</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Reason for suspension..."
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => suspendMutation.mutate({ id: suspendDialog.id, suspend: true })}>
              Suspend Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}