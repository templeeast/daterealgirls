import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export default function VerificationRequiredModal({ open, onClose, onVerify }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center font-heading">Identity Verification Required</DialogTitle>
          <DialogDescription className="text-center">
            This action requires you to verify your identity. It only takes a minute.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={() => { onVerify(); onClose(); }}>
            Verify My Identity
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}