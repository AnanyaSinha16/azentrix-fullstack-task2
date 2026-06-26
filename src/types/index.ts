import type { Priority, Role } from "@prisma/client";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CardData {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  order: number;
  columnId: string;
  assigneeId: string | null;
  creatorId: string;
  assignee: UserSummary | null;
  creator: UserSummary;
}

export interface ColumnData {
  id: string;
  title: string;
  order: number;
  status: string;
  cards: CardData[];
}

export interface BoardData {
  id: string;
  title: string;
  columns: ColumnData[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
