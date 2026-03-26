// Re-export Prisma types
export type {
  User,
  Centre,
  Formation,
  Session,
  Reservation,
  Categorie,
  Notification,
  Ticket,
  TicketMessage,
  PlatformSettings,
} from "@/generated/prisma/client";

export {
  Role,
  ReservationStatus,
  Modalite,
  TicketStatus,
  MonetisationModel,
} from "@/generated/prisma/client";

// ─── Custom types with relations ────────────────────────

import type {
  Formation,
  Centre,
  Session,
  Categorie,
  Reservation,
  User,
} from "@/generated/prisma/client";

export interface FormationWithRelations extends Formation {
  centre: Centre;
  sessions: Session[];
  categorie: Categorie | null;
}

export interface SessionWithFormation extends Session {
  formation: FormationWithRelations;
}

export interface ReservationWithDetails extends Reservation {
  session: SessionWithFormation;
  user: User;
}

// ─── API Response types ─────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  errors?: Array<{ message: string; path: string[] }>;
}
