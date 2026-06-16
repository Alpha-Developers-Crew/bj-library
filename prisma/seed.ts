import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up BJ Library database...");

  const existingAdmin = await prisma.admin.findFirst();
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.admin.create({
      data: {
        username: "admin",
        password: hashedPassword,
        name: "Library Admin",
      },
    });
    console.log("Admin created (username: admin, password: admin123)");
  } else {
    console.log("Admin already exists");
  }

  const existingSlots = await prisma.timeSlot.count();
  if (existingSlots === 0) {
    await prisma.timeSlot.createMany({
      data: [
        { name: "Morning", startTime: "06:00", endTime: "10:00", fee: 500 },
        { name: "Forenoon", startTime: "10:00", endTime: "14:00", fee: 500 },
        { name: "Afternoon", startTime: "14:00", endTime: "18:00", fee: 600 },
        { name: "Evening", startTime: "18:00", endTime: "22:00", fee: 600 },
      ],
    });
    console.log("Time slots created");
  } else {
    console.log("Time slots already exist");
  }

  const existingSeats = await prisma.seat.count();
  if (existingSeats === 0) {
    const seats = Array.from({ length: 50 }, (_, i) => ({ seatNumber: i + 1 }));
    await prisma.seat.createMany({ data: seats });
    console.log("50 seats created");
  } else {
    console.log(`${existingSeats} seats already exist`);
  }

  console.log("Database setup complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
