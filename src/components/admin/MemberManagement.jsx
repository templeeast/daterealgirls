import React, { useState } from 'react';
import VerificationDetail from '@/components/admin/VerificationDetail';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Ban, Eye, RotateCcw, X, Instagram, Facebook, MapPin, Calendar, User, ExternalLink, Trash2, Shield, Loader2 } from 'lucide-react';

export default function MemberManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [suspendDialog, setSuspendDialog] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [detailMember, setDetailMember] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [verifyDialog, setVerifyDialog] = useState(null);

  const openDetailMember = async (p) => {
    setDetailMember(p);
    setSignedUrls({});
    const fields = ['selfie_url', 'selfie_url_2', 'id_document_url', 'id_document_url_2'];
    const results = await Promise.all(
      fields.map(async (field) => {
        if (!p[field]) return [field, null];
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: p[field] });
        return [field, signed_url];
      })
    );
    setSignedUrls(Object.fromEntries(results.filter(([, v]) => v)));
  };

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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteMemberAndUser', { profileId: id }),
    onSuccess: (res) => {
      if (res.data?.error) {
        toast.error(res.data.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      setDeleteDialog(null);
      toast.success('Member deleted successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to delete member');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, reviewStatus, verificationStatus }) =>
      base44.entities.MemberProfile.update(id, {
        profile_review_status: reviewStatus,
        verification_status: verificationStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      setVerifyDialog(null);
    },
  });

  const filtered = profiles.filter(p => {
    if (statusFilter === 'suspended' && !p.is_suspended) return false;
    if (statusFilter === 'active' && p.is_suspended) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.display_name?.toLowerCase().includes(s) && !p.location_country?.toLowerCase().includes(s)) return false;
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
              <TableRow key={p.id} className={`cursor-pointer hover:bg-muted/50 ${p.is_suspended ? 'opacity-60' : ''}`} onClick={() => openDetailMember(p)}>
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
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setVerifyDialog(p)} title="View Verification">
                      <Shield className="w-3 h-3" />
                    </Button>
                    {p.is_suspended ? (
                      <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => suspendMutation.mutate({ id: p.id, suspend: false })}>
                        <RotateCcw className="w-3 h-3" /> Restore
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs gap-1 text-destructive" onClick={() => setSuspendDialog(p)}>
                        <Ban className="w-3 h-3" /> Suspend
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs gap-1 text-destructive" onClick={() => setDeleteDialog(p)} title="Delete Member">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Member Detail Dialog */}
      <Dialog open={!!detailMember} onOpenChange={() => setDetailMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {detailMember?.photo_1 ? (
                <img src={detailMember.photo_1} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><User className="w-5 h-5 text-muted-foreground" /></div>
              )}
              {detailMember?.display_name}
            </DialogTitle>
          </DialogHeader>

          {detailMember && (
            <div className="space-y-5">
              {/* Photos */}
              <div className="flex gap-2 flex-wrap">
                {[detailMember.photo_1, detailMember.photo_2, detailMember.photo_3].filter(Boolean).map((url, i) => (
                  <img key={i} src={url} className="w-24 h-24 rounded-lg object-cover border" alt="" />
                ))}
              </div>

              {/* ID Verification Documents */}
              {(signedUrls.selfie_url || signedUrls.selfie_url_2 || signedUrls.id_document_url || signedUrls.id_document_url_2) && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">ID Verification Documents</p>
                  <div className="grid grid-cols-2 gap-3">
                    {signedUrls.selfie_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Selfie (original)</p>
                        <a href={signedUrls.selfie_url} target="_blank" rel="noreferrer">
                          <img src={signedUrls.selfie_url} className="w-full h-36 rounded-lg object-cover border hover:opacity-80 transition-opacity" alt="Selfie" />
                        </a>
                      </div>
                    )}
                    {signedUrls.selfie_url_2 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Selfie (re-upload)</p>
                        <a href={signedUrls.selfie_url_2} target="_blank" rel="noreferrer">
                          <img src={signedUrls.selfie_url_2} className="w-full h-36 rounded-lg object-cover border hover:opacity-80 transition-opacity" alt="Selfie 2" />
                        </a>
                      </div>
                    )}
                    {signedUrls.id_document_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Govt ID (original)</p>
                        <a href={signedUrls.id_document_url} target="_blank" rel="noreferrer">
                          <img src={signedUrls.id_document_url} className="w-full h-36 rounded-lg object-cover border hover:opacity-80 transition-opacity" alt="Govt ID" />
                        </a>
                      </div>
                    )}
                    {signedUrls.id_document_url_2 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Govt ID (re-upload)</p>
                        <a href={signedUrls.id_document_url_2} target="_blank" rel="noreferrer">
                          <img src={signedUrls.id_document_url_2} className="w-full h-36 rounded-lg object-cover border hover:opacity-80 transition-opacity" alt="Govt ID 2" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Core Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" /> <span className="font-medium text-foreground capitalize">{detailMember.gender}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /> Age: <span className="font-medium text-foreground">{detailMember.age || '—'}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-2"><MapPin className="w-4 h-4" /> <span className="font-medium text-foreground">{[detailMember.location_city, detailMember.location_country].filter(Boolean).join(', ') || '—'}</span></div>
              </div>

              {/* Bio */}
              {detailMember.bio && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{detailMember.bio}</p>
                </div>
              )}

              {/* Interests */}
              {detailMember.interests?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {detailMember.interests.map(i => (
                      <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social */}
              {(detailMember.instagram || detailMember.facebook || detailMember.tiktok) && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Social Media</p>
                  <div className="flex flex-col gap-1 text-sm">
                    {detailMember.instagram && <span>📸 Instagram: @{detailMember.instagram}</span>}
                    {detailMember.facebook && <span>📘 Facebook: {detailMember.facebook}</span>}
                    {detailMember.tiktok && <span>🎵 TikTok: @{detailMember.tiktok}</span>}
                  </div>
                </div>
              )}

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={verificationColors[detailMember.verification_status] + ' cursor-pointer hover:opacity-80 transition-opacity'}
                  onClick={() => { setDetailMember(null); setVerifyDialog(detailMember); }}
                  title="Click to view verification details"
                >
                  <Shield className="w-3 h-3 mr-1" /> Verification: {detailMember.verification_status}
                </Badge>
                <Badge variant={detailMember.is_suspended ? 'destructive' : 'secondary'}>
                  {detailMember.is_suspended ? 'Suspended' : 'Active'}
                </Badge>
                {detailMember.subscription_status && (
                  <Badge variant="outline">Sub: {detailMember.subscription_status}</Badge>
                )}
                {detailMember.looking_for && (
                  <Badge variant="outline">Looking for: {detailMember.looking_for}</Badge>
                )}
              </div>

              {/* Suspension Reason */}
              {detailMember.is_suspended && detailMember.suspension_reason && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <strong>Suspension reason:</strong> {detailMember.suspension_reason}
                </div>
              )}

              {/* Email */}
              {detailMember.created_by && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Email</p>
                  <p className="text-sm">{detailMember.created_by}</p>
                </div>
              )}

              {/* Joined */}
              <p className="text-xs text-muted-foreground">
                Joined: {new Date(detailMember.created_date).toLocaleDateString()}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailMember(null)}>Close</Button>
            {detailMember?.is_suspended ? (
              <Button variant="secondary" onClick={() => { suspendMutation.mutate({ id: detailMember.id, suspend: false }); setDetailMember(null); }}>
                <RotateCcw className="w-4 h-4 mr-1" /> Restore Member
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => { setDetailMember(null); setSuspendDialog(detailMember); }}>
                <Ban className="w-4 h-4 mr-1" /> Suspend Member
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteDialog?.display_name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this member's profile and user account, along with all their messages, conversations, winks, and favorites. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteDialog.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-1" /> Delete Member</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={!!verifyDialog} onOpenChange={() => setVerifyDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {verifyDialog && (
            <VerificationDetail
              profile={verifyDialog}
              onBack={() => setVerifyDialog(null)}
              onVerify={(id, reviewStatus, verificationStatus) => verifyMutation.mutate({ id, reviewStatus, verificationStatus })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}