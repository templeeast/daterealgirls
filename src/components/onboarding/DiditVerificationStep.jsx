import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';

const calculateAge = (dob) => {
  if (!dob) return null;
  const [year, month, day] = dob.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) age--;
  return age;
};

export default function DiditVerificationStep({ form, config }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    try {
      const me = await base44.auth.me();
      const profiles = await base44.entities.MemberProfile.filter({ user_id: me.id });
      let profile = profiles[0];

      // During onboarding the profile may not exist yet — create it now
      // so we have an ID to pass to Didit. handleSubmit will update (not duplicate) later.
      if (!profile) {
        const age = calculateAge(form.date_of_birth);
        profile = await base44.entities.MemberProfile.create({
          ...form,
          user_id: me.id,
          age,
          verification_status: 'unverified',
          is_active: true,
          is_suspended: false,
          profile_complete: false,
          tokens: config?.welcome_tokens ?? 0,
        });
      }

      const res = await base44.functions.invoke('createDiditSession', { memberId: profile.id });
      const result = res.data;
      if (!result?.url) {
        setError('Could not start verification. Please try again.');
        setLoading(false);
        return;
      }

      await base44.entities.MemberProfile.update(profile.id, {
        didit_session_id: result.session_id,
        didit_verification_status: 'pending',
      });

      window.location.href = result.url;
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-lg font-semibold">Identity Verification</h3>
        <p className="text-sm text-muted-foreground">
          You will be redirected to our secure identity verification partner to complete a quick document + selfie check.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        variant="default"
        size="lg"
        onClick={handleVerify}
        disabled={loading}
        className="gap-2 w-full"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Launching verification...</>
        ) : (
          <><Shield className="w-4 h-4" /> Verify My Identity</>
        )}
      </Button>
    </div>
  );
}