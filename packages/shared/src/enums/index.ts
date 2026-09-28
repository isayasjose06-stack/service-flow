// ============================================================================
// ServiceFlow — Domain Enums
// ============================================================================
// These enums define the domain vocabulary for the entire platform.
// They are shared between backend and frontend.
// ============================================================================

// ── User ────────────────────────────────────────────────────────────────────

export enum UserRole {
  CLIENT = 'CLIENT',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// ── Technician ──────────────────────────────────────────────────────────────

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_UPDATE = 'REQUIRES_UPDATE',
}

export enum VerificationDocumentType {
  ID_DOCUMENT = 'ID_DOCUMENT',
  CERTIFICATION = 'CERTIFICATION',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER',
}

export enum VerificationDocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ── Service Request ─────────────────────────────────────────────────────────

export enum ServiceRequestStatus {
  PENDING = 'PENDING',
  MATCHING = 'MATCHING',
  OFFER_RECEIVED = 'OFFER_RECEIVED',
  TECHNICIAN_SELECTED = 'TECHNICIAN_SELECTED',
  NO_MATCH = 'NO_MATCH',
  EXPIRED = 'EXPIRED',
  CANCELLED_BY_CLIENT = 'CANCELLED_BY_CLIENT',
}

// ── Service Request Match ───────────────────────────────────────────────────

export enum ServiceRequestMatchStatus {
  MATCHED = 'MATCHED',
  VIEWED = 'VIEWED',
  OFFER_SENT = 'OFFER_SENT',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// ── Offer ───────────────────────────────────────────────────────────────────

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
}

// ── Service ─────────────────────────────────────────────────────────────────

export enum ServiceStatus {
  CONFIRMED = 'CONFIRMED',
  ON_THE_WAY = 'ON_THE_WAY',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  RATED = 'RATED',
  CANCELLED_BY_CLIENT = 'CANCELLED_BY_CLIENT',
  CANCELLED_BY_TECHNICIAN = 'CANCELLED_BY_TECHNICIAN',
  DISPUTED = 'DISPUTED',
}

// ── Payment ─────────────────────────────────────────────────────────────────

export enum PaymentMethod {
  CASH = 'CASH',
  NEQUI = 'NEQUI',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// ── Service Image ───────────────────────────────────────────────────────────

export enum ServiceImagePhase {
  INITIAL = 'INITIAL',
  DIAGNOSIS = 'DIAGNOSIS',
  WORK = 'WORK',
  FINAL = 'FINAL',
}

// ── Message ─────────────────────────────────────────────────────────────────

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

// ── Notification ────────────────────────────────────────────────────────────

export enum NotificationType {
  SERVICE_REQUEST_CREATED = 'SERVICE_REQUEST_CREATED',
  MATCH_FOUND = 'MATCH_FOUND',
  TECHNICIAN_RESPONSE = 'TECHNICIAN_RESPONSE',
  TECHNICIAN_SELECTED = 'TECHNICIAN_SELECTED',
  SERVICE_CONFIRMED = 'SERVICE_CONFIRMED',
  TECHNICIAN_ON_THE_WAY = 'TECHNICIAN_ON_THE_WAY',
  TECHNICIAN_ARRIVED = 'TECHNICIAN_ARRIVED',
  SERVICE_STARTED = 'SERVICE_STARTED',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  PAYMENT_REGISTERED = 'PAYMENT_REGISTERED',
  RATING_RECEIVED = 'RATING_RECEIVED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  SERVICE_CANCELLED = 'SERVICE_CANCELLED',
  REQUEST_EXPIRED = 'REQUEST_EXPIRED',
  DOCUMENT_STATUS_CHANGED = 'DOCUMENT_STATUS_CHANGED',
  ACCOUNT_STATUS_CHANGED = 'ACCOUNT_STATUS_CHANGED',
  SYSTEM = 'SYSTEM',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  REQUEST_EXPIRED = 'REQUEST_EXPIRED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  NO_MATCH = 'NO_MATCH',
  PAYMENT_ALREADY_EXISTS = 'PAYMENT_ALREADY_EXISTS',
  RATING_ALREADY_EXISTS = 'RATING_ALREADY_EXISTS',
  CHAT_ACCESS_DENIED = 'CHAT_ACCESS_DENIED',
  ADMIN_ACCESS_DENIED = 'ADMIN_ACCESS_DENIED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
