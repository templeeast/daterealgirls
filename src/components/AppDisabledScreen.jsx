import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AppDisabledScreen({ message }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6 text-center">
      <AlertTriangle className="w-14 h-14 text-destructive mb-6" />
      <h1 className="font-heading text-2xl font-bold mb-3">Application Unavailable</h1>
      <p className="text-muted-foreground max-w-md leading-relaxed">
        {message || "The application is temporarily unavailable due to maintenance. We'll be back online shortly. Thank you for your patience."}
      </p>
    </div>
  );
}