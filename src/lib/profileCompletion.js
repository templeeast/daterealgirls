// Shared profile-completion criteria used by both the incomplete-profile
// banner and the route guard, so the two never drift out of sync.

const PHOTO_FIELDS = Array.from({ length: 15 }, (_, i) => `photo_${i + 1}`);

export function isIdentityVerified(profile) {
  return profile?.didit_verification_status === 'Approved';
}

export function hasProfilePhoto(profile) {
  if (!profile) return false;
  return PHOTO_FIELDS.some((f) => profile[f]);
}

export function getMissingDetailFields(profile) {
  return [
    { key: 'age', done: !!(profile?.age || profile?.date_of_birth) },
    { key: 'location', done: !!profile?.location_city },
    { key: 'bio', done: typeof profile?.bio === 'string' && profile.bio.trim().length > 0 },
    { key: 'marital', done: !!profile?.marital_status },
  ].filter((f) => !f.done);
}

export function isProfileFullyComplete(profile) {
  if (!profile) return false;
  return (
    isIdentityVerified(profile) &&
    hasProfilePhoto(profile) &&
    getMissingDetailFields(profile).length === 0
  );
}