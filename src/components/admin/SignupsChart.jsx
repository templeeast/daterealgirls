import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import moment from 'moment';

export default function SignupsChart() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.MemberProfile.list(),
    initialData: [],
  });

  const chartData = useMemo(() => {
    if (!profiles.length) return [];

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      last30Days.push({ date, count: 0, label: moment().subtract(i, 'days').format('MMM D') });
    }

    profiles.forEach(p => {
      const created = moment(p.created_date).format('YYYY-MM-DD');
      const day = last30Days.find(d => d.date === created);
      if (day) day.count++;
    });

    return last30Days;
  }, [profiles]);

  const totalSignups = chartData.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay = chartData.length > 0 ? Math.round((totalSignups / chartData.length) * 10) / 10 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-64 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            New Signups — Last 30 Days
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {totalSignups} total signups · ~{avgPerDay} per day
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value) => [`${value} signups`, 'Count']}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}