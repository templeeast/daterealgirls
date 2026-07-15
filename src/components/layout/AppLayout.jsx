import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import InstallPrompt from '@/components/shared/InstallPrompt';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 md:pb-8">
        <Outlet />
      </main>
      <MobileBottomNav />
      <InstallPrompt />
    </div>
  );
}