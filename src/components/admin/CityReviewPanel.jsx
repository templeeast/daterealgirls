import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CityReviewPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities-pending'],
    queryFn: () => base44.entities.City.filter({ needs_review: true, reviewed: false }),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.City.update(id, { reviewed: true, needs_review: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities-pending'] });
      toast({ title: 'City approved' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.City.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities-pending'] });
      toast({ title: 'City rejected and removed' });
    },
  });

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  if (cities.length === 0) {
    return (
      <div className="py-16 text-center">
        <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No cities pending review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{cities.length} city/cities submitted by users are awaiting review.</p>
      {cities.map(city => (
        <div key={city.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{city.name}</p>
              <p className="text-sm text-muted-foreground">{city.country} {city.country_code && `(${city.country_code})`}</p>
            </div>
            <Badge variant="outline" className="text-yellow-600 border-yellow-400">Pending Review</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-400 hover:bg-green-50"
              onClick={() => approveMutation.mutate(city.id)}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => rejectMutation.mutate(city.id)}
              disabled={rejectMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}