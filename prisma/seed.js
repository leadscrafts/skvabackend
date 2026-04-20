import prisma from "../src/config/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding users...");

  const hashedPassword = await bcrypt.hash("skva.co.in@vignesh30", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Admin User",
        email: "skvainfo@gmail.com",
        password: hashedPassword,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
