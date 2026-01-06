import prisma from "./prismaClient.js";

export async function seedDatabase() {
  console.log("Checking for initial roles...");

  // ---------------------------
  // SEED ROLES
  // ---------------------------
  const existingRole = await prisma.role.findFirst();

  if (!existingRole) {
    console.log("Seeding roles...");

    await prisma.role.createMany({
      data: [
        { name: "ADMIN" },
        { name: "STUDENT" },
      ],
    });

    console.log("Roles seeded.");
  } else {
    console.log("Roles already exist. Skipping roles seeding.");
  }

  // ---------------------------
  // SEED STATUS
  // ---------------------------
  const existingStatus = await prisma.status.findFirst();

  if (!existingStatus) {
    console.log("Seeding status...");

    await prisma.status.createMany({
      data: [
        { name: "PENDING" },
        { name: "APPROVED" },
        { name: "REJECTED" },
        { name: "CANCELLED" },
      ],
    });

    console.log("Status seeded.");
  } else {
    console.log("Status already exist. Skipping status seeding.");
  }

  // ----------------------------------------------------------
  // SEED TIME SLOTS  
  // ----------------------------------------------------------
  const slotExists = await prisma.timeSlot.findFirst();
  if (!slotExists) {
    console.log("Seeding hourly time slots...");

    const slots = generateTimeSlots("08:00", "18:00");

    await prisma.timeSlot.createMany({
      data: slots,
    });

    console.log("Time slots seeded.");
  } else {
    console.log("Time slots already exist. Skipping time slots seeding.");
  }

  // ----------------------------------------------------------
  // SEED BUILDINGS
  // ----------------------------------------------------------
  const existingBuildings = await prisma.building.findFirst();

  if (!existingBuildings) {
    console.log("Seeding buildings...");

    await prisma.building.createMany({
      data: [
        { name: "GP" },
        { name: "SP" },
        { name: "JAVA" },
      ],
    });

    console.log("Buildings seeded.");
  } else {
    console.log("Building already exist. Skipping building seeding.");
  }

  // ----------------------------------------------------------
  // SEED RESOURCES
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // SEED DEPARTMENTS
  // ----------------------------------------------------------
  const existingDepartments = await prisma.department.findFirst();

  if (!existingDepartments) {
    console.log("Seeding departments...");

    await prisma.department.createMany({
      data: [
        { name: "IT" },
        { name: "HR" },
        { name: "OTHER" },
      ],
    });

    console.log("Department seeded.");
  } else {
    console.log("Department already exist. Skipping department seeding.");
  }

  console.log("All seeding complete!");
}

// Helper function to generate hourly time slots
function generateTimeSlots(start, end) {
  const slots = [];

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  const today = new Date();

  let current = new Date(today);
  current.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(today);
  endTime.setHours(endHour, endMinute, 0, 0);

  while (current < endTime) {
    let next = new Date(current);
    next.setHours(current.getHours() + 1); // 1-hour increments

    slots.push({
      name: `${current.getHours()}:00 - ${next.getHours()}:00`,
      startTime: new Date(current),
      endTime: new Date(next),
    });

    current = next;
  }

  return slots;
}