import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import useMyProfile from '@/hooks/useMyProfile';

const ACCOUNT_GROUPS = [
  {
    stateLabel: 'Incomplete-Profile',
    stateDesc: 'profile_complete = false — tests redirect-to-onboarding, incomplete profile warnings, ProfileCompleteGuard gating.',
    accounts: [
      {
        gender: 'Male',
        displayName: 'Charlie Frog',
        email: 'charliefrog@clevo.testinator.com',
        userId: '6a5d47f8bbb882788e5bb535',
        profileId: '6a5d48555394c61fad986127',
        tagId: '(none — onboarding not completed)',
        age: 52,
        location: 'Houston, United States',
        profileComplete: false,
        verification: 'unverified (didit: pending)',
        reviewStatus: 'pending',
        tokens: 0,
        browseAll: 'not active',
        suspended: false,
      },
      {
        gender: 'Female',
        displayName: 'Leena Bunny',
        email: 'leenabunny@clevo.testinator.com',
        userId: '6a5e2c12c3af69ae2e86dcaa',
        profileId: '6a5e2c9befc6c5458d99d551',
        tagId: '(none — onboarding not completed)',
        age: 27,
        location: 'Miami, United States',
        profileComplete: false,
        verification: 'unverified (didit: not started)',
        reviewStatus: 'pending',
        tokens: 0,
        browseAll: 'not active',
        suspended: false,
      },
    ],
  },
  {
    stateLabel: 'Unverified',
    stateDesc: 'profile_complete = true, verification_status = "unverified" — tests unverified browse gate, verification prompt banners, locked cards, "Verify to unlock" CTA.',
    accounts: [
      {
        gender: 'Male',
        displayName: 'Sam',
        email: 'samhain@clevo.testinator.com',
        userId: '6a56b3e8f6c50ec97dc662fb',
        profileId: '6a5a6038c66f77a513d182b3',
        tagId: '@DRG-SJZM6Y',
        age: 28,
        location: 'Atlanta, United States',
        profileComplete: true,
        verification: 'unverified (didit: not started)',
        reviewStatus: 'pending',
        tokens: 1000,
        browseAll: 'not active',
        suspended: false,
      },
      {
        gender: 'Female',
        displayName: 'Bambi Bunny Test',
        email: 'bambibunny@clevo.testinator.com',
        userId: '6a5cd60059d3ec19bc4faab6',
        profileId: '6a5cd71c1590dcc864c6bb43',
        tagId: '@DRG-YRP92S',
        age: 31,
        location: 'Los Angeles, United States',
        profileComplete: true,
        verification: 'unverified (didit: Approved — but profile not verified)',
        reviewStatus: 'pending',
        tokens: 1000,
        browseAll: 'not active',
        suspended: false,
        note: 'didit_verification_status is "Approved" but verification_status is still "unverified" — possibly flagged for gender/age review.',
      },
    ],
  },
  {
    stateLabel: 'Verified (browse-all active)',
    stateDesc: 'verification_status = "verified", browse_unlocked_until is in the future — tests full browse-all access, no token gating on browse, ad-free experience.',
    accounts: [
      {
        gender: 'Male',
        displayName: 'Joe',
        email: 'joetiger@clevo.testinator.com',
        userId: '6a5d3f96793c5309deff1c59',
        profileId: '6a5d4029481e6d196eff009a',
        tagId: '@DRG-O055EL',
        age: 41,
        location: 'Cleveland, United States',
        profileComplete: true,
        verification: 'verified (didit: Approved)',
        reviewStatus: 'approved',
        tokens: 0,
        browseAll: 'active (until 2026-07-26 21:30 UTC)',
        suspended: false,
        note: 'Bio: "I am a dummy account setup for testing". Has active browse-all — useful for testing unrestricted browse experience.',
      },
    ],
  },
  {
    stateLabel: 'Verified (no browse-all)',
    stateDesc: 'verification_status = "verified", browse_unlocked_until expired or null — tests verified-but-locked interaction gate, BrowseAllDialog from profile page.',
    accounts: [
      {
        gender: 'Male',
        displayName: 'Steve',
        email: 'smaier@cloudevolution.dev',
        userId: '6a075fa1d43a688621123d27',
        profileId: '6a0881c9c0125f3307b45aba',
        tagId: '@DRG-20FOL0',
        age: 69,
        location: 'Pace, USA',
        profileComplete: true,
        verification: 'verified (didit: Approved)',
        reviewStatus: 'approved',
        tokens: 9454,
        browseAll: 'expired (was active until 2026-07-19 23:57 UTC)',
        suspended: false,
        note: 'Has ample tokens (9,454) — useful for testing browse-all purchase mid-test.',
      },
      {
        gender: 'Female',
        displayName: 'Yumi Bunny',
        email: 'yumibunny@clevo.testinator.com',
        userId: '6a4e815deb14ff6fcd303bfa',
        profileId: '6a4e81e37a80bde341f11ecc',
        tagId: '@DRG-YUMIBUNNY',
        age: 34,
        location: 'San Diego, United States',
        profileComplete: true,
        verification: 'verified (didit: Approved)',
        reviewStatus: 'pending (profile approved via verification)',
        tokens: 5795,
        browseAll: 'expired (was active until 2026-07-16 01:35 UTC)',
        suspended: false,
      },
    ],
  },
];

