import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Food & Dining", color: "#f97316", icon: "utensils" },
    { name: "Transport", color: "#3b82f6", icon: "car" },
    { name: "Rent", color: "#8b5cf6", icon: "home" },
    { name: "Utilities", color: "#06b6d4", icon: "bolt" },
    { name: "Shopping", color: "#ec4899", icon: "bag" },
    { name: "Entertainment", color: "#eab308", icon: "film" },
    { name: "Health", color: "#22c55e", icon: "heart" },
    { name: "Salary", color: "#10b981", icon: "wallet" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  console.log("Seeded categories");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
