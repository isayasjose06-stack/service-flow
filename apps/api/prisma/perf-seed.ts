import { PrismaClient, UserRole, UserStatus, ServiceRequestStatus, NotificationType } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Performance Seed...');

  const category = await prisma.category.findFirst();
  if (!category) throw new Error('Run normal seed first');

  // Create 100 Technicians
  console.log('Creating Technicians...');
  const techs = [];
  for(let i=0; i<100; i++) {
    const userId = randomUUID();
    techs.push({
      id: userId,
      email: `tech${i}@perf.com`,
      passwordHash: 'hash',
      firstName: `Tech${i}`,
      lastName: 'Perf',
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
    });
  }
  await prisma.user.createMany({ data: techs, skipDuplicates: true });

  const techProfiles = techs.map(t => ({
    id: randomUUID(),
    userId: t.id,
    isAvailable: true,
    isVerified: true
  }));
  await prisma.technicianProfile.createMany({ data: techProfiles, skipDuplicates: true });

  // Update CoverageZone for PostGIS
  console.log('Creating CoverageZones with PostGIS...');
  for(let i=0; i<100; i++) {
    const tpId = techProfiles[i].id;
    // Spread around a central point (Bogota approx 4.6097, -74.0817)
    const lat = 4.6097 + (Math.random() - 0.5) * 0.1;
    const lng = -74.0817 + (Math.random() - 0.5) * 0.1;
    
    await prisma.$executeRaw`
      INSERT INTO "CoverageZone" (id, "technicianProfileId", city, latitude, longitude, "radiusKm", "isActive", geom, "updatedAt")
      VALUES (gen_random_uuid(), ${tpId}::uuid, 'Bogota', ${lat}, ${lng}, 20, true, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, now())
    `;

    await prisma.technicianSpecialty.create({
      data: {
        technicianProfileId: tpId,
        categoryId: category.id
      }
    });
  }

  // Create 50 Clients
  console.log('Creating Clients...');
  const clients = [];
  for(let i=0; i<50; i++) {
    clients.push({
      id: randomUUID(),
      email: `client${i}@perf.com`,
      passwordHash: 'hash',
      firstName: `Client${i}`,
      lastName: 'Perf',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });
  }
  await prisma.user.createMany({ data: clients, skipDuplicates: true });

  // Create 1000 Service Requests
  console.log('Creating ServiceRequests...');
  const requests = [];
  for(let i=0; i<1000; i++) {
    const lat = 4.6097 + (Math.random() - 0.5) * 0.1;
    const lng = -74.0817 + (Math.random() - 0.5) * 0.1;
    const reqId = randomUUID();
    requests.push({
      id: reqId,
      clientId: clients[Math.floor(Math.random() * clients.length)].id,
      categoryId: category.id,
      title: `Need help ${i}`,
      description: `Description ${i}`,
      latitude: lat,
      longitude: lng,
      status: ServiceRequestStatus.PENDING,
      expiresAt: new Date(Date.now() + 86400000)
    });
  }
  await prisma.serviceRequest.createMany({ data: requests, skipDuplicates: true });

  // Update locations in PostGIS
  console.log('Updating ServiceRequest locations...');
  for(const req of requests) {
    await prisma.$executeRaw`
      UPDATE "ServiceRequest" SET location = ST_SetSRID(ST_MakePoint(${req.longitude}, ${req.latitude}), 4326)::geography WHERE id = ${req.id}::uuid
    `;
  }

  // Create 10000 Notifications
  console.log('Creating 10000 Notifications...');
  const notifs = [];
  for(let i=0; i<10000; i++) {
    notifs.push({
      id: randomUUID(),
      userId: techs[Math.floor(Math.random() * techs.length)].id,
      type: NotificationType.SYSTEM,
      title: 'Perf Alert',
      body: 'This is a perf test notification',
      emailStatus: 'PENDING',
      pushStatus: 'PENDING'
    });
  }
  // Batch insert
  const chunkSize = 2000;
  for (let i = 0; i < notifs.length; i += chunkSize) {
    await prisma.notification.createMany({ data: notifs.slice(i, i + chunkSize), skipDuplicates: true });
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
