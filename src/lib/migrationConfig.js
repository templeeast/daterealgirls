// Frontend migration configuration for the DataMigrationAdmin page.
// Mirrors base44/shared/migrationConfig.ts (entities + unique keys only).

export const entitiesToMigrate = [
  'SiteConfig',
  'MemberProfile',
  'City',
  'PromoCode',
  'AdminTodo',
  'Conversation',
  'Message',
  'Wink',
  'Favorite',
  'PrivatePhoto',
  'PrivatePhotoAccess',
  'PrivatePhotoView',
  'PhotoReview',
  'Payment',
  'TokenTransaction',
  'SupportTicket',
  'UserReport',
  'TestPlanProgress',
];

export const entityUniqueKeys = {
  SiteConfig: null,
  MemberProfile: ['user_id'],
  City: ['name', 'country'],
  PromoCode: ['code'],
  AdminTodo: ['title'],
  Conversation: ['source_id'],
  Message: ['source_id'],
  Wink: ['sender_id', 'recipient_profile_id'],
  Favorite: ['user_id', 'favorited_profile_id'],
  PrivatePhoto: ['member_id', 'photo_url'],
  PrivatePhotoAccess: ['owner_member_id', 'viewer_member_id'],
  PrivatePhotoView: ['private_photo_id', 'viewer_member_id'],
  PhotoReview: ['photo_url', 'source_type'],
  Payment: ['source_id'],
  TokenTransaction: ['source_id'],
  SupportTicket: ['source_id'],
  UserReport: ['reporter_id', 'reported_profile_id'],
  TestPlanProgress: null,
};