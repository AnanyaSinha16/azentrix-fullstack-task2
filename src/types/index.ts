export type UserRole = "admin" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  order: number;
  boardId: string;
  assigneeId: string | null;
  assignee?: UserSummary | null;
  creatorId: string;
  creator?: UserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardData {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  members: UserSummary[];
  tasks: TaskData[];
  createdAt: string;
}

export interface StandupData {
  id: string;
  userId: string;
  userName: string;
  yesterday: string;
  today: string;
  blockers: string;
  date: string;
  createdAt: string;
}

export interface ActivityData {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  boardId?: string;
  boardName?: string;
  createdAt: string;
}

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  completionRate: number;
  byPriority: { priority: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byBoard: { boardName: string; total: number; completed: number }[];
  completionTrend: { date: string; completed: number }[];
}

export type CardData = TaskData;

export interface ColumnData {
  id: "todo" | "in_progress" | "done";
  title: string;
  cards: TaskData[];
}

