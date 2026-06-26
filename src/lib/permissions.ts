import { Role } from "@prisma/client";
import { SessionUser } from "@/types";

type CardLike = {
  assigneeId: string | null;
  creatorId: string;
};

export function isAdmin(user: SessionUser): boolean {
  return user.role === Role.ADMIN;
}

export function canEditCard(user: SessionUser, card: CardLike): boolean {
  if (isAdmin(user)) return true;
  return card.assigneeId === user.id;
}

export function canDeleteCard(user: SessionUser, card: CardLike): boolean {
  if (isAdmin(user)) return true;
  return card.creatorId === user.id || card.assigneeId === user.id;
}
