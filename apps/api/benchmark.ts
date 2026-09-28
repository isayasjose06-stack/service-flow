import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MatchingService } from './src/modules/matching/matching.service';
import { AdminUsersService } from './src/modules/admin/admin-users.service';
import { NotificationsService } from './src/modules/notifications/notifications.service';
import { ServiceRequestsService } from './src/modules/service-requests/service-requests.service';
import { PrismaService } from './src/prisma/prisma.service';

async function runBenchmark() {
  console.log('Bootstrapping Nest context...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const matchingService = app.get(MatchingService);
  const adminUsersService = app.get(AdminUsersService);
  const notificationsService = app.get(NotificationsService);
  const serviceReqService = app.get(ServiceRequestsService);

  console.log('--- STARTING BENCHMARKS ---');

  // 1. Admin Users List
  console.log('1. AdminUsersService.getUsers (Pagination)');
  let start = performance.now();
  await adminUsersService.getUsers(1, 100);
  console.log(`Initial call (cold): ${(performance.now() - start).toFixed(2)}ms`);
  
  let times = [];
  for (let i = 0; i < 50; i++) {
    start = performance.now();
    await adminUsersService.getUsers(1, 50);
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  console.log(`p50: ${times[Math.floor(times.length * 0.5)].toFixed(2)}ms | p95: ${times[Math.floor(times.length * 0.95)].toFixed(2)}ms`);

  // 2. Notifications List
  console.log('\n2. NotificationsService.getUserNotifications (Pagination)');
  const someTech = await prisma.user.findFirst({ where: { role: 'TECHNICIAN' } });
  if (someTech) {
    times = [];
    for (let i = 0; i < 50; i++) {
      start = performance.now();
      await notificationsService.getUserNotifications(someTech.id, 1, 50);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    console.log(`p50: ${times[Math.floor(times.length * 0.5)].toFixed(2)}ms | p95: ${times[Math.floor(times.length * 0.95)].toFixed(2)}ms`);
  }

  // 3. Matching Service
  console.log('\n3. MatchingService.matchServiceRequest');
  // Find a pending request
  const requests = await prisma.serviceRequest.findMany({ where: { status: 'PENDING' }, take: 10 });
  times = [];
  for (const req of requests) {
    start = performance.now();
    try {
      await matchingService.matchServiceRequest(req.id);
      times.push(performance.now() - start);
    } catch (e) {
      console.log('Match failed:', e.message);
    }
  }
  times.sort((a, b) => a - b);
  if (times.length > 0) {
    console.log(`p50: ${times[Math.floor(times.length * 0.5)].toFixed(2)}ms | p95: ${times[Math.floor(times.length * 0.95)].toFixed(2)}ms`);
  }

  // 4. Client My Requests
  console.log('\n4. ServiceRequestsService.findAllMyRequests');
  const someClient = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
  if (someClient) {
    times = [];
    for (let i = 0; i < 50; i++) {
      start = performance.now();
      await serviceReqService.findAllMyRequests(someClient.id);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    console.log(`p50: ${times[Math.floor(times.length * 0.5)].toFixed(2)}ms | p95: ${times[Math.floor(times.length * 0.95)].toFixed(2)}ms`);
  }

  await app.close();
}

runBenchmark().catch(console.error);