const SUMMARY_ROWS = [
  { state: 'Incomplete-Profile', gender: 'Male', name: 'Charlie Frog', email: 'charliefrog@clevo.testinator.com' },
  { state: 'Incomplete-Profile', gender: 'Female', name: 'Leena Bunny', email: 'leenabunny@clevo.testinator.com' },
  { state: 'Unverified', gender: 'Male', name: 'Sam', email: 'samhain@clevo.testinator.com' },
  { state: 'Unverified', gender: 'Female', name: 'Bambi Bunny Test', email: 'bambibunny@clevo.testinator.com' },
  { state: 'Verified (browse-all)', gender: 'Male', name: 'Joe', email: 'joetiger@clevo.testinator.com' },
  { state: 'Verified (no browse)', gender: 'Male', name: 'Steve', email: 'smaier@cloudevolution.dev' },
  { state: 'Verified (no browse)', gender: 'Female', name: 'Yumi Bunny', email: 'yumibunny@clevo.testinator.com' },
];

const DB_COUNTS = [
  { state: 'Incomplete-Profile', counts: '1 male, 1 female (2 total)' },
  { state: 'Unverified (clean)', counts: '1 male, 4 females (5 total)' },
  { state: 'Verified (no browse)', counts: '3 males, 38 females (41 total)' },
];

function AccountCard({ account }) {
  const genderColor = account.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge className={genderColor}>{account.gender}</Badge>
            {account.displayName}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{account.email}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="grid grid-cols-[120px_1fr] gap-x-2">
          <span className="text-muted-foreground">User ID:</span><code className="text-xs">{account.userId}</code>
          <span className="text-muted-foreground">Profile ID:</span><code className="text-xs">{account.profileId}</code>
          <span className="text-muted-foreground">Tag ID:</span><span className="font-mono text-xs">{account.tagId}</span>
          <span className="text-muted-foreground">Age:</span><span>{account.age}</span>
          <span className="text-muted-foreground">Location:</span><span>{account.location}</span>
          <span className="text-muted-foreground">Profile Complete:</span><span>{account.profileComplete ? 'true' : 'false'}</span>
          <span className="text-muted-foreground">Verification:</span><span>{account.verification}</span>
          <span className="text-muted-foreground">Review Status:</span><span>{account.reviewStatus}</span>
          <span className="text-muted-foreground">Tokens:</span><span>{account.tokens.toLocaleString()}</span>
          <span className="text-muted-foreground">Browse-All:</span><span>{account.browseAll}</span>
          <span className="text-muted-foreground">Suspended:</span><span>{account.suspended ? 'yes' : 'no'}</span>
        </div>
        {account.note && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">⚠️ {account.note}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TestAccountsChart() {
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="font-heading text-3xl font-bold">Test Account Reference Chart</h1>
      </div>
      <p className="text-muted-foreground mb-2">Profile-viewing test accounts for QA. Log in with the email below for the account state you need.</p>
      <p className="text-xs text-muted-foreground mb-8">Generated: 2026-07-20 10:11 AM (America/New_York) · Passwords are managed by the platform auth system.</p>

      {/* Account state groups */}
      <div className="space-y-8 mb-8">
        {ACCOUNT_GROUPS.map((group, i) => (
          <div key={i}>
            <div className="mb-3">
              <h2 className="font-heading text-lg font-semibold">State {i + 1}: {group.stateLabel}</h2>
              <p className="text-sm text-muted-foreground">{group.stateDesc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.accounts.map((acc, j) => <AccountCard key={j} account={acc} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary table */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Summary Table</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2 pr-4">Gender</th>
                  <th className="py-2 pr-4">Display Name</th>
                  <th className="py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {SUMMARY_ROWS.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">{row.state}</td>
                    <td className="py-2 pr-4">{row.gender}</td>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 font-mono text-xs">{row.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DB counts */}
      <Card>
        <CardHeader><CardTitle className="text-base">Database Counts (available accounts per state)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5 text-sm">
            {DB_COUNTS.map((row, i) => (
              <div key={i} className="flex justify-between border-b last:border-0 py-1.5">
                <span className="text-muted-foreground">{row.state}:</span>
                <span>{row.counts}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}