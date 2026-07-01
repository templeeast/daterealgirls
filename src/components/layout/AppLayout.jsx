import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import StripeIdentityGate from './StripeIdentityGate';
import AdMavenEmbed from '@/components/shared/AdMavenEmbed';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 md:pb-8">
        <Outlet />
      </main>
      <StripeIdentityGate />
      <AdMavenEmbed />
    </div>
  );
}