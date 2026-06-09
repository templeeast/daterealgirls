import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

export default function WhopReturn() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout_status') || params.get('status');
  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-6">
        {isSuccess ? (
          <>
            <CheckCircle className="w-20 h-20 text-primary mx-auto" />
            <h1 className="font-heading text-3xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground text-lg">
              Welcome to Premium! Your subscription is now active. You can now browse and connect with all members.
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-20 h-20 text-destructive mx-auto" />
            <h1 className="font-heading text-3xl font-bold">Payment Failed</h1>
            <p className="text-muted-foreground text-lg">
              Something went wrong with your payment. Please try again or contact support if the issue persists.
            </p>
          </>
        )}
        <Button
          size="lg"
          className="rounded-full px-8"
          onClick={() => navigate(isSuccess ? '/my-profile' : '/')}
        >
          {isSuccess ? 'Go to My Profile' : 'Return to Home'}
        </Button>
      </div>
    </div>
  );
}