import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronRight, Shield, Users, CreditCard, MessageSquare, Heart, Settings, Bug, Globe, Trash2, RefreshCw, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useMyProfile from '@/hooks/useMyProfile';
import { base44 } from '@/api/base44Client';

const sections = [
  {
    id: 'auth',
    icon: Shield,
    title: 'Authentication & Onboarding',
    color: 'text-blue-500',
    items: [
      { id: 'auth-1', label: 'Unauthenticated visitor can view Landing page without errors' },
      { id: 'auth-2', label: 'Login button redirects to platform login and returns correctly' },
      { id: 'auth-3', label: 'New authenticated user (no profile) is redirected to /onboarding automatically' },
      { id: 'auth-4', label: 'Existing user with incomplete profile is redirected to /my-profile' },
      { id: 'auth-5', label: 'Existing user with complete profile is redirected to /browse' },
      { id: 'auth-6', label: 'Onboarding Step 1: display name, gender, DOB, country/city all required before proceeding' },
      { id: 'auth-7', label: 'Onboarding Step 1: submitting age under 18 shows error and blocks proceed' },
      { id: 'auth-8', label: 'Onboarding Step 2: bio, looking_for, interests selectable and saved' },
      { id: 'auth-9', label: 'Onboarding Step 3 (custom verify): selfie upload required to proceed' },
      { id: 'auth-10', label: 'Onboarding Step 3 (Stripe Identity): skippable and flow continues' },
      { id: 'auth-11', label: 'Onboarding Step 4: photo upload works for all 3 photo slots' },
      { id: 'auth-12', label: 'Onboarding Step 4: social links (Instagram, Facebook, TikTok) optional and saved' },
      { id: 'auth-13', label: 'Completing onboarding creates MemberProfile with profile_complete: true and redirects to /browse' },
      { id: 'auth-14', label: 'Attempting to re-visit /onboarding when profile exists redirects away' },
      { id: 'auth-15', label: 'Language selector on landing page changes UI language correctly (EN, ES, TH, ZH, DE, VI, PT, TL)' },
    ],
  },
  {
    id: 'browse',
    icon: Users,
    title: 'Browse & Discovery',
    color: 'text-purple-500',
    items: [
      { id: 'browse-1', label: 'Browse page loads and shows active, non-suspended, complete, non-rejected profiles only' },
      { id: 'browse-2', label: 'Current user\'s own profile is excluded from browse results' },
      { id: 'browse-3', label: 'Search by name, city, country, or bio keyword works correctly' },
      { id: 'browse-4', label: 'Gender filter filters results correctly (all / female / male)' },
      { id: 'browse-5', label: '"Looking for" filter works correctly' },
      { id: 'browse-6', label: 'Country/city filter narrows results correctly' },
      { id: 'browse-7', label: 'Age min/max filter works and only shows profiles within range' },
      { id: 'browse-8', label: 'Free-tier male: only sees up to the configured browse limit (default 25) profiles' },
      { id: 'browse-9', label: 'Free-tier male: profiles beyond limit show as blurred locked cards' },
      { id: 'browse-10', label: 'Free-tier male: UpgradePrompt banner is displayed at top and bottom' },
      { id: 'browse-11', label: 'Premium male or female: sees all filtered profiles without restriction' },
      { id: 'browse-12', label: 'Clicking a profile card navigates to /profile/:id' },
      { id: 'browse-13', label: 'Favoriting a profile from browse card works and heart icon toggles correctly' },
    ],
  },
  {
    id: 'profiles',
    icon: Users,
    title: 'Profile Viewing & My Profile',
    color: 'text-pink-500',
    items: [
      { id: 'profile-1', label: 'View Profile page loads and displays all profile fields correctly' },
      { id: 'profile-2', label: 'Only visible photos (photo_N_visible: true) are shown' },
      { id: 'profile-3', label: 'Report button on profile navigates to /report/:id' },
      { id: 'profile-4', label: 'Message button on profile starts or opens a conversation' },
      { id: 'profile-5', label: 'Favorite button on profile toggles correctly and persists' },
      { id: 'profile-6', label: 'My Profile page loads with all existing profile data pre-filled' },
      { id: 'profile-7', label: 'Updating display name, bio, location, interests saves correctly' },
      { id: 'profile-8', label: 'Photo upload/replace works for photo_2 and photo_3' },
      { id: 'profile-9', label: 'Photo visibility toggles (show/hide) work correctly' },
      { id: 'profile-10', label: 'Social media links update and save correctly' },
      { id: 'profile-11', label: 'Profile card badge reflects correct phase: Pending (unreviewed), Verified (approved + ID verified), Un-Verified (approved but not ID verified)' },
      { id: 'profile-12', label: 'Re-upload selfie and ID document on My Profile works and updates selfie_url_2 / id_document_url_2' },
      { id: 'profile-13', label: 'Incomplete profile warning banner shows when profile_complete is false' },
    ],
  },
  {
    id: 'messaging',
    icon: MessageSquare,
    title: 'Messaging & Chat',
    color: 'text-green-500',
    items: [
      { id: 'msg-1', label: 'Messages page loads and lists all conversations for the current user' },
      { id: 'msg-2', label: 'Unread count badges display correctly on conversation list' },
      { id: 'msg-3', label: 'Clicking a conversation navigates to /chat/:id' },
      { id: 'msg-4', label: 'Chat page loads conversation history in correct order' },
      { id: 'msg-5', label: 'Sending a message creates a Message record and updates the Conversation last_message' },
      { id: 'msg-6', label: 'Rate limiting: sending messages too fast triggers rate limit warning' },
      { id: 'msg-7', label: 'Real-time updates: new messages appear without requiring page refresh (subscription)' },
      { id: 'msg-8', label: 'Free-tier male cannot initiate or respond to messages (blocked/prompted to upgrade)' },
      { id: 'msg-9', label: 'Image sharing in chat works and displays image correctly' },
      { id: 'msg-10', label: 'Read receipts: unread_count resets when conversation is opened' },
    ],
  },
  {
    id: 'winks',
    icon: Heart,
    title: 'Winks',
    color: 'text-yellow-400',
    items: [
      { id: 'wink-1', label: 'Browse page: Wink (😉) icon button appears on each profile card' },
      { id: 'wink-2', label: 'Browse page: Free-tier male clicking Wink shows "Upgrade to Premium" toast and does NOT create a Wink record' },
      { id: 'wink-3', label: 'Browse page: Premium user clicking Wink creates a Wink record and button changes to "Winked" (disabled)' },
      { id: 'wink-4', label: 'Browse page: Wink button shows as already-sent (Winked) on page load if a wink was previously sent to that profile' },
      { id: 'wink-5', label: 'View Profile page: Wink button appears in the action bar alongside Message, Favorite, and Report' },
      { id: 'wink-6', label: 'View Profile page: Free-tier male clicking Wink shows upgrade toast and does not send wink' },
      { id: 'wink-7', label: 'View Profile page: Premium user clicking Wink sends successfully and button changes to "Winked"' },
      { id: 'wink-8', label: 'View Profile page: Wink count badge (😉 N winks) is visible under the profile location when winks > 0' },
      { id: 'wink-9', label: 'View Profile page: Wink count badge is NOT shown when viewing your own profile' },
      { id: 'wink-10', label: 'My Profile page: "Winks Received" card is shown with correct count when winks > 0' },
      { id: 'wink-11', label: 'My Profile page: "Winks Received" card is hidden when no winks have been received' },
      { id: 'wink-12', label: 'Wink entity: each record has correct sender_id, recipient_profile_id, sender_name, sender_photo' },
      { id: 'wink-13', label: 'Duplicate wink prevention: clicking Wink a second time shows "already winked" toast and does not create a duplicate record' },
    ],
  },
  {
    id: 'favorites',
    icon: Heart,
    title: 'Favorites',
    color: 'text-red-500',
    items: [
      { id: 'fav-1', label: 'Favorites page loads and shows all favorited profiles' },
      { id: 'fav-2', label: 'Removing a favorite from the favorites page works correctly' },
      { id: 'fav-3', label: 'Favoriting/unfavoriting from browse is reflected on the favorites page' },
      { id: 'fav-4', label: 'Clicking a favorite navigates to the correct profile page' },
    ],
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Payments & Subscriptions',
    color: 'text-yellow-500',
    items: [
      // --- Whop ---
      { id: 'pay-w1', label: 'WHOP: WhopButton renders for male users when payment_processor is "whop"' },
      { id: 'pay-w2', label: 'WHOP: Clicking WhopButton opens https://whop.com/checkout/{planId}/ in a new tab' },
      { id: 'pay-w3', label: 'WHOP DEV: Completing sandbox Whop checkout fires webhook and sets subscription_status to "active"' },
      { id: 'pay-w4', label: 'WHOP WEBHOOK: membership.went_valid event sets subscription_status="active", correct subscription_end_date, and saves whop_membership_id' },
      { id: 'pay-w5', label: 'WHOP WEBHOOK: membership.renewal event renews subscription and updates subscription_end_date' },
      { id: 'pay-w6', label: 'WHOP WEBHOOK: membership.went_invalid event sets subscription_status="expired"' },
      { id: 'pay-w7', label: 'WHOP WEBHOOK: profile lookup by whop_membership_id works correctly' },
      { id: 'pay-w8', label: 'WHOP WEBHOOK: fallback profile lookup by whop_user_id works' },
      { id: 'pay-w9', label: 'WHOP WEBHOOK: fallback profile lookup by email works when whop_membership_id and whop_user_id not found' },
      { id: 'pay-w10', label: 'WHOP WEBHOOK: returns 200 with "Profile not found, ignoring" when no profile matches — does not error' },
      { id: 'pay-w11', label: 'WHOP WEBHOOK: unauthorized request (wrong secret) returns 401' },
      { id: 'pay-w12', label: 'WHOP CANCEL: Cancel Subscription button is visible on My Profile when subscription_status is "active" and payment_processor is "whop"' },
      { id: 'pay-w13', label: 'WHOP CANCEL: CancelSubscriptionDialog opens and shows correct confirmation text' },
      { id: 'pay-w14', label: 'WHOP CANCEL: Confirming cancel calls whopCancelSubscription, sets status to "cancelled", and shows success toast' },
      { id: 'pay-w15', label: 'WHOP CANCEL: whopCancelSubscription calls DELETE /v5/memberships/{whop_membership_id} on Whop API' },
      { id: 'pay-w16', label: 'WHOP CANCEL: If whop_membership_id is missing, cancel returns a user-friendly error' },
      { id: 'pay-w17', label: 'WHOP UI: Active subscriber sees "Premium — Active" badge and correct renewal date on My Profile' },
      { id: 'pay-w18', label: 'WHOP UI: Active subscriber sees "Manage Billing ↗" link that opens https://whop.com/manage-memberships/ in a new tab' },
      { id: 'pay-w19', label: 'WHOP UI: After cancel, subscription card updates to show free/cancelled state without page reload' },
      // --- Authorize.net ---
      { id: 'pay-a1', label: 'ARB: Authorize.net inline card form works in sandbox mode' },
      { id: 'pay-a2', label: 'ARB: Authorize.net hosted page redirect works when authorizenet_use_hosted_page is enabled' },
      { id: 'pay-a3', label: 'ARB: Cancel subscription calls authorizeNetCancelSubscription when payment_processor is not "whop"' },
      // --- CodaPay ---
      { id: 'pay-c1', label: 'CODAPAY: CodaPay initPayment and checkStatus work correctly in sandbox mode' },
      // --- General ---
      { id: 'pay-g1', label: 'Free trial: claiming a free trial sets free_trial_claimed: true and cannot be claimed twice' },
      { id: 'pay-g2', label: 'expireSubscriptions function: marks subscriptions past end date as expired' },
      { id: 'pay-g3', label: 'sendRenewalReminders function: sends emails to subscriptions expiring soon' },
      { id: 'pay-g4', label: 'After successful payment (any processor), user gains full browse + messaging access immediately' },
      { id: 'pay-g5', label: 'Switching payment_processor in SiteConfig correctly changes the processor shown to users' },
      // --- Men\'s Subscription Toggle ---
      { id: 'pay-ms1', label: 'MEN SUB ON: When men_subscription_enabled is true, male users see the subscription/upgrade flow (FreeTrialButton, payment buttons, UpgradePrompt)' },
      { id: 'pay-ms2', label: 'MEN SUB ON: When men_subscription_enabled is true, free-tier men are limited to browse limit and blocked from messaging/winking' },
      { id: 'pay-ms3', label: 'MEN SUB ON: When men_subscription_enabled is true, men can subscribe via the active payment processor and gain full access' },
      { id: 'pay-ms4', label: 'MEN SUB OFF: When men_subscription_enabled is false, all men get free full access — no browse limit, no upgrade prompt, no payment buttons' },
      { id: 'pay-ms5', label: 'MEN SUB OFF: When men_subscription_enabled is false, men can message, wink, and browse freely without any payment restrictions' },
      { id: 'pay-ms6', label: 'MEN SUB TOGGLE OFF: After toggling men_subscription_enabled from ON to OFF, previously restricted men immediately gain full free access' },
      { id: 'pay-ms7', label: 'MEN SUB TOGGLE OFF: Existing paid male subscriptions remain active but men no longer need to pay to access features' },
      { id: 'pay-ms8', label: 'MEN SUB TOGGLE ON: After toggling men_subscription_enabled from OFF to ON, free men are immediately restricted and see upgrade prompts' },
      { id: 'pay-ms9', label: 'MEN SUB TOGGLE ON: Men who previously had a paid subscription (now expired/cancelled) return to restricted free tier access' },
    ],
  },
  {
    id: 'verification',
    icon: Shield,
    title: 'Profile Review & ID Verification',
    color: 'text-indigo-500',
    items: [
      { id: 'ver-1', label: 'Admin can see pending review queue in Admin Dashboard (profile_review_status: pending)' },
      { id: 'ver-2', label: 'Admin approves a profile: sets profile_review_status to "approved" AND verification_status to "verified"' },
      { id: 'ver-3', label: 'Admin rejects a profile: sets profile_review_status to "rejected"' },
      { id: 'ver-4', label: 'BADGE — Pending: Amber "Pending" badge appears on Browse/profile card when profile_review_status is not "approved" (new users, not yet reviewed)' },
      { id: 'ver-5', label: 'BADGE — Verified: Green "Verified" badge with Shield icon appears when profile_review_status is "approved" AND verification_status is "verified"' },
      { id: 'ver-6', label: 'BADGE — Un-Verified: Slate "Un-Verified" badge with AlertCircle icon appears when profile_review_status is "approved" AND verification_status is NOT "verified"' },
      { id: 'ver-7', label: 'FILTER — Rejected profiles (profile_review_status: "rejected" or verification_status: "rejected") do NOT appear in Browse results' },
      { id: 'ver-8', label: 'Private selfie and ID document URLs are only accessible to admins (not leaked in frontend)' },
      { id: 'ver-9', label: 'Stripe Identity: flow launches correctly when require_stripe_identity is enabled in SiteConfig' },
      { id: 'ver-10', label: 'Re-upload of selfie/ID on My Profile updates _url_2 fields and resets verification_status to "unverified" for re-review' },
    ],
  },
  {
    id: 'admin',
    icon: Settings,
    title: 'Admin Dashboard',
    color: 'text-orange-500',
    items: [
      { id: 'adm-1', label: 'Non-admin users see "Access Denied" when navigating to /admin' },
      { id: 'adm-2', label: 'Admin stats tab shows correct counts for members, verifications, reports, tickets' },
      { id: 'adm-3', label: 'Member Management: can search, filter, and view all member profiles' },
      { id: 'adm-4', label: 'Member Management: suspend member with reason saves and hides profile from browse' },
      { id: 'adm-5', label: 'Member Management: restore suspended member restores profile visibility' },
      { id: 'adm-6', label: 'Reports panel: admin can view, review, and update report status + action taken' },
      { id: 'adm-7', label: 'Tickets panel: admin can view support tickets and add admin response' },
      { id: 'adm-8', label: 'City Review panel: pending user-submitted cities are listed' },
      { id: 'adm-9', label: 'City Review: approving a city sets needs_review: false, reviewed: true' },
      { id: 'adm-10', label: 'City Review: rejecting a city deletes the record' },
      { id: 'adm-11', label: 'Site Settings: all fields save correctly (site name, logo, pricing, limits, modes)' },
      { id: 'adm-12', label: 'Site Settings: toggling demo_mode shows/hides beta banner on landing page' },
      { id: 'adm-13', label: 'Site Settings: toggling dev_mode shows/hides dev mode banner' },
      { id: 'adm-14', label: 'Site Settings: payment processor selector changes active processor in UI' },
      { id: 'adm-15', label: 'Site Settings: subscription migration tool triggers re-subscription flow for affected users' },
      { id: 'adm-16', label: 'Site Settings: toggling men_subscription_enabled ON/OFF immediately updates subscription flow for all male users' },
      { id: 'adm-17', label: 'Site Settings: toggling juicyads_enabled ON shows JuicyAds on women\'s profile pages when viewed by men' },
      { id: 'adm-18', label: 'Site Settings: toggling juicyads_enabled OFF hides all JuicyAds from women\'s profile pages immediately' },
      { id: 'adm-19', label: 'ADS: When juicyads_enabled is ON, male user viewing a female profile sees embedded JuicyAds' },
      { id: 'adm-20', label: 'ADS: When juicyads_enabled is ON, female user viewing a profile does NOT see ads' },
      { id: 'adm-21', label: 'ADS: When juicyads_enabled is ON, male user viewing a male profile does NOT see ads' },
      { id: 'adm-22', label: 'ADS: When juicyads_enabled is OFF, no users see ads on any profile page' },
    ],
  },
  {
    id: 'reporting',
    icon: Bug,
    title: 'Reporting & Support',
    color: 'text-rose-500',
    items: [
      { id: 'rep-1', label: 'Report Profile page: all report reasons available and form submits correctly' },
      { id: 'rep-2', label: 'Report is saved with correct reporter_id and reported_profile_id' },
      { id: 'rep-3', label: 'Support page: ticket form submits with category, subject, and description' },
      { id: 'rep-4', label: 'Support page: ticket appears in admin tickets panel after submission' },
      { id: 'rep-5', label: 'User can view their own submitted tickets and see admin responses' },
    ],
  },
  {
    id: 'legal',
    icon: Globe,
    title: 'Legal Pages & Footer',
    color: 'text-slate-500',
    items: [
      { id: 'legal-1', label: 'Privacy Policy page renders without errors' },
      { id: 'legal-2', label: 'Terms of Service page renders without errors' },
      { id: 'legal-3', label: 'Refund Policy page redirects to /terms correctly' },
      { id: 'legal-4', label: 'Shipping Policy page redirects to /terms correctly' },
      { id: 'legal-5', label: 'Contact Us page renders and contact form submits correctly' },
      { id: 'legal-6', label: 'All footer links navigate to correct pages' },
      { id: 'legal-7', label: 'Footer copyright year is current year' },
    ],
  },
  {
    id: 'promo',
    icon: Tag,
    title: 'Promo Codes & Token History',
    color: 'text-purple-500',
    items: [
      { id: 'promo-1', label: 'Admin: /admin/promo-codes page is accessible from Admin Dashboard header button' },
      { id: 'promo-2', label: 'Admin: Non-admin user navigating to /admin/promo-codes is redirected away' },
      { id: 'promo-3', label: 'Admin: Creating a new promo code saves to database with correct code (uppercased), tokens, type, and active status' },
      { id: 'promo-4', label: 'Admin: Editing an existing promo code updates all fields correctly' },
      { id: 'promo-5', label: 'Admin: Deactivating a promo code (toggle off) marks it inactive and it can no longer be redeemed' },
      { id: 'promo-6', label: 'Admin: Reactivating a promo code (toggle on) allows redemption again' },
      { id: 'promo-7', label: 'Admin: Deleting a promo code removes it from the list with confirmation prompt' },
      { id: 'promo-8', label: 'Admin: "Times Used" counter increments correctly each time a code is redeemed' },
      { id: 'promo-9', label: 'Admin: Setting max_uses and verifying the code is rejected once the limit is reached' },
      { id: 'promo-10', label: 'Admin: Setting an expires_at date in the past causes code to be rejected at checkout' },
      { id: 'promo-11', label: 'PURCHASE type code (e.g. FUNDATES): applying at token checkout grants correct bonus tokens' },
      { id: 'promo-12', label: 'PURCHASE type code: applying the same code a second time on the same account is rejected' },
      { id: 'promo-13', label: 'PURCHASE type code: applying a VERIFICATION-type code at checkout is rejected' },
      { id: 'promo-14', label: 'VERIFICATION type code (e.g. LAUNCH26): applying after ID is verified grants correct bonus tokens' },
      { id: 'promo-15', label: 'VERIFICATION type code: applying before ID is verified is rejected with appropriate error message' },
      { id: 'promo-16', label: 'VERIFICATION type code: applying a PURCHASE-type code to the verification promo field is rejected' },
      { id: 'promo-17', label: 'ANY type code: can be redeemed at both token checkout and verification promo fields' },
      { id: 'promo-18', label: 'Invalid/non-existent promo code shows a clear error message to the user' },
      { id: 'promo-19', label: 'Successful purchase without promo code creates a TokenTransaction record of type "purchase"' },
      { id: 'promo-20', label: 'Successful promo redemption creates a TokenTransaction record of type "promo" with correct promo_code field' },
      { id: 'promo-21', label: 'Payment History page: "Token Activity" tab shows purchase and promo transaction records for the current user' },
      { id: 'promo-22', label: 'Payment History page: "Payment Records" tab shows external processor payment history' },
      { id: 'promo-23', label: 'Payment History page: promo transactions display the promo code used in purple monospace text' },
      { id: 'promo-24', label: 'Payment History page: token amounts show green for positive (earned) and orange for negative (spent)' },
    ],
  },
  {
    id: 'automations',
    icon: RefreshCw,
    title: 'Automations & Data Lifecycle',
    color: 'text-emerald-500',
    items: [
      { id: 'auto-1', label: 'cleanupDeletedUser: Deleting a MemberProfile triggers automatic removal of all associated Conversations' },
      { id: 'auto-2', label: 'cleanupDeletedUser: Deleting a MemberProfile triggers automatic removal of all associated Messages' },
      { id: 'auto-3', label: 'cleanupDeletedUser: Deleting a MemberProfile triggers automatic removal of all associated Favorites (both given and received)' },
      { id: 'auto-4', label: 'cleanupDeletedUser: Deleting a MemberProfile triggers automatic removal of all associated Winks (both sent and received)' },
      { id: 'auto-5', label: 'cleanupDeletedUser: Deleting a MemberProfile triggers automatic deletion of Cloudinary photos (profile images, selfies, ID documents)' },
      { id: 'auto-6', label: 'cleanupDeletedUser: Deleting a MemberProfile does NOT delete the User record itself' },
      { id: 'auto-7', label: 'deleteOldMessages: Messages older than configured retention period (chat_retention_days) are automatically purged' },
      { id: 'auto-8', label: 'deleteOldMessages: Cloudinary images in deleted messages are also removed' },
      { id: 'auto-9', label: 'expireSubscriptions: Profiles with subscription_end_date in the past are automatically marked as "expired"' },
      { id: 'auto-10', label: 'sendRenewalReminders: Users with expiring subscriptions receive email reminders' },
      { id: 'auto-11', label: 'Bulk demo profile creation: 100 female demo profiles exist with unique, non-repeating Unsplash photos' },
      { id: 'auto-12', label: 'Bulk demo profile deletion: All demo profiles (demo_f*) can be bulk-deleted and cleanup automation fires correctly' },
    ],
  },
];

