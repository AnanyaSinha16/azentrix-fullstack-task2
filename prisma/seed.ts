import { PrismaClient, Role, ColumnStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const memberPassword = await bcrypt.hash("member123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@azentrix.com" },
    update: {},
    create: {
      email: "admin@azentrix.com",
      password: adminPassword,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@azentrix.com" },
    update: {},
    create: {
      email: "member@azentrix.com",
      password: memberPassword,
      name: "Team Member",
      role: Role.MEMBER,
    },
  });

  const existingBoard = await prisma.board.findFirst({
    where: { title: "Product Sprint" },
  });

  if (!existingBoard) {
    const board = await prisma.board.create({
      data: {
        title: "Product Sprint",
        columns: {
          create: [
            { title: "To Do", order: 0, status: ColumnStatus.TODO },
            { title: "In Progress", order: 1, status: ColumnStatus.IN_PROGRESS },
            { title: "Done", order: 2, status: ColumnStatus.DONE },
          ],
        },
      },
      include: { columns: true },
    });

    const todo = board.columns.find((c) => c.status === ColumnStatus.TODO)!;
    const inProgress = board.columns.find((c) => c.status === ColumnStatus.IN_PROGRESS)!;

    await prisma.card.createMany({
      data: [
        {
          title: "Design landing page",
          description: "Create wireframes and mockups for the marketing site.",
          priority: Priority.HIGH,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          order: 0,
          columnId: todo.id,
          assigneeId: member.id,
          creatorId: admin.id,
        },
        {
          title: "Set up CI pipeline",
          description: "Configure GitHub Actions for lint and build.",
          priority: Priority.MEDIUM,
          order: 1,
          columnId: todo.id,
          assigneeId: admin.id,
          creatorId: admin.id,
        },
        {
          title: "Implement auth flow",
          description: "JWT login with httpOnly cookies.",
          priority: Priority.HIGH,
          order: 0,
          columnId: inProgress.id,
          assigneeId: member.id,
          creatorId: admin.id,
        },
      ],
    });
  }

  console.log("Seed complete:", { admin: admin.email, member: member.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
