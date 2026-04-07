export enum SyncSource {
  WIX = 'wix',
  HUBSPOT = 'hubspot',
  SYSTEM = 'system',
}

export enum SyncStatus {
  RECEIVED = 'received',
  SKIPPED = 'skipped',
  SYNCED = 'synced',
  FAILED = 'failed',
}

export enum EntityType {
  CONTACT = 'contact',
  FORM_SUBMISSION = 'form_submission',
}
