import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Flag, HelpCircle, Settings, MapPin } from 'lucide-react';
import MemberManagement from '@/components/admin/MemberManagement';
import VerificationQueue from '@/components/admin/VerificationQueue';
import ReportsPanel from '@/components/admin/ReportsPanel';
import TicketsPanel from '@/components/admin/TicketsPanel';
import SiteSettings from '@/components/admin/SiteSettings';
import AdminStats from '@/components/admin/AdminStats';
import CityReviewPanel from '@/components/admin/CityReviewPanel';
import useMyProfile from '@/hooks/useMyProfile';

export default function AdminDashboard() {
  const { user } = useMyProfile();

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-heading text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage members, moderation, and platform settings.</p>

      <AdminStats />

      <Tabs defaultValue="members" className="mt-8">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="members" className="gap-2"><Users className="w-4 h-4" /> Members</TabsTrigger>
          <TabsTrigger value="verification" className="gap-2"><Shield className="w-4 h-4" /> Verification</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><Flag className="w-4 h-4" /> Reports</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2"><HelpCircle className="w-4 h-4" /> Tickets</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
          <TabsTrigger value="cities" className="gap-2"><MapPin className="w-4 h-4" /> Cities</TabsTrigger>
        </TabsList>

        <TabsContent value="members"><MemberManagement /></TabsContent>
        <TabsContent value="verification"><VerificationQueue /></TabsContent>
        <TabsContent value="reports"><ReportsPanel /></TabsContent>
        <TabsContent value="tickets"><TicketsPanel /></TabsContent>
        <TabsContent value="settings"><SiteSettings /></TabsContent>
        <TabsContent value="cities"><CityReviewPanel /></TabsContent>
      </Tabs>
    </div>
  );
}