export default function TestPlan() {
  const { user } = useMyProfile();
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState(() => Object.fromEntries(sections.map(s => [s.id, true])));
  const [recordId, setRecordId] = useState(null);
  const saveTimer = useRef(null);

  // Load saved progress on mount
  useEffect(() => {
    base44.entities.TestPlanProgress.list().then(records => {
      if (records.length > 0) {
        setRecordId(records[0].id);
        setChecked(records[0].checked_items || {});
      }
    });
  }, []);

  // Debounced save to database
  const saveProgress = (newChecked) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (recordId) {
        await base44.entities.TestPlanProgress.update(recordId, { checked_items: newChecked });
      } else {
        const record = await base44.entities.TestPlanProgress.create({ checked_items: newChecked });
        setRecordId(record.id);
      }
    }, 500);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admins only.</p>
      </div>
    );
  }

  const toggle = (id) => {
    setChecked(prev => {
      const newChecked = { ...prev, [id]: !prev[id] };
      saveProgress(newChecked);
      return newChecked;
    });
  };
  const toggleSection = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((checkedCount / totalItems) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Test Plan & QA Checklist</h1>
        <p className="text-muted-foreground mb-4">Track manual testing across all app features before launch.</p>
        <div className="flex items-center gap-4 p-4 bg-card border rounded-xl">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{checkedCount} / {totalItems} tests passed</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary rounded-full h-2.5 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Badge variant={pct === 100 ? 'default' : pct >= 75 ? 'secondary' : 'outline'}>
            {pct === 100 ? '✅ All Passed' : pct >= 75 ? 'Almost Ready' : 'In Progress'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map(section => {
          const SectionIcon = section.icon;
          const sectionChecked = section.items.filter(item => checked[item.id]).length;
          const isExpanded = expanded[section.id];

          return (
            <div key={section.id} className="bg-card border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  <SectionIcon className={`w-5 h-5 ${section.color}`} />
                  <span className="font-semibold text-left">{section.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {sectionChecked}/{section.items.length}
                  </Badge>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="border-t divide-y">
                  {section.items.map(item => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <div className="mt-0.5 flex-shrink-0" onClick={() => toggle(item.id)}>
                        {checked[item.id]
                          ? <CheckSquare className="w-5 h-5 text-primary" />
                          : <Square className="w-5 h-5 text-muted-foreground" />
                        }
                      </div>
                      <span className={`text-sm leading-relaxed ${checked[item.id] ? 'line-through text-muted-foreground' : ''}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8">
        Progress is automatically saved to the database and persists across sessions.
      </p>
    </div>
  );
}