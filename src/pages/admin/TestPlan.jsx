import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronRight, Shield, Users, CreditCard, MessageSquare, Heart, Settings, Bug, Globe, Trash2, RefreshCw, Tag, Camera, Lock, Image, Key, Link, Monitor, Video, MapPin, EyeOff, Coffee } from 'lucide-react';
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
      { id: 'auth-3', label: 'New authenticated user (no profile) sees the Landing page when visiting the base URL — NOT auto-redirected to onboarding' },
      { id: 'auth-3a', label: 'Landing page shows a prompt banner for authenticated users with an incomplete profile, linking to onboarding' },
      { id: 'auth-3b', label: 'New authenticated user clicking "Start Browsing" on Landing is redirected to /onboarding (profile not complete)' },
      { id: 'auth-3c', label: 'Authenticated user with complete profile clicking "Start Browsing" navigates to /browse' },
      { id: 'auth-4', label: 'Existing user with incomplete profile is redirected to /my-profile' },
      { id: 'auth-5', label: 'Existing user with complete profile is redirected to /browse' },
      { id: 'auth-6', label: 'Onboarding Step 1: display name, gender, DOB, country/city all required before proceeding' },
      { id: 'auth-7', label: 'Onboarding Step 1: submitting age under 18 shows error and blocks proceed' },
      { id: 'auth-8', label: 'Onboarding Step 2: bio, looking_for, interests selectable and saved' },
      { id: 'auth-9', label: 'Onboarding Step 3 (custom verify): selfie upload required to proceed' },
      { id: 'auth-10', label: 'Onboarding Step 3 (Didit): Verify My Identity button launches Didit session' },
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
      { id: 'browse-10', label: 'Token-gated user: bottom CTA prompts to buy tokens to discover more profiles' },
      { id: 'browse-11', label: 'Premium male or female: sees all filtered profiles without restriction' },
      { id: 'browse-12', label: 'Clicking a profile card navigates to /profile/:id' },
      { id: 'browse-13', label: 'Favoriting a profile from browse card works and heart icon toggles correctly' },
      // --- Unverified browse gate ---
      { id: 'browse-14', label: 'UNVERIFIED GATE: User with profile_complete=true but verification_status!="verified" can access /browse (Browse button in Navbar is enabled)' },
      { id: 'browse-15', label: 'UNVERIFIED GATE: Navbar Browse button is enabled when profile is complete, even without ID verification' },
      { id: 'browse-16', label: 'UNVERIFIED GATE: Navbar Winks, Messages, and Favorites buttons remain disabled until profile is fully complete AND verified' },
      { id: 'browse-17', label: 'UNVERIFIED GATE: Landing page "Start Browsing" navigates to /browse for authenticated user with complete (but unverified) profile' },
      { id: 'browse-18', label: 'UNVERIFIED GATE: Unverified user sees only up to the configured free browse limit (default 25) profiles' },
      { id: 'browse-19', label: 'UNVERIFIED GATE: Profiles beyond the limit show as blurred locked cards with "Verify to unlock" message' },
      { id: 'browse-20', label: 'UNVERIFIED GATE: Blue verification prompt banner appears at top of Browse page with "Verify Now" button linking to /my-profile' },
      { id: 'browse-21', label: 'UNVERIFIED GATE: Bottom CTA shows Shield icon and "Verify Now" button (not the buy-tokens prompt)' },
      { id: 'browse-22', label: 'UNVERIFIED GATE: Low-token amber banner is hidden for unverified users (verification takes priority over token prompt)' },
      { id: 'browse-23', label: 'UNVERIFIED GATE: Verified user with adequate tokens sees all filtered profiles without any gate or verification banner' },
      { id: 'browse-24', label: 'UNVERIFIED GATE: i18n — verification prompt text renders correctly in all 8 supported languages' },
      // --- Browse-All Purchase & Interaction Gating ---
      { id: 'browse-25', label: 'BROWSE-ALL: Unverified user sees a "Unlock All" banner/button on Browse page (not the buy-tokens prompt)' },
      { id: 'browse-26', label: 'BROWSE-ALL: Clicking "Unlock All" opens BrowseAllDialog showing cost, duration (7 days), and current token balance' },
      { id: 'browse-27', label: 'BROWSE-ALL: Dialog shows "Verify Now" button (instead of Unlock) when user is unverified — clicking navigates to verification' },
      { id: 'browse-28', label: 'BROWSE-ALL: Verified user with sufficient tokens clicking "Unlock (N tokens)" calls unlockBrowseAll, deducts tokens, and shows success toast' },
      { id: 'browse-29', label: 'BROWSE-ALL: Verified user with insufficient tokens sees "You need N more tokens" message and Unlock button is disabled' },
      { id: 'browse-30', label: 'BROWSE-ALL: After successful purchase, browse_unlocked_until is set to 7 days in the future on MemberProfile' },
      { id: 'browse-31', label: 'BROWSE-ALL: After purchase, a TokenTransaction record of type "spend" is created with correct token amount and description' },
      { id: 'browse-32', label: 'BROWSE-ALL: After purchase, all previously locked/blurred profile cards become fully visible and interactive' },
      { id: 'browse-33', label: 'BROWSE-ALL: After purchase, the "Unlock All" banner disappears and user sees all profiles without limit' },
      { id: 'browse-34', label: 'BROWSE-ALL: Returning after 7 days (browse_unlocked_until expired) re-applies the browse limit and shows the Unlock banner again' },
      { id: 'browse-35', label: 'INTERACT GATE: Unverified user sees lock icon (not wink/favorite buttons) on profile cards in Browse grid' },
      { id: 'browse-36', label: 'INTERACT GATE: Verified user WITHOUT browse-all purchase sees lock icon on profile cards (interactions still gated)' },
      { id: 'browse-37', label: 'INTERACT GATE: Verified user WITH active browse-all purchase sees wink and favorite buttons on profile cards' },
      { id: 'browse-38', label: 'INTERACT GATE: i18n — browse-all dialog, banner, and locked overlay text render correctly in all 8 supported languages' },
      // --- Auto-unlock when browse cost is 0 ---
      { id: 'browse-39', label: 'AUTO-UNLOCK (0 COST): When tokens_browse_cost_women is 0 and tokens_browse_women_enabled is true, a verified female user sees all profiles without any gate or banner' },
      { id: 'browse-40', label: 'AUTO-UNLOCK (0 COST): When tokens_browse_cost_men is 0 and tokens_browse_men_enabled is true, a verified male user sees all profiles without any gate or banner' },
      { id: 'browse-41', label: 'AUTO-UNLOCK (0 COST): The "Unlock All Profiles" banner does NOT appear when the configured browse cost for the user\'s gender is 0' },
      { id: 'browse-42', label: 'AUTO-UNLOCK (0 COST): The BrowseAllDialog does NOT open (and is not needed) when the configured browse cost is 0' },
      { id: 'browse-43', label: 'AUTO-UNLOCK (0 COST): Verified user with 0-cost browse can interact (wink, favorite, message) without purchasing browse-all' },
      { id: 'browse-44', label: 'AUTO-UNLOCK (0 COST): Unverified user with 0-cost browse still sees the unverified gate (verification is still required)' },
      { id: 'browse-45', label: 'AUTO-UNLOCK (0 COST): No TokenTransaction is created and no tokens are deducted when browse cost is 0' },
      { id: 'browse-46', label: 'AUTO-UNLOCK (0 COST): Setting browse cost back to a positive number re-enables the Unlock All banner and purchase flow' },
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
      { id: 'profile-14', label: 'SOCIAL MEDIA: Unverified member sees amber warning notice "You must be ID verified to show your social media links on your public profile"' },
      { id: 'profile-15', label: 'SOCIAL MEDIA: "Show on public profile" toggle is DISABLED (grayed out) when verification_status is not "verified"' },
      { id: 'profile-16', label: 'SOCIAL MEDIA: "Show on public profile" toggle is ENABLED and interactive when verification_status is "verified"' },
      { id: 'profile-17', label: 'SOCIAL MEDIA: Verified member toggles ON — show_social_media saves as true in MemberProfile' },
      { id: 'profile-18', label: 'SOCIAL MEDIA: Verified member toggles OFF — show_social_media saves as false in MemberProfile' },
      { id: 'profile-19', label: 'SOCIAL MEDIA: Public View Profile page shows social media links only when show_social_media is true AND viewer is looking at a verified member' },
      { id: 'profile-20', label: 'SOCIAL MEDIA: Public View Profile page hides social media section when show_social_media is false or member is unverified' },
      { id: 'profile-11', label: 'Profile card badge reflects correct phase: Pending (unreviewed), Verified (approved + ID verified), Un-Verified (approved but not ID verified)' },
      { id: 'profile-12', label: 'Re-upload selfie and ID document on My Profile works and updates selfie_url_2 / id_document_url_2' },
      { id: 'profile-13', label: 'Incomplete profile warning banner shows when profile_complete is false' },
      // --- ViewProfile Interaction Gating ---
      { id: 'profile-21', label: 'VIEWPROFILE GATE: Unverified user viewing a profile sees locked prompt bar instead of Message/Favorite/Wink buttons' },
      { id: 'profile-22', label: 'VIEWPROFILE GATE: Verified user WITHOUT browse-all purchase sees locked prompt bar instead of interaction buttons' },
      { id: 'profile-23', label: 'VIEWPROFILE GATE: Locked prompt bar shows "Unlock All" button that opens BrowseAllDialog' },
      { id: 'profile-24', label: 'VIEWPROFILE GATE: Verified user WITH active browse-all purchase sees Message, Favorite, Wink, and Report buttons normally' },
      { id: 'profile-25', label: 'VIEWPROFILE GATE: After purchasing browse-all from the profile page, interaction buttons appear without page reload' },
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
      // --- Wink Expiration ---
      { id: 'wink-14', label: 'ADMIN CONFIG: Wink Expiry (hours) field appears in the admin Winks card under Token Economy Settings' },
      { id: 'wink-15', label: 'ADMIN CONFIG: Changing the Wink Expiry value saves to SiteConfig.wink_expiry_hours and persists on reload' },
      { id: 'wink-16', label: 'ADMIN CONFIG: Setting wink_expiry_hours to 0 disables expiration (winks are never auto-deleted)' },
      { id: 'wink-17', label: 'EXPIRY: Winks older than the configured wink_expiry_hours are deleted by the deleteExpiredWinks backend function' },
      { id: 'wink-18', label: 'EXPIRY: The "Delete Expired Winks" scheduled automation runs hourly and invokes deleteExpiredWinks' },
      { id: 'wink-19', label: 'EXPIRY: After deletion, expired winks no longer appear in the recipient\'s Winks page or count badge' },
      { id: 'wink-20', label: 'EXPIRY: Winks within the expiry window remain visible and are NOT deleted' },
      { id: 'wink-21', label: 'EXPIRY: Manually invoking deleteExpiredWinks returns correct count of deleted winks and the cutoff timestamp' },
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
      { id: 'ver-9', label: 'Didit: verification flow launches correctly from onboarding and My Profile' },
      { id: 'ver-10', label: 'Re-upload of selfie/ID on My Profile updates _url_2 fields and resets verification_status to "unverified" for re-review' },
      // --- Reject flow ---
      { id: 'ver-11', label: 'VERIFICATION QUEUE: Admin clicks Reject button in VerificationDetail and a rejection dialog opens with reason dropdown (8 options) and details textarea' },
      { id: 'ver-12', label: 'REJECT: Selecting a reason and entering details, then confirming, sets verification_status to "rejected" on the MemberProfile' },
      { id: 'ver-13', label: 'REJECT: Confirming rejection sets is_suspended to true and suspension_reason to "verification_rejected"' },
      { id: 'ver-14', label: 'REJECT: verification_rejection_reason and verification_rejection_details fields are populated with admin\u2019s selections' },
      { id: 'ver-15', label: 'REJECT: Reject button is disabled until a reason is selected from the dropdown' },
      { id: 'ver-16', label: 'REJECT: After rejection, the member disappears from the pending verification queue' },
      { id: 'ver-17', label: 'REJECT: After rejection, the member\u2019s profile no longer appears in Browse results' },
      { id: 'ver-18', label: 'REJECT: Rejected member logging in is redirected to the RejectionScreen (full-page block)' },
      { id: 'ver-19', label: 'REJECT: RejectionScreen displays the selected reason and admin-provided details text' },
      { id: 'ver-20', label: 'REJECT: RejectionScreen provides "Contact Support" and "Log Out" buttons' },
      { id: 'ver-21', label: 'REJECT: Rejected member navigating to any page other than /support is redirected back to RejectionScreen' },
      { id: 'ver-22', label: 'REJECT: Rejected member CAN still access /support page to submit a ticket' },
      { id: 'ver-23', label: 'REJECT: Admin user is NOT redirected to RejectionScreen even if their own profile has verification_status="rejected"' },
      { id: 'ver-24', label: 'REJECT: i18n \u2014 RejectionScreen text, reason labels, and button labels render correctly in all 8 supported languages' },
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
      { id: 'adm-4', label: 'Member Management: suspend member opens reason dropdown dialog (same as verification reject) with 8 reason options + details textarea' },
      { id: 'adm-4a', label: 'Member Management: suspend confirms only after a reason is selected; sets verification_status="rejected", is_suspended=true, suspension_reason="verification_rejected", and stores rejection reason + details' },
      { id: 'adm-4b', label: 'Member Management: suspended member is hidden from Browse results and sees RejectionScreen on next login' },
      { id: 'adm-5', label: 'Member Management: restore (un-suspend) sets is_suspended=false, clears suspension_reason, clears verification_rejection_reason/details, and resets verification_status to "unverified"' },
      { id: 'adm-5a', label: 'Member Management: restore from Member Detail dialog works identically to restore from table row' },
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
      { id: 'promo-fb1', label: 'FIRST PURCHASE BONUS: User with has_purchased_tokens=false receives automatic bonus tokens on their first token purchase (men get first_purchase_bonus_men_tokens, women get first_purchase_bonus_women_tokens)' },
      { id: 'promo-fb2', label: 'FIRST PURCHASE BONUS: Automatic bonus is only granted when the corresponding gender toggle is enabled (first_purchase_bonus_men_enabled / first_purchase_bonus_women_enabled)' },
      { id: 'promo-fb3', label: 'FIRST PURCHASE BONUS: A TokenTransaction record of type "bonus" with description "First purchase bonus" is created for the automatic award' },
      { id: 'promo-fb4', label: 'FIRST PURCHASE BONUS: Second token purchase does NOT grant the automatic bonus again (has_purchased_tokens is now true)' },
      { id: 'promo-fb5', label: 'FIRST PURCHASE BONUS: Whop checkout path grants the automatic bonus on first purchase via whopPaymentWebhook' },
      { id: 'promo-fb6', label: 'FIRST PURCHASE BONUS: Authorize.net purchaseTokens path grants the automatic bonus on first purchase' },
      { id: 'promo-fb7', label: 'FIRST PURCHASE BONUS: When gender bonus is disabled, first purchase grants 0 bonus tokens and no bonus TokenTransaction is created' },
      { id: 'promo-fb8', label: 'FUNDATES AFTER BONUS: User applies FUNDATES promo code on their first token purchase — BOTH the automatic first purchase bonus AND the FUNDATES promo tokens are granted' },
      { id: 'promo-fb9', label: 'FUNDATES AFTER BONUS: Two separate TokenTransaction records are created — one type "bonus" (automatic) and one type "promo" with promo_code "FUNDATES"' },
      { id: 'promo-fb10', label: 'FUNDATES AFTER BONUS: Total tokens credited = pack tokens + automatic bonus tokens + FUNDATES promo tokens (1,000)' },
      { id: 'promo-fb11', label: 'FUNDATES AFTER BONUS: FUNDATES code cannot be redeemed a second time on the same account (used_promo_codes check)' },
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
  {
    id: 'didit',
    icon: Shield,
    title: 'Didit Identity Verification',
    color: 'text-blue-600',
    items: [
      { id: 'didit-1',  label: 'DEV MODE: createDiditSession uses DIDIT_API_KEY_DEV / DIDIT_WORKFLOW_ID_DEV when SiteConfig.dev_mode is true' },
      { id: 'didit-2',  label: 'PROD MODE: createDiditSession uses DIDIT_API_KEY_PROD / DIDIT_WORKFLOW_ID_PROD when dev_mode is false' },
      { id: 'didit-3',  label: 'Onboarding Step 3: DiditVerificationStep renders with a "Verify My Identity" button' },
      { id: 'didit-4',  label: 'Clicking "Verify My Identity" calls createDiditSession and redirects browser to the Didit-hosted verification URL' },
      { id: 'didit-5',  label: 'Didit callback /verify/complete receives ?verificationSessionId and ?status query params without errors' },
      { id: 'didit-6',  label: '/verify/complete shows correct message for Approved, Declined, and In Progress outcomes' },
      { id: 'didit-7',  label: 'WEBHOOK: POST /api/webhooks/didit with valid X-Signature-V2 returns 200' },
      { id: 'didit-8',  label: 'WEBHOOK: POST /api/webhooks/didit with invalid signature returns 401' },
      { id: 'didit-9',  label: 'WEBHOOK: X-Timestamp older than 300 seconds is rejected with 401' },
      { id: 'didit-10', label: 'WEBHOOK: status.updated with status "Approved" sets didit_verification_status="Approved" and verification_status="verified" on the MemberProfile matched by vendor_data' },
      { id: 'didit-11', label: 'WEBHOOK: status.updated with status "Declined" sets didit_verification_status="Declined"' },
      { id: 'didit-12', label: 'MemberProfile.didit_session_id is populated after createDiditSession is called' },
      { id: 'didit-13', label: 'Re-starting verification (new Didit session) replaces old didit_session_id with the new one' },
      { id: 'didit-14', label: 'Admin | Settings Didit section shows env var reference text (DIDIT_API_KEY_DEV / PROD etc.) — no editable inputs' },
      { id: 'didit-15', label: 'Toggling dev_mode in Site Settings switches Didit credentials for all subsequent sessions' },
    ],
  },
  {
    id: 'godate26',
    icon: Tag,
    title: 'GODATE26 Profile Completion Promo',
    color: 'text-green-600',
    items: [
      { id: 'gd26-1', label: 'GODATE26 PromoCode record exists with tokens=1000, is_active=true, type="any"' },
      { id: 'gd26-2', label: 'Completing onboarding (MemberProfile created with profile_complete=true) calls awardGodate26Promo' },
      { id: 'gd26-3', label: "First completion: 1,000 tokens are added to the new member's balance" },
      { id: 'gd26-4', label: 'First completion: "GODATE26" is appended to MemberProfile.used_promo_codes' },
      { id: 'gd26-5', label: 'First completion: TokenTransaction record created with type="promo" and promo_code="GODATE26"' },
      { id: 'gd26-6', label: 'First completion: PromoCode.times_used increments by 1' },
      { id: 'gd26-7', label: 'Idempotency: calling awardGodate26Promo a second time for the same member does NOT award additional tokens' },
      { id: 'gd26-8', label: 'Welcome toast "🎉 Welcome! Your GODATE26 bonus of 1,000 tokens has been added" appears after onboarding completes' },
      { id: 'gd26-9', label: 'GODATE26 award does NOT fire at the Didit verification step — only at profile completion' },
      { id: 'gd26-10', label: 'GODATE26 PromoCode record has auto_award=true after being awarded (marks it as system-awarded, not for manual entry)' },
    ],
  },
  {
    id: 'verifgate',
    icon: Lock,
    title: 'Verification Gate',
    color: 'text-amber-600',
    items: [
      { id: 'vgate-1', label: 'Unverified member clicking Send (text) in Chat sees VerificationRequiredModal — not a token error' },
      { id: 'vgate-2', label: 'Unverified member clicking the photo (📷) icon in Chat sees VerificationRequiredModal' },
      { id: 'vgate-3', label: 'VerificationRequiredModal heading is "Identity Verification Required" with two action buttons' },
      { id: 'vgate-4', label: 'Clicking "Verify My Identity" in modal navigates to the Didit verification launch route' },
      { id: 'vgate-5', label: 'Clicking "Not Now" closes the modal without navigating' },
      { id: 'vgate-6', label: 'Verified member (didit_verification_status="Approved") can send messages without seeing the modal' },
      { id: 'vgate-7', label: 'Verification check fires BEFORE the token balance check — gate is the first guard in handleSend' },
      { id: 'vgate-8', label: 'Verified member with insufficient tokens sees the existing token lock UI (not the verification modal)' },
    ],
  },
  {
    id: 'privatephotos',
    icon: Camera,
    title: 'Private Photos',
    color: 'text-violet-600',
    items: [
      { id: 'pp-1',  label: 'ENTITY: PrivatePhoto entity exists with fields: member_id, photo_url, uploaded_at, status, token_cost_to_view' },
      { id: 'pp-2',  label: 'ENTITY: PrivatePhotoView entity exists with fields: private_photo_id, viewer_member_id, viewed_at, tokens_spent' },
      { id: 'pp-3',  label: 'ENTITY: PrivatePhotoAccess entity exists with fields: owner_member_id, viewer_member_id, status, requested_at, responded_at' },
      { id: 'pp-4',  label: 'UPLOAD: Unverified member clicking private photo upload button sees VerificationRequiredModal' },
      { id: 'pp-5',  label: 'UPLOAD: Verified member uploads a photo; Cloudinary URL stored in PrivatePhoto with status="pending_review"' },
      { id: 'pp-6',  label: 'UPLOAD: Uploading creates a PhotoReview record with source_type="private"' },
      { id: 'pp-7',  label: 'UPLOAD LIMIT: Attempting to upload photo #11 (with 10 active/pending) shows limit error and blocks upload' },
      { id: 'pp-8',  label: 'UPLOAD: Uploaded photo shows ⏳ Under Review overlay in MyProfile until approved' },
      { id: 'pp-9',  label: 'DELETE: Soft-deleting a private photo sets status="rejected" and hides it from all views' },
      { id: 'pp-10', label: 'ADMIN: Private photos appear in Content Review queue with "🔒 Private Photo" amber badge' },
      { id: 'pp-11', label: 'ADMIN: Approving sets PhotoReview.review_status="approved" AND PrivatePhoto.status="approved"' },
      { id: 'pp-12', label: 'ADMIN: Rejecting sets PrivatePhoto.status="rejected" and notifies the uploader via email' },
      { id: 'pp-13', label: 'VIEW — unverified viewer: sees "Verify identity to request access" — no photos visible' },
      { id: 'pp-14', label: 'VIEW — no access record: verified viewer sees blurred placeholder + "Request Access" button' },
      { id: 'pp-15', label: 'REQUEST: Clicking "Request Access" creates PrivatePhotoAccess record (status=pending)' },
      { id: 'pp-16', label: 'REQUEST: Clicking "Request Access" sends a message_type="private_photo_request" Message in the shared conversation' },
      { id: 'pp-17', label: 'VIEW — pending: viewer sees "⏳ Your access request is pending their approval"' },
      { id: 'pp-18', label: 'CHAT: Owner sees request card with [Grant Access] and [Decline] buttons' },
      { id: 'pp-19', label: 'CHAT: Owner clicks [Grant Access] → PrivatePhotoAccess.status="granted" + confirmation message sent' },
      { id: 'pp-20', label: 'CHAT: Owner clicks [Decline] → PrivatePhotoAccess.status="denied" + declined message sent' },
      { id: 'pp-21', label: 'CHAT: [Grant Access] / [Decline] buttons are disabled after owner already responded' },
      { id: 'pp-22', label: 'VIEW — granted: verified male viewer sees approved private photos; FIRST view of each photo deducts 5 tokens and creates PrivatePhotoView record' },
      { id: 'pp-23', label: 'VIEW — granted: male viewer re-opening a photo already paid for (PrivatePhotoView record exists) pays 0 tokens — no double-charge' },
      { id: 'pp-24', label: 'VIEW — granted: female viewer sees photos without any token deduction' },
      { id: 'pp-25', label: 'VIEW — granted: male viewer with insufficient tokens (< 5) sees token-lock message — cannot view individual photo' },
      { id: 'pp-26', label: 'VIEW — denied: viewer sees "Your access request was declined" + Send Message link' },
      { id: 'pp-27', label: 'MY PROFILE: "Pending Access Requests" sub-section shows incoming pending requests' },
      { id: 'pp-28', label: 'MY PROFILE: Grant/Deny from My Profile updates access record and sends chat message' },
      { id: 'pp-29', label: 'MY PROFILE: "Access Granted To" sub-section lists viewers with active granted access' },
      { id: 'pp-30', label: 'REVOKE: Owner clicking [Revoke Access] calls revokePrivatePhotoAccess, sets status="revoked", sends chat message "🔒 Private photo access has been revoked."' },
      { id: 'pp-31', label: 'REVOKE: After revoke, viewer is removed from "Access Granted To" list in MyProfile' },
      { id: 'pp-32', label: 'VIEW — revoked: viewer sees blurred placeholder + [Request Access] button (can re-request)' },
      { id: 'pp-33', label: 'DUPLICATE GUARD: A second "Request Access" from the same viewer is blocked (alreadyPending / alreadyGranted)' },
      { id: 'pp-34', label: 'DUPLICATE GUARD: After revoke, viewer CAN send a new request (creates a fresh PrivatePhotoAccess record)' },
      { id: 'pp-35', label: 'OWN PROFILE: Owner views own private photos without any access gate or token cost' },
    ],
  },
  {
    id: 'admindidit',
    icon: Image,
    title: 'Admin: Didit Verification View',
    color: 'text-indigo-600',
    items: [
      { id: 'admdidit-1',  label: 'VerificationDetail: profile with didit_session_id shows spinner then 3 images (Selfie, ID Front, ID Back)' },
      { id: 'admdidit-2',  label: 'VerificationDetail: Selfie loads from decision.liveness_checks[0].reference_image via fetchDiditSession' },
      { id: 'admdidit-3',  label: 'VerificationDetail: ID Front loads from decision.id_verifications[0].front_image (or fallbacks)' },
      { id: 'admdidit-4',  label: 'VerificationDetail: ID Back loads from decision.id_verifications[0].back_image (or fallbacks)' },
      { id: 'admdidit-5',  label: 'VerificationDetail: null/missing image shows grey "Image not available" placeholder — no JS error' },
      { id: 'admdidit-6',  label: 'VerificationDetail: profile with no didit_session_id shows "No Didit session on file" message' },
      { id: 'admdidit-7',  label: 'VerificationDetail: fetchDiditSession network error shows error message instead of broken images' },
      { id: 'admdidit-8',  label: 'VerificationDetail: didit_verification_status="Approved" shows green ✅ "Auto-Verified by Didit" badge' },
      { id: 'admdidit-9',  label: 'VerificationDetail: didit_verification_status="Declined" shows red ❌ "Declined by Didit" badge' },
      { id: 'admdidit-10', label: 'VerificationDetail: admin Approve and Reject override buttons function correctly regardless of Didit status' },
      { id: 'admdidit-11', label: 'fetchDiditSession uses getActiveDiditCredentials() — does NOT call Deno.env.get() directly' },
    ],
  },
  {
    id: 'stripe_payment_link',
    icon: Link,
    title: 'Stripe Payment Link Integration',
    color: 'text-violet-500',
    items: [
      // --- Profile Field ---
      { id: 'spl-001', label: 'TC-SPL-001 | PROFILE FIELD: Stripe Payment Link field is NOT visible or editable when admin has enabled the feature but user is NOT yet ID-verified' },
      { id: 'spl-002', label: 'TC-SPL-002 | PROFILE FIELD: Stripe Payment Link input field and instructions section ARE visible and editable when admin has enabled the feature AND user IS ID-verified' },
      { id: 'spl-003', label: 'TC-SPL-003 | PROFILE FIELD: Valid URL beginning with https://buy.stripe.com/ is accepted and saved without a validation error' },
      { id: 'spl-004', label: 'TC-SPL-004 | PROFILE FIELD: URL that does NOT begin with https://buy.stripe.com/ (e.g. https://paypal.me/example) is rejected with a validation error and not saved' },
      { id: 'spl-005', label: 'TC-SPL-005 | PROFILE FIELD: Step-by-step instructions for creating a Stripe Payment Link are displayed beneath the input field when field is visible' },
      // --- Admin Controls ---
      { id: 'spl-010', label: 'TC-SPL-010 | ADMIN: Toggling stripe_payment_link_enabled_men to true allows ID-verified male members to see/use the field; female members are unaffected' },
      { id: 'spl-011', label: 'TC-SPL-011 | ADMIN: Toggling stripe_payment_link_enabled_women to true allows ID-verified female members to see/use the field; male members are unaffected' },
      { id: 'spl-012', label: 'TC-SPL-012 | ADMIN: Disabling the toggle for a gender hides the Profile field AND removes the "Send a Payment" button from those users\' public profiles' },
      { id: 'spl-013', label: 'TC-SPL-013 | ADMIN: Updating stripe_link_message_credit_cost saves correctly; embedding a payment link in chat now costs the new credit amount and cost_notice reflects it' },
      // --- Public Profile ---
      { id: 'spl-020', label: 'TC-SPL-020 | PUBLIC PROFILE: "Send a Payment" button is displayed and links to the user\'s Stripe URL when: user is ID-verified, has a saved link, feature is admin-enabled, and "Show on public profile" is ON' },
      { id: 'spl-021', label: 'TC-SPL-021 | PUBLIC PROFILE: "Send a Payment" button is NOT displayed when "Show on public profile" toggle is OFF' },
      { id: 'spl-022', label: 'TC-SPL-022 | PUBLIC PROFILE: "Send a Payment" button is NOT displayed when user has a saved link and toggle is ON but user is NOT ID-verified' },
      { id: 'spl-023', label: 'TC-SPL-023 | PUBLIC PROFILE: "Send a Payment" button is NOT displayed when user is ID-verified and toggle is ON but admin has disabled the feature for that gender' },
      { id: 'spl-024', label: 'TC-SPL-024 | PUBLIC PROFILE: "Show my payment link on my public profile" toggle is NOT available or is disabled when user is not ID-verified (or feature is admin-disabled)' },
      // --- Message Embed ---
      { id: 'spl-030', label: 'TC-SPL-030 | MESSAGE EMBED: Payment link embed button is visible and enabled in the chat composer when user is ID-verified, has a saved link, feature is admin-enabled, and has sufficient credits' },
      { id: 'spl-031', label: 'TC-SPL-031 | MESSAGE EMBED: Clicking embed button and sending message inserts the Stripe link as a tappable link in the sent message AND deducts the configured credit amount from the user\'s balance' },
      { id: 'spl-032', label: 'TC-SPL-032 | MESSAGE EMBED: Clicking embed button when user has fewer credits than the configured cost shows an insufficient-credits error; message is not sent with the link' },
      { id: 'spl-033', label: 'TC-SPL-033 | MESSAGE EMBED: Button is disabled with a prompt directing user to profile settings when no Stripe Payment Link has been saved' },
      { id: 'spl-034', label: 'TC-SPL-034 | MESSAGE EMBED: Button is disabled with not_verified tooltip when user has a saved link but is NOT ID-verified' },
      { id: 'spl-035', label: 'TC-SPL-035 | MESSAGE EMBED: Button is disabled with not_enabled tooltip when user is ID-verified and has a saved link but admin has disabled the feature for their gender' },
      // --- i18n ---
      { id: 'spl-040', label: 'TC-SPL-040 | i18n: All new Stripe Payment Link strings (labels, instructions, tooltips, cost notices, admin labels) render correctly in all 8 supported languages with no untranslated fallback keys' },
      { id: 'spl-041', label: 'TC-SPL-041 | i18n: The {{n}} credit cost variable in the cost_notice string is replaced with the correct numeric value in all 8 supported languages' },
    ],
  },
  {
    id: 'buymeacoffee',
    icon: Coffee,
    title: 'BuyMeACoffee Link Integration',
    color: 'text-amber-500',
    items: [
      // --- Profile Field ---
      { id: 'bmc-001', label: 'TC-BMC-001 | PROFILE FIELD: BuyMeACoffee Link field is NOT visible or editable when admin has enabled the feature but user is NOT yet ID-verified' },
      { id: 'bmc-002', label: 'TC-BMC-002 | PROFILE FIELD: BuyMeACoffee Link input field and instructions section ARE visible and editable when admin has enabled the feature AND user IS ID-verified' },
      { id: 'bmc-003', label: 'TC-BMC-003 | PROFILE FIELD: Valid URL beginning with https://www.buymeacoffee.com/ is accepted and saved without a validation error' },
      { id: 'bmc-004', label: 'TC-BMC-004 | PROFILE FIELD: Valid URL beginning with https://buymeacoffee.com/ is accepted and saved without a validation error' },
      { id: 'bmc-005', label: 'TC-BMC-005 | PROFILE FIELD: URL that does NOT contain buymeacoffee.com (e.g. https://paypal.me/example) is rejected with a validation error and not saved' },
      { id: 'bmc-006', label: 'TC-BMC-006 | PROFILE FIELD: "Go to BuyMeACoffee" external link is displayed beneath the input field and opens buymeacoffee.com in a new tab' },
      { id: 'bmc-007', label: 'TC-BMC-007 | PROFILE FIELD: Card description text reads "Add your BuyMeACoffee link so members can gift you a virtual coffee break. It can be embedded in chat messages."' },
      { id: 'bmc-008', label: 'TC-BMC-008 | PROFILE FIELD: Unverified user sees amber warning notice "You must be ID-verified to use this feature." beneath the card description' },
      // --- Admin Controls ---
      { id: 'bmc-010', label: 'TC-BMC-010 | ADMIN: "BuyMeACoffee Links in Chat" card appears in Token Economy Settings with men/women toggles and credit cost field' },
      { id: 'bmc-011', label: 'TC-BMC-011 | ADMIN: Toggling buymeacoffee_enabled_men to true allows ID-verified male members to see/use the field; female members are unaffected' },
      { id: 'bmc-012', label: 'TC-BMC-012 | ADMIN: Toggling buymeacoffee_enabled_women to true allows ID-verified female members to see/use the field; male members are unaffected' },
      { id: 'bmc-013', label: 'TC-BMC-013 | ADMIN: Disabling the toggle for a gender hides the Profile field AND removes the Coffee embed button from chat for those users' },
      { id: 'bmc-014', label: 'TC-BMC-014 | ADMIN: Updating buymeacoffee_message_credit_cost saves correctly; embedding a BMC link in chat now costs the new credit amount and cost_notice reflects it' },
      // --- Message Embed ---
      { id: 'bmc-030', label: 'TC-BMC-030 | MESSAGE EMBED: Coffee icon embed button is visible and enabled in the chat composer when user is ID-verified, has a saved link, feature is admin-enabled, and has sufficient tokens' },
      { id: 'bmc-031', label: 'TC-BMC-031 | MESSAGE EMBED: Clicking embed button inserts the BMC link as a tappable link in the sent message AND deducts the configured token amount from the user\'s balance' },
      { id: 'bmc-032', label: 'TC-BMC-032 | MESSAGE EMBED: Clicking embed button when user has fewer tokens than the configured cost shows an insufficient-tokens notice with "Buy tokens" link; message is not sent with the link' },
      { id: 'bmc-033', label: 'TC-BMC-033 | MESSAGE EMBED: Button is disabled with a prompt directing user to profile settings when no BuyMeACoffee link has been saved' },
      { id: 'bmc-034', label: 'TC-BMC-034 | MESSAGE EMBED: Button is disabled with not_verified tooltip when user has a saved link but is NOT ID-verified' },
      { id: 'bmc-035', label: 'TC-BMC-035 | MESSAGE EMBED: Button is disabled with not_enabled tooltip when user is ID-verified and has a saved link but admin has disabled the feature for their gender' },
      { id: 'bmc-036', label: 'TC-BMC-036 | MESSAGE EMBED: Sent BMC link message renders as a clickable hyperlink (not plain text) in the chat bubble' },
      { id: 'bmc-037', label: 'TC-BMC-037 | MESSAGE EMBED: Clicking the BMC link in a chat message opens the URL in a new tab' },
      { id: 'bmc-038', label: 'TC-BMC-038 | MESSAGE EMBED: Token cost hint (Coffee icon + "N tokens per BuyMeACoffee link") is shown in the composer area when the feature is enabled for the user\'s gender' },
      { id: 'bmc-039', label: 'TC-BMC-039 | MESSAGE EMBED: Conversation last_message and unread_count are updated after embedding a BMC link' },
      { id: 'bmc-040', label: 'TC-BMC-040 | MESSAGE EMBED: After sending, the messages and myProfile queries are invalidated so the token balance and message list refresh immediately' },
      // --- Token Costs List ---
      { id: 'bmc-050', label: 'TC-BMC-050 | TOKEN COSTS: "Embed BuyMeACoffee link in chat" row appears in the Token Costs list on My Profile when the feature is enabled for the user\'s gender' },
      { id: 'bmc-051', label: 'TC-BMC-051 | TOKEN COSTS: Row shows the correct token cost from buymeacoffee_message_credit_cost' },
      { id: 'bmc-052', label: 'TC-BMC-052 | TOKEN COSTS: Row is marked with verification-required asterisk' },
      { id: 'bmc-053', label: 'TC-BMC-053 | TOKEN COSTS: Row is hidden when the feature is disabled for the user\'s gender' },
      // --- i18n ---
      { id: 'bmc-060', label: 'TC-BMC-060 | i18n: All BMC strings (card title, description, input label, input hint, tooltips, cost notices, admin labels) render correctly in all 8 supported languages with no untranslated fallback keys' },
      { id: 'bmc-061', label: 'TC-BMC-061 | i18n: The {{n}} token cost variable in chat_cost_hint and cost_notice strings is replaced with the correct numeric value in all 8 supported languages' },
      { id: 'bmc-062', label: 'TC-BMC-062 | i18n: "Embed BuyMeACoffee link in chat" token costs list label renders correctly in all 8 supported languages' },
    ],
  },
  {
    id: 'admincompare',
    icon: Key,
    title: 'Admin: Content Review Comparison Modal',
    color: 'text-orange-600',
    items: [
      { id: 'cmp-1',  label: 'PhotoReviewCard: Shield (Verify) button opens comparison modal — does NOT navigate to /admin?tab=verification' },
      { id: 'cmp-2',  label: 'Modal: shows 3 columns — Submitted Content | Member Selfie | Govt ID Front' },
      { id: 'cmp-3',  label: 'Modal Col 1: displays review.photo_url' },
      { id: 'cmp-4',  label: 'Modal Col 2: Selfie loads from Didit via fetchDiditSession' },
      { id: 'cmp-5',  label: 'Modal Col 3: ID Front loads from Didit via fetchDiditSession' },
      { id: 'cmp-6',  label: 'Modal: private-photo item (source_type="private") shows "🔒 Private Photo" label on Column 1' },
      { id: 'cmp-7',  label: 'Modal: null Didit image shows grey "Identity image not available" — no crash' },
      { id: 'cmp-8',  label: 'Modal: loading state shows spinner in columns 2 and 3 while images are fetching' },
      { id: 'cmp-9',  label: 'Modal: Approve button calls onApprove and closes the modal' },
      { id: 'cmp-10', label: 'Modal: Reject button calls onReject and closes the modal' },
      { id: 'cmp-11', label: 'Modal: on mobile (< md) images stack vertically without layout breakage' },
    ],
  },
  {
    id: 'eligible_promos',
    icon: Tag,
    title: 'Eligible Promos Card & Promo Visibility',
    color: 'text-emerald-600',
    items: [
      // --- EligiblePromosCard rendering ---
      { id: 'ep-1', label: 'MY PROFILE: EligiblePromosCard renders a green claim card for each active, visible, unexpired, under-max-uses promo the user has NOT yet redeemed' },
      { id: 'ep-2', label: 'MY PROFILE: Card shows the promo code in monospace, bonus token amount, and a contextual message (purchase vs verification vs any)' },
      { id: 'ep-3', label: 'MY PROFILE: No card renders when the user has already redeemed all eligible promo codes' },
      { id: 'ep-4', label: 'MY PROFILE: No card renders when there are no active promo codes at all' },
      { id: 'ep-5', label: 'MY PROFILE: Purchase-type promo card text says bonus applies to the next purchase when user has not purchased tokens yet' },
      { id: 'ep-6', label: 'MY PROFILE: Applying a valid promo code from the card awards tokens (or shows pending message for purchase-type) and removes the card' },
      { id: 'ep-7', label: 'MY PROFILE: After applying, the used_promo_codes array on the profile is updated and the card disappears on refetch' },
      { id: 'ep-8', label: 'MY PROFILE: Entering an incorrect code in the card input shows a destructive toast with the error message' },
      { id: 'ep-9', label: 'MY PROFILE: Pressing Enter in the input field triggers apply (same as clicking Apply button)' },
      { id: 'ep-10', label: 'MY PROFILE: Apply button is disabled when the input is empty' },
      // --- Eligibility filtering ---
      { id: 'ep-11', label: 'ELIGIBILITY: Promo already in user.used_promo_codes does NOT appear as a claim card' },
      { id: 'ep-12', label: 'ELIGIBILITY: Promo with expires_at in the past does NOT appear as a claim card' },
      { id: 'ep-13', label: 'ELIGIBILITY: Promo where times_used >= max_uses does NOT appear as a claim card' },
      { id: 'ep-14', label: 'ELIGIBILITY: Verification-type promo does NOT appear for unverified users' },
      { id: 'ep-15', label: 'ELIGIBILITY: Verification-type promo DOES appear for verified users who have not yet redeemed it' },
      // --- Visibility toggle ---
      { id: 'ep-16', label: 'ADMIN FORM: "Visible on profile" checkbox is present in the create/edit promo code form' },
      { id: 'ep-17', label: 'ADMIN FORM: New promo code defaults to visible=true when created without changing the checkbox' },
      { id: 'ep-18', label: 'ADMIN FORM: Unchecking "Visible on profile" saves visible=false to the PromoCode record' },
      { id: 'ep-19', label: 'ADMIN FORM: Re-checking "Visible on profile" saves visible=true to the PromoCode record' },
      { id: 'ep-20', label: 'ADMIN FORM: Editing an existing promo preserves its current visible state in the checkbox' },
      // --- Hidden promo behavior ---
      { id: 'ep-21', label: 'ADMIN LIST: Promo codes with visible=false show an amber "Hidden" badge in the admin list' },
      { id: 'ep-22', label: 'ADMIN LIST: Promo codes with visible=true (default) do NOT show a "Hidden" badge' },
      { id: 'ep-23', label: 'HIDDEN: A promo with visible=false does NOT appear as a claim card on My Profile even if the user is otherwise eligible' },
      { id: 'ep-24', label: 'HIDDEN: A promo with visible=false CAN still be redeemed manually by entering the code in the general promo input or at checkout' },
      { id: 'ep-25', label: 'HIDDEN: Toggling a promo from visible=false to visible=true makes it appear as a claim card for eligible users on next profile load' },
      { id: 'ep-26', label: 'HIDDEN: Toggling a promo from visible=true to visible=false removes it from claim cards for eligible users on next profile load' },
      // --- Auto-award field ---
      { id: 'ep-27', label: 'ADMIN FORM: "Automatic award" checkbox is present in the create/edit promo code form' },
      { id: 'ep-28', label: 'ADMIN FORM: New promo code defaults to auto_award=false when created without changing the checkbox' },
      { id: 'ep-29', label: 'ADMIN FORM: Checking "Automatic award" saves auto_award=true to the PromoCode record' },
      { id: 'ep-30', label: 'ADMIN FORM: Unchecking "Automatic award" saves auto_award=false to the PromoCode record' },
      { id: 'ep-31', label: 'ADMIN FORM: Editing an existing promo preserves its current auto_award state in the checkbox' },
      { id: 'ep-32', label: 'ADMIN LIST: Promo codes with auto_award=true show an indigo "Auto-Award" badge in the admin list' },
      { id: 'ep-33', label: 'ADMIN LIST: Promo codes with auto_award=false (default) do NOT show an "Auto-Award" badge' },
      { id: 'ep-34', label: 'AUTO-AWARD: A promo with auto_award=true does NOT appear in the EligiblePromosCard claim cards' },
      { id: 'ep-35', label: 'AUTO-AWARD: A promo with auto_award=true does NOT appear in the Buy Tokens PromoSuggestionsBanner' },
      { id: 'ep-36', label: 'AUTO-AWARD: A promo with auto_award=true CAN still be redeemed manually by entering the code in the general promo input' },
      { id: 'ep-37', label: 'AUTO-AWARD: GODATE26 is marked auto_award=true by awardGodate26Promo function after first award' },
      { id: 'ep-38', label: 'AUTO-AWARD: Toggling auto_award from true to false makes the promo appear in suggestions for eligible users on next profile load' },
      { id: 'ep-39', label: 'AUTO-AWARD: Toggling auto_award from false to true removes the promo from suggestions for eligible users on next profile load' },
    ],
  },
  {
    id: 'ads',
    icon: Monitor,
    title: 'Ad Integrations (JuicyAds)',
    color: 'text-cyan-500',
    items: [
      // --- JuicyAds Admin Settings ---
      { id: 'ads-j1', label: 'JUICYADS ADMIN: Enable Embedded Ads (JuicyAds) toggle saves to SiteConfig and persists on page reload' },
      { id: 'ads-j2', label: 'JUICYADS ADMIN: JuicyAds API Key field saves correctly and is retrievable from SiteConfig' },
      { id: 'ads-j3', label: 'JUICYADS ADMIN: "Show Ads to Men" toggle saves correctly (juicyads_show_men field)' },
      { id: 'ads-j4', label: 'JUICYADS ADMIN: "Show Ads to Women" toggle saves correctly (juicyads_show_women field)' },
      { id: 'ads-j5', label: 'JUICYADS ADMIN: Browse Page Zone ID field accepts input and saves to juicyads_zone_browse' },
      { id: 'ads-j6', label: 'JUICYADS ADMIN: Profile Page Zone ID field accepts input and saves to juicyads_zone_profile' },
      { id: 'ads-j7', label: 'JUICYADS ADMIN: Messages Page Zone ID field accepts input and saves to juicyads_zone_messages' },
      { id: 'ads-j8', label: 'JUICYADS ADMIN: JuicyAds sub-controls (gender toggles + zone ID fields) are hidden when juicyads_enabled is OFF' },
      { id: 'ads-j9', label: 'JUICYADS ADMIN: JuicyAds sub-controls appear when juicyads_enabled is toggled ON' },

      // --- JuicyAds Browse Page ---
      { id: 'ads-j10', label: 'JUICYADS BROWSE: Male user (juicyads_enabled ON, show_men ON, zone ID set) sees JuicyAds embed on /browse page' },
      { id: 'ads-j11', label: 'JUICYADS BROWSE: Female user (show_women OFF) does NOT see JuicyAds on /browse page' },
      { id: 'ads-j12', label: 'JUICYADS BROWSE: Female user (show_women ON) sees JuicyAds on /browse page' },
      { id: 'ads-j13', label: 'JUICYADS BROWSE: No ad renders when juicyads_zone_browse is blank, even if juicyads_enabled is ON' },
      { id: 'ads-j14', label: 'JUICYADS BROWSE: No ad renders when juicyads_enabled is OFF, even if zone ID and show_men are set' },

      // --- JuicyAds Profile Page ---
      { id: 'ads-j15', label: 'JUICYADS PROFILE: Male user (show_men ON, zone ID set) sees JuicyAds embed on /profile/:id page' },
      { id: 'ads-j16', label: 'JUICYADS PROFILE: Female user (show_women OFF) does NOT see JuicyAds on /profile/:id page' },
      { id: 'ads-j17', label: 'JUICYADS PROFILE: No ad renders when juicyads_zone_profile is blank' },
      { id: 'ads-j18', label: 'JUICYADS PROFILE: Ad embed appears below photo gallery and above profile name/bio' },

      // --- JuicyAds Messages Page ---
      { id: 'ads-j19', label: 'JUICYADS MESSAGES: Male user (show_men ON, zone ID set) sees JuicyAds embed on /messages page' },
      { id: 'ads-j20', label: 'JUICYADS MESSAGES: Female user (show_women OFF) does NOT see JuicyAds on /messages page' },
      { id: 'ads-j21', label: 'JUICYADS MESSAGES: No ad renders when juicyads_zone_messages is blank' },
      { id: 'ads-j22', label: 'JUICYADS MESSAGES: Ad embed appears below the page title and above the conversation list' },

      // --- JuicyAds Profile Mobile Zone ---
      { id: 'ads-jm1', label: 'JUICYADS ADMIN: "Profile Page Zone ID — Desktop (728×90 Leaderboard)" label is shown for the existing profile zone field' },
      { id: 'ads-jm2', label: 'JUICYADS ADMIN: "Profile Page Zone ID — Mobile (300×100)" field appears below the desktop field and saves to juicyads_zone_profile_mobile' },
      { id: 'ads-jm3', label: 'JUICYADS ADMIN: Mobile zone field placeholder shows "e.g. 1120981" and helper text explains the 768px breakpoint' },
      { id: 'ads-jm4', label: 'JUICYADS PROFILE DESKTOP: On a screen wider than 768px, the 728×90 desktop zone (juicyads_zone_profile) is served on the profile page' },
      { id: 'ads-jm5', label: 'JUICYADS PROFILE MOBILE: On a screen narrower than 768px, the 300×100 mobile zone (juicyads_zone_profile_mobile) is served on the profile page' },
      { id: 'ads-jm6', label: 'JUICYADS PROFILE FALLBACK: When juicyads_zone_profile_mobile is blank, the desktop zone renders on mobile screens instead of showing nothing' },
      { id: 'ads-jm7', label: 'JUICYADS PROFILE FALLBACK: When juicyads_zone_profile (desktop) is blank but mobile is set, no ad renders on desktop and mobile zone renders on mobile' },
      { id: 'ads-jm8', label: 'JUICYADS BROWSE/MESSAGES: Browse and Messages page embeds are unaffected — they still use single zone prop with no mobile/desktop split' },
      { id: 'ads-jm9', label: 'JUICYADS PROFILE: Resizing browser window across 768px breakpoint switches between desktop and mobile zones without page reload' },
    ],
  },
  {
    id: 'videos',
    icon: Video,
    title: 'Video Features (Private Photos & Chat)',
    color: 'text-cyan-600',
    items: [
      { id: 'vid-1', label: 'ADMIN SETTINGS: "Enable Videos for Private Photos — Men" toggle saves to SiteConfig (videos_private_men_enabled) and persists on reload' },
      { id: 'vid-1b', label: 'ADMIN SETTINGS: "Enable Videos for Private Photos — Women" toggle saves to SiteConfig (videos_private_women_enabled) and persists on reload' },
      { id: 'vid-2', label: 'ADMIN SETTINGS: "Enable Videos for Chat — Men" toggle saves to SiteConfig (videos_chat_men_enabled) and persists on reload' },
      { id: 'vid-2b', label: 'ADMIN SETTINGS: "Enable Videos for Chat — Women" toggle saves to SiteConfig (videos_chat_women_enabled) and persists on reload' },
      { id: 'vid-3', label: 'ADMIN SETTINGS: Max Video Duration field saves correctly (max_video_duration_seconds, default 30)' },
      { id: 'vid-4', label: 'ADMIN SETTINGS: Max Video File Size field saves correctly (max_video_file_size_mb, default 25)' },
      { id: 'vid-5', label: 'ADMIN SETTINGS: Token Cost — Send Photo in Message field saves correctly (tokens_msg_photo_cost, default 5)' },
      { id: 'vid-6', label: 'ADMIN SETTINGS: Token Cost — View Private Video field saves correctly (tokens_private_video_cost, default 10)' },
      { id: 'vid-7', label: 'ADMIN SETTINGS: Token Cost — Send Video (Men) field saves correctly (tokens_msg_video_cost_men, default 10)' },
      { id: 'vid-8', label: 'ADMIN SETTINGS: Token Cost — Send Video (Women) field saves correctly (tokens_msg_video_cost_women, default 10)' },
      { id: 'vid-8c', label: 'ADMIN SETTINGS: "Token Cost — Send Photo in Message (Men)" field label reflects it is for male users (renamed from generic label)' },
      { id: 'vid-8d', label: 'ADMIN SETTINGS: "Token Cost — Send Photo in Message (Women)" field saves correctly (tokens_msg_photo_cost_women, default 0)' },
      { id: 'vid-8e', label: 'ADMIN SETTINGS: "Token Cost — View Private Photo (Men)" field label reflects it is for male viewers (renamed from generic label)' },
      { id: 'vid-8f', label: 'ADMIN SETTINGS: "Token Cost — View Private Photo (Women)" field saves correctly (tokens_private_photo_cost_women, default 0)' },
      { id: 'vid-8g', label: 'ADMIN SETTINGS: "Token Cost — View Private Video (Men)" field label reflects it is for male viewers (renamed from generic label)' },
      { id: 'vid-8h', label: 'ADMIN SETTINGS: "Token Cost — View Private Video (Women)" field saves correctly (tokens_private_video_cost_women, default 0)' },
      { id: 'vid-8i', label: 'TOKEN COSTS LIST: Female user sees her configured tokens_msg_photo_cost_women in the "Send a photo" row (default 0 = Free)' },
      { id: 'vid-8j', label: 'TOKEN COSTS LIST: Female user sees her configured tokens_private_photo_cost_women in the "View private photos" row (default 0 = Free)' },
      { id: 'vid-8k', label: 'TOKEN COSTS LIST: Female user sees her configured tokens_private_video_cost_women in the "View private videos" row (default 0 = Free)' },
      { id: 'vid-8l', label: 'TOKEN COSTS LIST: Male user still sees the men-specific costs (tokens_msg_photo_cost, tokens_private_photo_cost, tokens_private_video_cost) — unaffected by women fields' },
      { id: 'vid-8m', label: 'TOKEN COSTS LIST: Setting a women-specific cost to a non-zero value updates the Token Costs list on My Profile to show that cost instead of "Free"' },
      { id: 'vid-9', label: 'PRIVATE UPLOAD (MEN): When videos_private_men_enabled is OFF, male file picker only accepts images (accept="image/*")' },
      { id: 'vid-9b', label: 'PRIVATE UPLOAD (WOMEN): When videos_private_women_enabled is OFF, female file picker only accepts images (accept="image/*")' },
      { id: 'vid-10', label: 'PRIVATE UPLOAD (MEN): When videos_private_men_enabled is ON, male file picker accepts both images and videos (accept="image/*,video/*")' },
      { id: 'vid-10b', label: 'PRIVATE UPLOAD (WOMEN): When videos_private_women_enabled is ON, female file picker accepts both images and videos (accept="image/*,video/*")' },
      { id: 'vid-11', label: 'PRIVATE UPLOAD: Uploading a video exceeding max duration shows error and blocks upload' },
      { id: 'vid-12', label: 'PRIVATE UPLOAD: Uploading a video exceeding max file size shows error and blocks upload' },
      { id: 'vid-13', label: 'PRIVATE UPLOAD: Successful video upload stores media_type="video", thumbnail_url, and correct token_cost_to_view (10 for male uploaders)' },
      { id: 'vid-14', label: 'PRIVATE UPLOAD: Video thumbnail appears in My Profile grid with play icon overlay' },
      { id: 'vid-15', label: 'PRIVATE UPLOAD: PhotoReview record created with media_type="video" and thumbnail_url' },
      { id: 'vid-16', label: 'PRIVATE UPLOAD (MEN): Description text changes to mention videos when videos_private_men_enabled is ON (private_photos_videos_desc_men)' },
      { id: 'vid-16b', label: 'PRIVATE UPLOAD (WOMEN): Description text changes to mention videos when videos_private_women_enabled is ON (private_photos_videos_desc_women)' },
      { id: 'vid-17', label: 'PRIVATE UPLOAD (MEN): Upload button text changes to "Upload Private Photo/Video" when videos_private_men_enabled is ON' },
      { id: 'vid-17b', label: 'PRIVATE UPLOAD (WOMEN): Upload button text changes to "Upload Private Photo/Video" when videos_private_women_enabled is ON' },
      { id: 'vid-18', label: 'PRIVATE VIEW: Locked video shows blurred thumbnail with "{n} tokens to unlock" (10 for video, 5 for photo)' },
      { id: 'vid-19', label: 'PRIVATE VIEW: Unlocking a video deducts configurable tokens_private_video_cost (default 10) and creates PrivatePhotoView record with correct tokens_spent' },
      { id: 'vid-20', label: 'PRIVATE VIEW: Unlocking a photo deducts 5 tokens and creates PrivatePhotoView record with tokens_spent=5' },
      { id: 'vid-21', label: 'PRIVATE VIEW: Unlocked video renders as <video> element with poster thumbnail and controls' },
      { id: 'vid-22', label: 'PRIVATE VIEW: Unlocked photo renders as <img> element (unchanged behavior)' },
      { id: 'vid-23', label: 'PRIVATE VIEW: Clicking an unlocked video opens it in the PhotoZoomModal with video player and controls' },
      { id: 'vid-24', label: 'PRIVATE VIEW: Clicking an unlocked photo opens it in the PhotoZoomModal as an image (unchanged)' },
      { id: 'vid-25', label: 'PRIVATE VIEW: Confirm dialog shows "Unlock Private Video" title and correct token cost for videos' },
      { id: 'vid-26', label: 'PRIVATE VIEW: Confirm dialog shows "Unlock Private Photo" title and 5-token cost for photos' },
      { id: 'vid-27', label: 'PRIVATE VIEW: Male viewer with insufficient tokens for video sees token-lock message' },
      { id: 'vid-28', label: 'PRIVATE VIEW: Female viewer can view videos without token deduction' },
      { id: 'vid-29', label: 'CHAT (MEN): When videos_chat_men_enabled is ON, video upload button (VideoIcon) appears for male users' },
      { id: 'vid-29b', label: 'CHAT (WOMEN): When videos_chat_women_enabled is ON, video upload button (VideoIcon) appears for female users' },
      { id: 'vid-30', label: 'CHAT (MEN): When videos_chat_men_enabled is OFF, video upload button is hidden for male users' },
      { id: 'vid-30b', label: 'CHAT (WOMEN): When videos_chat_women_enabled is OFF, video upload button is hidden for female users' },
      { id: 'vid-31', label: 'CHAT: Video cost hint shows in composer area when the user\'s gender-specific video toggle is ON' },
      { id: 'vid-32', label: 'CHAT: Photo cost hint reflects configurable tokens_msg_photo_cost (default 5, was previously hardcoded 2)' },
      { id: 'vid-33', label: 'CHAT: Sending a video deducts correct token cost (men: tokens_msg_video_cost_men, women: tokens_msg_video_cost_women)' },
      { id: 'vid-34', label: 'CHAT: Video exceeding max duration shows error and is not sent' },
      { id: 'vid-35', label: 'CHAT: Video exceeding max file size shows error and is not sent' },
      { id: 'vid-36', label: 'CHAT: Insufficient tokens for video shows error and is not sent' },
      { id: 'vid-37', label: 'CHAT: Sent video creates Message with message_type="video", video_url, and video_thumbnail_url' },
      { id: 'vid-38', label: 'CHAT: Video renders in chat bubble as <video> element with poster and controls' },
      { id: 'vid-39', label: 'CHAT: Video message content shows "🎥 Video" and is excluded from text rendering' },
      { id: 'vid-40', label: 'CHAT: Sender can delete their own video message (trash icon clears video_url and video_thumbnail_url)' },
      { id: 'vid-41', label: 'CHAT: Unverified user clicking video upload sees VerificationRequiredModal' },
      { id: 'vid-42', label: 'ADMIN CONTENT REVIEW: Private videos appear in Content Review grid with video badge and play icon overlay' },
      { id: 'vid-43', label: 'ADMIN CONTENT REVIEW: Chat videos appear in Content Review grid with "Chat Video" badge' },
      { id: 'vid-44', label: 'ADMIN CONTENT REVIEW: Video thumbnail is displayed in review card (not the raw video URL)' },
      { id: 'vid-45', label: 'ADMIN CONTENT REVIEW: Approving a video creates PhotoReview with media_type="video" and thumbnail_url' },
      { id: 'vid-46', label: 'ADMIN CONTENT REVIEW: Rejecting a chat video clears video_url and video_thumbnail_url from the Message' },
      { id: 'vid-47', label: 'ADMIN CONTENT REVIEW: Rejecting a private video sets PrivatePhoto status to "rejected"' },
      { id: 'vid-48', label: 'ADMIN CONTENT REVIEW: Identity comparison modal shows video thumbnail (not raw video) for video items' },
      { id: 'vid-49', label: 'CLOUDINARY: Video uploads use /video/upload endpoint (not /image/upload)' },
      { id: 'vid-50', label: 'CLOUDINARY: Video thumbnail URL is constructed from public_id and returned to frontend' },
      { id: 'vid-51', label: 'i18n: All video-related strings render correctly in all 8 supported languages' },
      { id: 'vid-52', label: 'i18n: chat_token_cost_video, chat_video_too_long, chat_video_too_large, chat_video_insufficient_tokens all translate correctly' },
      { id: 'vid-53', label: 'i18n: private_photos_videos_desc_men shows when videos_private_men_enabled is ON (male user viewing own profile)' },
      { id: 'vid-53b', label: 'i18n: private_photos_videos_desc_women shows when videos_private_women_enabled is ON (female user viewing own profile)' },
      { id: 'vid-54', label: 'GENDER ISOLATION: Enabling videos_private_men_enabled does NOT enable video uploads for female users' },
      { id: 'vid-54b', label: 'GENDER ISOLATION: Enabling videos_private_women_enabled does NOT enable video uploads for male users' },
      { id: 'vid-55', label: 'GENDER ISOLATION: Enabling videos_chat_men_enabled does NOT show the video button for female users' },
      { id: 'vid-55b', label: 'GENDER ISOLATION: Enabling videos_chat_women_enabled does NOT show the video button for male users' },
      { id: 'vid-56', label: 'GENDER ISOLATION: Both men and women toggles can be ON simultaneously without conflict' },
      { id: 'vid-57', label: 'GENDER ISOLATION: Both men and women toggles can be OFF simultaneously (no video uploads for anyone)' },
      // --- Private Photo Upload Toggles ---
      { id: 'vid-58', label: 'ADMIN SETTINGS: "Enable Private Photos — Men" toggle appears in the Private Media & Video Features card and saves to SiteConfig (photos_private_men_enabled, default true)' },
      { id: 'vid-59', label: 'ADMIN SETTINGS: "Enable Private Photos — Women" toggle appears in the Private Media & Video Features card and saves to SiteConfig (photos_private_women_enabled, default true)' },
      { id: 'vid-60', label: 'PHOTO UPLOAD (MEN): When photos_private_men_enabled is OFF, male member sees "Private photo and video uploads are currently disabled" message instead of upload button (if videos also OFF)' },
      { id: 'vid-61', label: 'PHOTO UPLOAD (WOMEN): When photos_private_women_enabled is OFF, female member sees "Private photo and video uploads are currently disabled" message instead of upload button (if videos also OFF)' },
      { id: 'vid-62', label: 'PHOTO UPLOAD (MEN): When photos_private_men_enabled is OFF but videos_private_men_enabled is ON, male member sees "Upload Private Video" button with accept="video/*" only' },
      { id: 'vid-63', label: 'PHOTO UPLOAD (WOMEN): When photos_private_women_enabled is OFF but videos_private_women_enabled is ON, female member sees "Upload Private Video" button with accept="video/*" only' },
      { id: 'vid-64', label: 'PHOTO UPLOAD (MEN): When photos_private_men_enabled is ON, male member can upload private photos normally' },
      { id: 'vid-65', label: 'PHOTO UPLOAD (WOMEN): When photos_private_women_enabled is ON, female member can upload private photos normally' },
      { id: 'vid-66', label: 'PHOTO UPLOAD: Attempting to upload a photo file when photos are disabled (but videos enabled) shows "Photo uploads are not currently enabled" error and blocks upload' },
      { id: 'vid-67', label: 'PHOTO UPLOAD: Attempting to upload a video file when videos are disabled (but photos enabled) shows "Video uploads are not currently enabled" error and blocks upload' },
      { id: 'vid-68', label: 'GENDER ISOLATION: Disabling photos_private_men_enabled does NOT disable photo uploads for female users' },
      { id: 'vid-69', label: 'GENDER ISOLATION: Disabling photos_private_women_enabled does NOT disable photo uploads for male users' },
      { id: 'vid-70', label: 'COMBINED OFF: When both photos and videos are disabled for a gender, the upload button is replaced with a "uploads disabled" message' },
      { id: 'vid-71', label: 'COMBINED ON: When both photos and videos are enabled, upload button says "Upload Private Photo/Video" with accept="image/*,video/*"' },
    ],
  },
  {
    id: 'geocoding',
    icon: MapPin,
    title: 'Geocoding & Zip Code Radius Search',
    color: 'text-teal-500',
    items: [
      // --- Entity fields ---
      { id: 'geo-1', label: 'ENTITY: MemberProfile has location_zip, latitude, and longitude fields' },
      { id: 'geo-2', label: 'ENTITY: location_zip is a string, latitude and longitude are numbers' },
      // --- geocodeZip backend function ---
      { id: 'geo-3', label: 'GEOCODE FUNCTION: geocodeZip returns latitude, longitude, place_name, and state for a valid US zip (e.g. 90210 → Beverly Hills, CA)' },
      { id: 'geo-4', label: 'GEOCODE FUNCTION: geocodeZip works for international postal codes (e.g. DE 10115 → Berlin)' },
      { id: 'geo-5', label: 'GEOCODE FUNCTION: geocodeZip returns 404 not_found for an invalid/non-existent zip code' },
      { id: 'geo-6', label: 'GEOCODE FUNCTION: geocodeZip returns 400 when zip or country_code is missing from the payload' },
      { id: 'geo-7', label: 'GEOCODE FUNCTION: geocodeZip returns 401 for unauthenticated requests' },
      { id: 'geo-8', label: 'GEOCODE FUNCTION: geocodeZip calls Zippopotam.us API (http://api.zippopotam.us/{country}/{zip})' },
      // --- Onboarding ---
      { id: 'geo-9',  label: 'ONBOARDING: Zip/postal code field is present in Step 1 (Basic Information) and is required' },
      { id: 'geo-10', label: 'ONBOARDING: Cannot proceed past Step 1 without entering a zip code' },
      { id: 'geo-11', label: 'ONBOARDING: Completing onboarding geocodes the entered zip and stores latitude/longitude on the MemberProfile' },
      { id: 'geo-12', label: 'ONBOARDING: MemberProfile is created with location_zip, latitude, and longitude populated' },
      { id: 'geo-13', label: 'ONBOARDING: If Zippopotam.us cannot find the zip, profile is still created (geoData empty) without blocking onboarding' },
      // --- MyProfile ---
      { id: 'geo-14', label: 'MY PROFILE: Zip/postal code field is editable and pre-populated with the user\'s saved location_zip' },
      { id: 'geo-15', label: 'MY PROFILE: Saving profile with a new zip re-geocodes and updates latitude/longitude on the MemberProfile' },
      { id: 'geo-16', label: 'MY PROFILE: Changing country + zip and saving correctly geocodes with the new country code' },
      // --- Browse radius search ---
      { id: 'geo-17', label: 'BROWSE: Zip code search input and radius dropdown (5, 10, 25, 50, 100, 250 miles) appear in the filter bar' },
      { id: 'geo-18', label: 'BROWSE: Entering a valid zip + selecting radius shows green "within N mi of ZIP" confirmation text' },
      { id: 'geo-19', label: 'BROWSE: "Looking up zip code..." message appears while geocoding is in progress' },
      { id: 'geo-20', label: 'BROWSE: Invalid zip shows red "Zip code not found" error message' },
      { id: 'geo-21', label: 'BROWSE: Entering a zip without selecting a country shows "Select a country to search by zip" error' },
      { id: 'geo-22', label: 'BROWSE: Radius search filters out profiles beyond the selected distance (Haversine formula, miles)' },
      { id: 'geo-23', label: 'BROWSE: Profiles without latitude/longitude are excluded from radius search results' },
      { id: 'geo-24', label: 'BROWSE: Clearing the zip input removes the radius filter and shows all profiles again' },
      { id: 'geo-25', label: 'BROWSE: "Reset" button clears zip search, radius, and zip coords state' },
      { id: 'geo-26', label: 'BROWSE: Zip geocoding is debounced (600ms) — does not fire API on every keystroke' },
      { id: 'geo-27', label: 'BROWSE: Radius dropdown persists across page reloads (saved to localStorage)' },
      { id: 'geo-28', label: 'BROWSE: Zip search value persists across page reloads (saved to localStorage)' },
      { id: 'geo-29', label: 'BROWSE: Radius search works in combination with other filters (gender, age, looking_for)' },
      // --- i18n ---
      { id: 'geo-30', label: 'i18n: Zip code field label, placeholder, and error messages render correctly in all 8 supported languages' },
      { id: 'geo-31', label: 'i18n: Browse radius label, miles unit, and "within N mi of ZIP" string translate correctly in all 8 languages' },
      // --- getCountryCode utility ---
      { id: 'geo-32', label: 'UTIL: getCountryCode correctly maps country names to ISO codes (e.g. "United States" → "US", "Germany" → "DE")' },
      { id: 'geo-33', label: 'UTIL: haversineDistance returns correct distance in miles between two lat/lng coordinate pairs' },
    ],
  },
  {
    id: 'gender_validation',
    icon: Shield,
    title: 'Gender & Age Validation on ID Verification',
    color: 'text-amber-700',
    items: [
      { id: 'gv-1',  label: 'ENTITY: MemberProfile has didit_extracted_gender field (string: M, F, or U)' },
      { id: 'gv-2',  label: 'ENTITY: MemberProfile has gender_review_needed field (boolean, default false)' },
      { id: 'gv-3',  label: 'WEBHOOK: Didit "Approved" with ID gender "M" and profile gender "male" — auto-verifies (verification_status="verified", gender_review_needed=false)' },
      { id: 'gv-4',  label: 'WEBHOOK: Didit "Approved" with ID gender "F" and profile gender "female" — auto-verifies (verification_status="verified", gender_review_needed=false)' },
      { id: 'gv-5',  label: 'WEBHOOK: Didit "Approved" with ID gender "M" but profile gender "female" — does NOT auto-verify; sets gender_review_needed=true, profile_review_status="pending"' },
      { id: 'gv-6',  label: 'WEBHOOK: Didit "Approved" with ID gender "F" but profile gender "male" — does NOT auto-verify; sets gender_review_needed=true, profile_review_status="pending"' },
      { id: 'gv-7',  label: 'WEBHOOK: Didit "Approved" with ID gender "U" (unknown) — does NOT auto-verify; sets gender_review_needed=true, didit_extracted_gender="U"' },
      { id: 'gv-8',  label: 'WEBHOOK: Gender extracted from webhook payload id_verifications[0].gender when present' },
      { id: 'gv-9',  label: 'WEBHOOK: Falls back to Didit decision API (GET /v3/session/{id}/decision/) when gender not in webhook payload' },
      { id: 'gv-10', label: 'WEBHOOK: didit_extracted_gender is populated with the raw Didit code (M, F, or U) on all Approved webhooks' },
      { id: 'gv-11', label: 'WEBHOOK: Didit "Declined" status is unaffected by gender logic — still sets didit_verification_status="Declined"' },
      { id: 'gv-12', label: 'VERIFY COMPLETE: Page no longer sets verification_status="verified" client-side on Approved — defers to webhook' },
      { id: 'gv-13', label: 'VERIFY COMPLETE: Page waits ~3s for webhook to process, then re-fetches profile to check result' },
      { id: 'gv-14', label: 'VERIFY COMPLETE: If gender_review_needed is true after webhook, shows "Verification Under Review" message (not auto-verified)' },
      { id: 'gv-15', label: 'VERIFY COMPLETE: If verification_status="verified" after webhook, navigates to /browse or /onboarding as before' },
      { id: 'gv-16', label: 'VERIFY COMPLETE: If webhook still processing after wait, falls back to "Verification In Progress" pending state' },
      { id: 'gv-17', label: 'ADMIN QUEUE: Profile with gender_review_needed=true shows amber ⚠ "Gender Review" badge in verification queue' },
      { id: 'gv-18', label: 'ADMIN DETAIL: Gender Mismatch Warning amber banner appears when gender_review_needed is true' },
      { id: 'gv-19', label: 'ADMIN DETAIL: Warning banner shows profile gender (capitalized) and Didit ID gender (Male/Female/Unknown) side-by-side' },
      { id: 'gv-20', label: 'ADMIN DETAIL: Warning text explains whether the mismatch is a gender conflict or an unknown gender on the document' },
      { id: 'gv-21', label: 'ADMIN DETAIL: Admin can still use Approve button to manually verify a gender-flagged profile (sets verification_status="verified")' },
      { id: 'gv-22', label: 'ADMIN DETAIL: Admin can still use Reject button to reject a gender-flagged profile (sets verification_status="rejected")' },
      { id: 'gv-23', label: 'ADMIN DETAIL: After manual approve, profile disappears from gender review queue and member can use the app normally' },
      { id: 'gv-24', label: 'GENDER MAP: Didit "M" maps to profile "male", "F" maps to "female", "U" or missing maps to unknown (triggers review)' },
      // --- Age validation ---
      { id: 'av-1',  label: 'ENTITY: MemberProfile has didit_date_of_birth field (string, date format YYYY-MM-DD)' },
      { id: 'av-2',  label: 'ENTITY: MemberProfile has didit_age field (number)' },
      { id: 'av-3',  label: 'ENTITY: MemberProfile has age_review_needed field (boolean, default false)' },
      { id: 'av-4',  label: 'WEBHOOK: Didit "Approved" with ID age 25 and profile age 25 — auto-verifies (verification_status="verified", age_review_needed=false)' },
      { id: 'av-5',  label: 'WEBHOOK: Didit "Approved" with ID age matching profile age within 1-year tolerance (e.g. 25 vs 26 due to birthday timing) — auto-verifies (age_review_needed=false)' },
      { id: 'av-6',  label: 'WEBHOOK: Didit "Approved" with ID age 17 (under 18) — does NOT auto-verify; sets age_review_needed=true, profile_review_status="pending"' },
      { id: 'av-7',  label: 'WEBHOOK: Didit "Approved" with ID age 16 and profile age 25 — does NOT auto-verify; sets age_review_needed=true (underage takes priority over mismatch)' },
      { id: 'av-8',  label: 'WEBHOOK: Didit "Approved" with ID age 30 and profile age 25 (difference > 1 year) — does NOT auto-verify; sets age_review_needed=true' },
      { id: 'av-9',  label: 'WEBHOOK: Didit "Approved" with ID DOB not matching profile date_of_birth — does NOT auto-verify; sets age_review_needed=true' },
      { id: 'av-10', label: 'WEBHOOK: Didit "Approved" with age/DOB missing from ID document — does NOT auto-verify; sets age_review_needed=true (unknown age)' },
      { id: 'av-11', label: 'WEBHOOK: didit_date_of_birth is populated with the Didit-extracted DOB (YYYY-MM-DD) on Approved webhooks' },
      { id: 'av-12', label: 'WEBHOOK: didit_age is populated with the Didit-computed age (number) on Approved webhooks' },
      { id: 'av-13', label: 'WEBHOOK: Age extracted from webhook payload id_verifications[0].date_of_birth and id_verifications[0].age when present' },
      { id: 'av-14', label: 'WEBHOOK: Falls back to Didit decision API for age/DOB when not present in webhook payload' },
      { id: 'av-15', label: 'WEBHOOK: Both gender AND age must pass to auto-verify — if either flags, profile goes to admin review' },
      { id: 'av-16', label: 'WEBHOOK: Gender mismatch + age match — still flags for review (gender_review_needed=true, age_review_needed=false)' },
      { id: 'av-17', label: 'WEBHOOK: Gender match + age mismatch — still flags for review (gender_review_needed=false, age_review_needed=true)' },
      { id: 'av-18', label: 'WEBHOOK: Both gender and age mismatch — flags for review with both gender_review_needed=true and age_review_needed=true' },
      { id: 'av-19', label: 'WEBHOOK: Didit "Declined" status is unaffected by age logic — still sets didit_verification_status="Declined"' },
      { id: 'av-20', label: 'ADMIN QUEUE: Profile with age_review_needed=true shows amber ⚠ "Age Review" badge in verification queue' },
      { id: 'av-21', label: 'ADMIN QUEUE: Profile with both gender and age review needed shows BOTH amber badges (Gender Review + Age Review)' },
      { id: 'av-22', label: 'ADMIN DETAIL: Age Review Required amber banner appears when age_review_needed is true' },
      { id: 'av-23', label: 'ADMIN DETAIL: Banner shows profile age, profile DOB, Didit ID age, and Didit ID DOB side-by-side' },
      { id: 'av-24', label: 'ADMIN DETAIL: Underage banner text says "The ID document indicates the holder is under 18. This profile must be rejected — do not approve."' },
      { id: 'av-25', label: 'ADMIN DETAIL: Mismatch banner text explains the age/DOB on the document does not match the entered profile age' },
      { id: 'av-26', label: 'ADMIN DETAIL: Unknown-age banner text explains Didit could not extract an age or date of birth from the ID' },
      { id: 'av-27', label: 'ADMIN DETAIL: Admin can use Approve button to manually verify an age-flagged profile (sets verification_status="verified")' },
      { id: 'av-28', label: 'ADMIN DETAIL: Admin can use Reject button to reject an age-flagged profile (sets verification_status="rejected")' },
      { id: 'av-29', label: 'ADMIN DETAIL: After manual approve, profile disappears from review queue and member can use the app normally' },
      { id: 'av-30', label: 'VERIFY COMPLETE: If age_review_needed is true after webhook, shows "Verification Under Review" message (not auto-verified)' },
      // --- Mismatch action toggle (admin setting) ---
      { id: 'ma-1',  label: 'ENTITY: SiteConfig has verification_mismatch_action field (enum: admin_review | hard_reject)' },
      { id: 'ma-2',  label: 'ENTITY: verification_mismatch_action defaults to "admin_review"' },
      { id: 'ma-3',  label: 'ADMIN SETTINGS: "Mismatch Action" dropdown appears in the Didit Identity Verification card' },
      { id: 'ma-4',  label: 'ADMIN SETTINGS: Dropdown has two options — "Admin Review" and "Hard Reject"' },
      { id: 'ma-5',  label: 'ADMIN SETTINGS: Selection saves to SiteConfig.verification_mismatch_action and persists on reload' },
      { id: 'ma-6',  label: 'WEBHOOK: When verification_mismatch_action="admin_review" (default), gender mismatch flags gender_review_needed=true without auto-verifying' },
      { id: 'ma-7',  label: 'WEBHOOK: When verification_mismatch_action="admin_review" (default), age mismatch flags age_review_needed=true without auto-verifying' },
      { id: 'ma-8',  label: 'WEBHOOK: When verification_mismatch_action="admin_review", profile_review_status is set to "pending" for admin review' },
      { id: 'ma-9',  label: 'WEBHOOK: When verification_mismatch_action="hard_reject", gender mismatch sets verification_status="rejected" automatically' },
      { id: 'ma-10', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", age mismatch sets verification_status="rejected" automatically' },
      { id: 'ma-11', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", underage (under 18) sets verification_status="rejected" with rejection_reason="underage"' },
      { id: 'ma-12', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", gender mismatch sets verification_rejection_reason="photo_mismatch"' },
      { id: 'ma-13', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", age/DOB mismatch sets verification_rejection_reason="invalid_id"' },
      { id: 'ma-14', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", unknown age sets verification_rejection_reason="incomplete_verification"' },
      { id: 'ma-15', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", verification_rejection_details contains "Automatically rejected" prefix' },
      { id: 'ma-16', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", gender_review_needed and age_review_needed flags are still set (for audit trail)' },
      { id: 'ma-17', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", profile_review_status is set to "pending"' },
      { id: 'ma-18', label: 'WEBHOOK: When verification_mismatch_action="hard_reject", a clean gender+age match still auto-verifies (toggle only affects mismatches)' },
      { id: 'ma-19', label: 'WEBHOOK: Toggling from hard_reject back to admin_review restores flag-for-review behavior (no auto-reject)' },
      { id: 'ma-20', label: 'VERIFY COMPLETE: When hard_reject is active and a mismatch occurs, member sees rejection screen (verification_status="rejected")' },
      { id: 'ma-21', label: 'ADMIN QUEUE: Hard-rejected profiles do NOT appear in the gender/age review queue (already rejected, not pending review)' },
      { id: 'ma-22', label: 'ADMIN DETAIL: Hard-rejected profile shows rejection reason and details in the detail view' },
      { id: 'ma-23', label: 'ADMIN DETAIL: Admin can still manually approve a hard-rejected profile to override the automatic rejection' },
      { id: 'ma-24', label: 'MEMBER EXPERIENCE: Under admin_review mode, mismatched member sees "Verification Under Review" (not rejected)' },
      { id: 'ma-25', label: 'MEMBER EXPERIENCE: Under hard_reject mode, mismatched member sees rejection screen with the assigned reason' },
    ],
  },
  {
    id: 'adfree',
    icon: EyeOff,
    title: 'Ad-Free Pass (Token-Based Ad Removal)',
    color: 'text-cyan-600',
    items: [
      // --- Entity & Config ---
      { id: 'af-1',  label: 'ENTITY: MemberProfile has ad_free_until field (date-time) for storing ad-free expiry' },
      { id: 'af-2',  label: 'ENTITY: SiteConfig has ad_free_enabled (boolean, default true), ad_free_duration_days (default 7), ad_free_token_cost (default 200)' },
      // --- Admin Settings ---
      { id: 'af-3',  label: 'ADMIN SETTINGS: "Ad-Free Pass" card is visible in Site Settings with enable toggle, duration, and token cost fields' },
      { id: 'af-4',  label: 'ADMIN SETTINGS: Toggling ad_free_enabled OFF hides the AdFreeCard from My Profile and hides the row in Token Guide' },
      { id: 'af-5',  label: 'ADMIN SETTINGS: Toggling ad_free_enabled ON shows the AdFreeCard on My Profile and the row in Token Guide' },
      { id: 'af-6',  label: 'ADMIN SETTINGS: Changing ad_free_duration_days saves and reflects the new duration on AdFreeCard and Token Guide' },
      { id: 'af-7',  label: 'ADMIN SETTINGS: Changing ad_free_token_cost saves and reflects the new cost on AdFreeCard, Token Guide, and My Profile cost breakdown' },
      // --- My Profile UI ---
      { id: 'af-8',  label: 'MY PROFILE: AdFreeCard renders with title "Remove Ads", description showing duration, cost, and current token balance' },
      { id: 'af-9',  label: 'MY PROFILE: User with sufficient tokens sees active "Remove Ads (N tokens)" button' },
      { id: 'af-10', label: 'MY PROFILE: User with insufficient tokens sees "You need N more tokens" message and disabled button' },
      { id: 'af-11', label: 'MY PROFILE: Clicking "Remove Ads" calls purchaseAdFree, deducts tokens, and shows success toast' },
      { id: 'af-12', label: 'MY PROFILE: After purchase, card switches to green "Ads are hidden until {date}" active state' },
      { id: 'af-13', label: 'MY PROFILE: AdFreeCard does NOT render when ad_free_enabled is false' },
      // --- Token Cost Breakdown ---
      { id: 'af-14', label: 'MY PROFILE: "Remove ads" row appears in token cost breakdown when ad_free_enabled is true' },
      { id: 'af-15', label: 'MY PROFILE: "Remove ads" row is hidden from cost breakdown when ad_free_enabled is false' },
      // --- Token Guide ---
      { id: 'af-16', label: 'TOKEN GUIDE: "Remove ads" row appears in the token cost table with correct cost and duration for both men and women' },
      { id: 'af-17', label: 'TOKEN GUIDE: Row is hidden when ad_free_enabled is false' },
      // --- Ad Suppression ---
      { id: 'af-18', label: 'AD SUPPRESSION: JuicyAds embed does NOT render when user has active ad_free_until (on Browse, Profile, Messages, Winks, Favorites)' },
      { id: 'af-19', label: 'AD SUPPRESSION: HilltopAds embed does NOT render when user has active ad_free_until' },
      { id: 'af-20', label: 'AD SUPPRESSION: Ads reappear on all pages after ad_free_until expires' },
      // --- Backend Function ---
      { id: 'af-21', label: 'BACKEND: purchaseAdFree returns 401 for unauthenticated requests' },
      { id: 'af-22', label: 'BACKEND: purchaseAdFree returns 404 when MemberProfile not found' },
      { id: 'af-23', label: 'BACKEND: purchaseAdFree returns 403 when ad_free_enabled is false' },
      { id: 'af-24', label: 'BACKEND: purchaseAdFree returns 402 with tokensNeeded when user has insufficient tokens' },
      { id: 'af-25', label: 'BACKEND: purchaseAdFree deducts correct token amount and sets ad_free_until to N days from now' },
      { id: 'af-26', label: 'BACKEND: purchaseAdFree creates TokenTransaction with type="spend", correct negative tokens, and "Removed ads (N days)" description' },
      { id: 'af-27', label: 'BACKEND: If user already has active ad_free_until, new purchase EXTENDS from existing expiry (not from now)' },
      { id: 'af-28', label: 'BACKEND: If user has expired ad_free_until, new purchase starts from current time' },
      // --- i18n ---
      { id: 'af-29', label: 'i18n: AdFreeCard title, description, cost/duration labels, button text, insufficient message, and active-until text render correctly in all 8 supported languages' },
      { id: 'af-30', label: 'i18n: Token Guide "Remove ads" row label renders correctly in all 8 supported languages' },
      // --- AdFreeBanner (inline on ad pages) ---
      { id: 'af-31', label: 'BANNER: AdFreeBanner renders on /browse page below the ad bars' },
      { id: 'af-32', label: 'BANNER: AdFreeBanner renders on /profile/:id (ViewProfile) page' },
      { id: 'af-33', label: 'BANNER: AdFreeBanner renders on /winks page below the ad bars' },
      { id: 'af-34', label: 'BANNER: AdFreeBanner renders on /messages page below the ad bars' },
      { id: 'af-35', label: 'BANNER: AdFreeBanner renders on /favorites page below the ad bars' },
      { id: 'af-36', label: 'BANNER: Banner shows compact layout with EyeOff icon, ad-free description, and token-cost button' },
      { id: 'af-37', label: 'BANNER: User with sufficient tokens clicking the button calls purchaseAdFree and shows success toast' },
      { id: 'af-38', label: 'BANNER: After successful purchase, myProfile query is invalidated and banner disappears (ad-free now active)' },
      { id: 'af-39', label: 'BANNER: User with insufficient tokens sees button disabled (no purchase attempt)' },
      { id: 'af-40', label: 'BANNER: Banner does NOT render when ad_free_enabled is false' },
      { id: 'af-41', label: 'BANNER: Banner does NOT render when user already has active ad_free_until' },
      { id: 'af-42', label: 'BANNER: Banner disappears from all five pages after ad-free is activated (no page reload needed)' },
    ],
  },
  {
    id: 'creator_earnings',
    icon: Camera,
    title: 'Creator Earnings — Private Media Revenue Sharing',
    color: 'text-emerald-600',
    items: [
      // --- Entity & Config ---
      { id: 'ce-1', label: 'ENTITY: SiteConfig has private_media_creator_share_percentage field (number, default 80)' },
      // --- Admin Settings ---
      { id: 'ce-2', label: 'ADMIN SETTINGS: "Creator Earnings — Private Media" card appears in Token Economy Settings with percentage input' },
      { id: 'ce-3', label: 'ADMIN SETTINGS: Changing the Creator Share (%) saves to SiteConfig.private_media_creator_share_percentage and persists on reload' },
      { id: 'ce-4', label: 'ADMIN SETTINGS: Default value is 80 when the field has not been previously set' },
      // --- Token Award Logic ---
      { id: 'ce-5', label: 'EARNINGS: When a male viewer unlocks a private photo (5 tokens), the content creator receives Math.ceil(5 * percentage / 100) tokens' },
      { id: 'ce-6', label: 'EARNINGS: When a male viewer unlocks a private video (10 tokens), the content creator receives Math.ceil(10 * percentage / 100) tokens' },
      { id: 'ce-7', label: 'EARNINGS: Token award is rounded UP to the nearest whole token (e.g. 80% of 5 = 4, 80% of 10 = 8)' },
      { id: 'ce-8', label: 'EARNINGS: Creator token balance is incremented by the correct amount immediately after the viewer pays' },
      { id: 'ce-9', label: 'EARNINGS: A TokenTransaction record is created for the creator with type="bonus" and description "Earnings from private photo/video view"' },
      { id: 'ce-10', label: 'EARNINGS: Viewer is still charged the full token cost (creator share does NOT reduce the viewer cost)' },
      { id: 'ce-11', label: 'EARNINGS: Female viewer (0 token cost) does NOT trigger a creator award (viewCost is 0)' },
      { id: 'ce-12', label: 'EARNINGS: Setting percentage to 0 awards 0 tokens to the creator (viewer still charged normally)' },
      { id: 'ce-13', label: 'EARNINGS: Setting percentage to 100 awards the full token cost to the creator' },
      // --- UI Description ---
      { id: 'ce-14', label: 'MY PROFILE: Private Photos section shows creator earnings description "💰 You earn {{percentage}}% of the tokens each time a member unlocks one of your private photos or videos (rounded up)."' },
      { id: 'ce-15', label: 'MY PROFILE: Description displays the current configured percentage from SiteConfig' },
      // --- i18n ---
      { id: 'ce-16', label: 'i18n: Creator earnings description renders correctly in all 8 supported languages (EN, ES, TH, ZH, DE, VI, PT, TL)' },
      { id: 'ce-17', label: 'i18n: All translations use "unlocks one of" wording (not "views")' },
    ],
  },
  {
    id: 'profile_privacy',
    icon: Lock,
    title: 'Profile Privacy Toggle',
    color: 'text-indigo-500',
    items: [
      // --- Entity & Config ---
      { id: 'pp-1', label: 'ENTITY: MemberProfile has is_private field (boolean, default false)' },
      { id: 'pp-2', label: 'ENTITY: SiteConfig has tokens_profile_privacy_toggle_cost field (number, default 100)' },
      // --- Admin Settings ---
      { id: 'pp-3', label: 'ADMIN SETTINGS: "Profile Privacy Toggle" card appears in Token Economy Settings with token cost input' },
      { id: 'pp-4', label: 'ADMIN SETTINGS: Changing the token cost saves to SiteConfig.tokens_profile_privacy_toggle_cost and persists on reload' },
      { id: 'pp-5', label: 'ADMIN SETTINGS: Default value is 100 when the field has not been previously set' },
      { id: 'pp-6', label: 'ADMIN SETTINGS: Updated cost value is reflected on the toggle UI, Token Costs section, and Token Guide after save' },
      // --- My Profile UI ---
      { id: 'pp-7', label: 'MY PROFILE: Private/public toggle appears near the Member Tag ID section' },
      { id: 'pp-8', label: 'MY PROFILE: Toggle shows short explanation of what private mode does' },
      { id: 'pp-9', label: 'MY PROFILE: Toggle shows current token cost next to the explanation' },
      { id: 'pp-10', label: 'MY PROFILE: Toggle shows current privacy state ("Your profile is currently private/public")' },
      { id: 'pp-11', label: 'MY PROFILE: Clicking the toggle opens a confirmation dialog showing cost and target state' },
      // --- Token Deduction ---
      { id: 'pp-12', label: 'TOGGLE public→private: Sufficient tokens — confirmation calls toggleProfilePrivacy, deducts tokens, sets is_private=true, shows success toast' },
      { id: 'pp-13', label: 'TOGGLE private→public: Sufficient tokens — confirmation calls toggleProfilePrivacy, deducts tokens, sets is_private=false, shows success toast' },
      { id: 'pp-14', label: 'TOGGLE: After toggle, a TokenTransaction record is created with type="spend", correct negative tokens, and "Profile set to private/public" description' },
      { id: 'pp-15', label: 'TOGGLE: Insufficient token balance blocks the toggle with "You need N tokens" error message' },
      // --- Browse/Search Exclusion ---
      { id: 'pp-16', label: 'BROWSE: Private profile does NOT appear in browse listing when no search query is entered' },
      { id: 'pp-17', label: 'BROWSE: Private profile does NOT appear in search results for partial/substring queries (e.g. searching "20FO" does not return @DRG-20FOL0)' },
      { id: 'pp-18', label: 'BROWSE: Private profile IS returned by exact tag ID match: searching "@DRG-20FOL0" returns the profile' },
      { id: 'pp-19', label: 'BROWSE: Private profile IS returned by exact tag ID match: searching "DRG-20FOL0" returns the profile' },
      { id: 'pp-20', label: 'BROWSE: Private profile IS returned by exact tag ID match: searching "20FOL0" returns the profile' },
      { id: 'pp-21', label: 'BROWSE: Exact-match lookup bypasses gender/age/location filters (private profile appears regardless of active filters)' },
      // --- Backend Function ---
      { id: 'pp-22', label: 'BACKEND: toggleProfilePrivacy returns 401 for unauthenticated requests' },
      { id: 'pp-23', label: 'BACKEND: toggleProfilePrivacy returns 404 when MemberProfile not found' },
      { id: 'pp-24', label: 'BACKEND: toggleProfilePrivacy returns 402 with error message when user has insufficient tokens' },
      { id: 'pp-25', label: 'BACKEND: toggleProfilePrivacy deducts correct token amount from MemberProfile.tokens' },
      { id: 'pp-26', label: 'BACKEND: toggleProfilePrivacy toggles is_private to the opposite of current value' },
      { id: 'pp-27', label: 'BACKEND: toggleProfilePrivacy creates TokenTransaction with type="spend" and "Profile set to private/public" description' },
      // --- Token Guide & Token Costs ---
      { id: 'pp-28', label: 'TOKEN GUIDE: "Toggle profile privacy" row appears in the token cost table with correct cost for both men and women' },
      { id: 'pp-29', label: 'TOKEN COSTS: "Toggle profile privacy" row appears in the Token Costs section on My Profile' },
      { id: 'pp-30', label: 'TOKEN COSTS: Row reflects the current configured cost from SiteConfig' },
      // --- i18n ---
      { id: 'pp-31', label: 'i18n: Toggle label, description, cost note, current state text, confirmation dialog, and success toast render correctly in all 8 supported languages' },
    ],
  },
];

export default function TestPlan() {
  const { user } = useMyProfile();
  const [checked, setChecked] = useState({});
  const [deleted, setDeleted] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => Object.fromEntries(sections.map(s => [s.id, true])));
  const [recordId, setRecordId] = useState(null);
  const saveTimer = useRef(null);

  // Load saved progress on mount
  useEffect(() => {
    base44.entities.TestPlanProgress.list().then(records => {
      if (records.length > 0) {
        setRecordId(records[0].id);
        setChecked(records[0].checked_items || {});
        setDeleted(new Set(records[0].deleted_items || []));
      }
    });
  }, []);

  // Debounced save to database
  const saveProgress = (newChecked, newDeleted) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const payload = {
        checked_items: newChecked,
        deleted_items: Array.from(newDeleted),
      };
      if (recordId) {
        await base44.entities.TestPlanProgress.update(recordId, payload);
      } else {
        const record = await base44.entities.TestPlanProgress.create(payload);
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
      saveProgress(newChecked, deleted);
      return newChecked;
    });
  };
  const toggleSection = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDeleteItem = (itemId) => {
    if (!window.confirm('Delete this test item? It will be removed from the checklist for all future visits.')) return;
    setDeleted(prev => {
      const newDeleted = new Set(prev);
      newDeleted.add(itemId);
      setChecked(prevChecked => {
        const newChecked = { ...prevChecked };
        delete newChecked[itemId];
        saveProgress(newChecked, newDeleted);
        return newChecked;
      });
      return newDeleted;
    });
  };

  const handleRestoreDeleted = () => {
    if (!window.confirm('Restore all deleted test items?')) return;
    setDeleted(new Set());
    saveProgress(checked, new Set());
  };

  const deletedCount = deleted.size;
  const totalItems = sections.reduce((acc, s) => acc + s.items.filter(i => !deleted.has(i.id)).length, 0);
  const checkedCount = Object.entries(checked).filter(([id, v]) => v && !deleted.has(id)).length;
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

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
          const visibleItems = section.items.filter(item => !deleted.has(item.id));
          const sectionChecked = visibleItems.filter(item => checked[item.id]).length;
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
                    {sectionChecked}/{visibleItems.length}
                  </Badge>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && visibleItems.length > 0 && (
                <div className="border-t divide-y">
                  {visibleItems.map(item => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <label className="flex items-start gap-3 flex-1 cursor-pointer">
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
                      <button
                        className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete this test item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {deletedCount > 0 && (
        <div className="text-center mt-4">
          <button
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={handleRestoreDeleted}
          >
            {deletedCount} item{deletedCount !== 1 ? 's' : ''} deleted — Restore all
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-8">
        Progress is automatically saved to the database and persists across sessions.
      </p>
    </div>
  );
}