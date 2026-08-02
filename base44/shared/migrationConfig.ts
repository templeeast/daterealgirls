// Migration configuration shared by sendMigrationData and receiveMigrationData backend functions.
// Entities are ordered so parents are migrated before children (for FK remapping).

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

// null = singleton (always update the single most recently updated record)
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

// FK fields that reference other migrated entities (field → referenced entity name).
// The receiver looks up the referenced entity by source_id to remap old→new IDs.
// Fields referencing User (user_id, sender_id, participant_*_id, etc.) are NOT
// remapped — User is built-in and must exist in the destination app independently.
export const entityForeignKeys = {
  Message: { conversation_id: 'Conversation' },
  Wink: { recipient_profile_id: 'MemberProfile' },
  Favorite: { favorited_profile_id: 'MemberProfile' },
  PrivatePhoto: { member_id: 'MemberProfile' },
  PrivatePhotoAccess: { owner_member_id: 'MemberProfile', viewer_member_id: 'MemberProfile' },
  PrivatePhotoView: { private_photo_id: 'PrivatePhoto', viewer_member_id: 'MemberProfile' },
  PhotoReview: { source_profile_id: 'MemberProfile', source_message_id: 'Message', source_conversation_id: 'Conversation' },
  Payment: { member_profile_id: 'MemberProfile' },
  UserReport: { reported_profile_id: 'MemberProfile' },
};

// Entities that have a `source_id` field in their schema. Used by the receiver to
// decide whether to keep or strip source_id before create/update.
export const entitiesWithSourceId = [
  'MemberProfile',
  'Conversation',
  'Message',
  'PrivatePhoto',
  'TokenTransaction',
  'SupportTicket',
  'Payment',
];