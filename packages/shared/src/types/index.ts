// ============================================================================
// ServiceFlow — Shared Types
// ============================================================================
// Base types shared between frontend and backend.
// These are NOT database models — they represent API response shapes
// and domain abstractions used on both sides.
// ============================================================================

import { UserRole, UserStatus, ServiceStatus, ServiceRequestStatus } from '../enums';

/** Minimal user info returned in API responses */
export interface UserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
}

/** API error response shape */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  errorCode?: string;
  requestId?: string;
  timestamp: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Service status transition map — defines which transitions are valid */
export const VALID_SERVICE_TRANSITIONS: Record<string, string[]> = {
  [ServiceStatus.CONFIRMED]: [
    ServiceStatus.ON_THE_WAY,
    ServiceStatus.CANCELLED_BY_CLIENT,
    ServiceStatus.CANCELLED_BY_TECHNICIAN,
  ],
  [ServiceStatus.ON_THE_WAY]: [
    ServiceStatus.ARRIVED,
    ServiceStatus.CANCELLED_BY_CLIENT,
    ServiceStatus.CANCELLED_BY_TECHNICIAN,
  ],
  [ServiceStatus.ARRIVED]: [ServiceStatus.IN_PROGRESS],
  [ServiceStatus.IN_PROGRESS]: [ServiceStatus.COMPLETED],
  [ServiceStatus.COMPLETED]: [ServiceStatus.PAID, ServiceStatus.DISPUTED],
  [ServiceStatus.PAID]: [ServiceStatus.RATED],
  [ServiceStatus.DISPUTED]: [ServiceStatus.COMPLETED],
  // Terminal states have no outgoing transitions:
  // CANCELLED_BY_CLIENT, CANCELLED_BY_TECHNICIAN, RATED
};

/** Service request status transition map */
export const VALID_REQUEST_TRANSITIONS: Record<string, string[]> = {
  [ServiceRequestStatus.PENDING]: [
    ServiceRequestStatus.MATCHING,
    ServiceRequestStatus.CANCELLED_BY_CLIENT,
    ServiceRequestStatus.EXPIRED,
  ],
  [ServiceRequestStatus.MATCHING]: [
    ServiceRequestStatus.OFFER_RECEIVED,
    ServiceRequestStatus.NO_MATCH,
    ServiceRequestStatus.CANCELLED_BY_CLIENT,
    ServiceRequestStatus.EXPIRED,
  ],
  [ServiceRequestStatus.OFFER_RECEIVED]: [
    ServiceRequestStatus.OFFER_RECEIVED, // more offers can arrive
    ServiceRequestStatus.TECHNICIAN_SELECTED,
    ServiceRequestStatus.CANCELLED_BY_CLIENT,
    ServiceRequestStatus.EXPIRED,
  ],
  // Terminal states: TECHNICIAN_SELECTED, NO_MATCH, EXPIRED, CANCELLED_BY_CLIENT
};
