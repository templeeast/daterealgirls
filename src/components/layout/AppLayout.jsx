import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-24 md:pb-8">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}