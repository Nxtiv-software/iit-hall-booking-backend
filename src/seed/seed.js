import prisma from "../prismaClient.js";
import { rolesSeed } from "./roles_seed.js";
import { buildingSeed } from "./buildings_seed.js";
import { statusSeed } from "./status_seed.js";
import { departmentSeed } from "./departments_seed.js";
import { venueSeed } from "./venue_seed.js";

export async function seedDatabase() {
  console.log("Checking for initial roles...");

  // ---------------------------
  // SEED ROLES
  // ---------------------------
  const existingRole = await prisma.role.findFirst();

  if (!existingRole) {
    console.log("Seeding roles...");

    await prisma.role.createMany({
      data:
        rolesSeed
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
      data:
        statusSeed
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
      data:
        buildingSeed
    });

    console.log("Buildings seeded.");
  } else {
    console.log("Building already exist. Skipping building seeding.");
  }

  // ----------------------------------------------------------
  // SEED VENUES
  // ----------------------------------------------------------
  const existingVenues = await prisma.venue.findFirst();

  if (!existingVenues) {
    console.log("Seeding venues...");

    const buildings = await prisma.building.findMany();

    const buildingMap = {};
      buildings.forEach((b) => {
        buildingMap[b.name] = b.id;
      });

    const venuesData = venueSeed.map((venue) => {
      const buildingId = buildingMap[venue.buildingName];

      if (!buildingId) {
        throw new Error(
          `Building "${venue.buildingName}" not found for venue "${venue.name}"`
        );
      }

      return {
        name: venue.name,
        description: venue.description ?? null,
        isAvailable: venue.isAvailable ?? true,
        capacityAcademic: venue.capacityAcademic,
        capacityExamination: venue.capacityExamination,
        floorNumber: venue.floorNumber,
        buildingId, 
      };
    });

    await prisma.venue.createMany({
      data: 
        venuesData,
    });

    console.log("Venue seeded.");
  } else {
    console.log("Venue already exist. Skipping venue seeding.");
  }
  

  // ----------------------------------------------------------
  // SEED DEPARTMENTS
  // ----------------------------------------------------------
  const existingDepartments = await prisma.department.findFirst();

  if (!existingDepartments) {
    console.log("Seeding departments...");

    await prisma.department.createMany({
      data: 
        departmentSeed
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