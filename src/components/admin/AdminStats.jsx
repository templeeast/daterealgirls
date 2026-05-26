import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Flag, HelpCircle } from 'lucide-react';

export default function AdminStats() {
  const { data: profiles } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.MemberProfile.list(),
    initialData: [],
  });

  const { data: reports } = useQuery({
    queryKey: ['allReports'],
    queryFn: () => base44.entities.UserReport.filter({ status: 'pending' }),
    initialData: [],
  });

  const { data: tickets } = useQuery({
    queryKey: ['allTickets'],
    queryFn: () => base44.entities.SupportTicket.filter({ status: 'open' }),
    initialData: [],
  });

  const pendingVerifications = profiles.filter(p => p.verification_status === 'pending' || p.verification_status === 'unverified').length;

  const stats = [
    { label: 'Total Members', value: profiles.length, icon: Users, color: 'text-primary' },
    { label: 'Unverified Members', value: pendingVerifications, icon: Shield, color: 'text-accent-foreground' },
    { label: 'Open Reports', value: reports.length, icon: Flag, color: 'text-destructive' },
    { label: 'Open Tickets', value: tickets.length, icon: HelpCircle, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold font-heading mt-1">{s.value}</p>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}