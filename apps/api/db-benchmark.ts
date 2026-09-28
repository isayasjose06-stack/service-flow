import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: [] });

async function measure(name: string, fn: () => Promise<any>) {
  const times: number[] = [];
  const reqCount = 30; // 30 requests to get a baseline
  
  // Warmup
  try { await fn(); } catch(e) {}

  for (let i = 0; i < reqCount; i++) {
    const start = performance.now();
    try {
      await fn();
    } catch (e: any) {
      console.log(`${name} Failed:`, e.message);
    }
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  console.log(`[${name}] p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms`);
}

async function main() {
  console.log('--- STARTING DB BENCHMARKS ---');
  
  const tech = await prisma.user.findFirst({ where: { role: 'TECHNICIAN' } });
  const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
  const pendingReq = await prisma.serviceRequest.findFirst({ where: { status: 'PENDING' } });

  await measure('Admin Users List (Pagination)', () => {
    return prisma.user.findMany({
      skip: 0,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true,
      },
    });
  });

  if (client) {
    await measure('Client Requests', () => {
      return prisma.serviceRequest.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          subcategory: true,
        },
      });
    });
  }

  if (tech) {
    await measure('Tech Notifications List', () => {
      return prisma.notification.findMany({
        where: { userId: tech.id },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });
  }

  if (pendingReq) {
    await measure('Matching Query', async () => {
      return prisma.$queryRaw`
        SELECT u.id as "technicianId"
        FROM "User" u
        JOIN "TechnicianProfile" tp ON tp."userId" = u.id
        WHERE u.status = 'ACTIVE' 
          AND tp."isAvailable" = true
          AND tp."isVerified" = true
          AND EXISTS (
            SELECT 1 FROM "CoverageZone" cz
            WHERE cz."technicianProfileId" = tp.id
              AND cz."isActive" = true
              AND ST_DWithin(
                cz.geom, 
                (SELECT location FROM "ServiceRequest" WHERE id = ${pendingReq.id}::uuid), 
                cz."radiusKm" * 1000
              )
          )
      `;
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
