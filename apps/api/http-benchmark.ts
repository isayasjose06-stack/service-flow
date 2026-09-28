import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = 'change-this-to-a-secure-random-string-at-least-32-chars';

function generateToken(user: any) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function measure(name: string, url: string, token: string, method = 'GET', data?: any) {
  const times: number[] = [];
  const reqCount = 30; // 30 requests to get a baseline
  
  // Warmup
  try { await axios({ method, url, data, headers: { Authorization: `Bearer ${token}` } }); } catch(e) {}

  for (let i = 0; i < reqCount; i++) {
    const start = performance.now();
    try {
      await axios({ method, url, data, headers: { Authorization: `Bearer ${token}` } });
    } catch (e: any) {
      console.log(`${name} Failed:`, e.response?.status);
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
  console.log('--- STARTING HTTP BENCHMARKS ---');
  
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const tech = await prisma.user.findFirst({ where: { role: 'TECHNICIAN' } });
  const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
  
  const adminToken = generateToken(admin);
  const techToken = generateToken(tech);
  const clientToken = generateToken(client);

  const API = 'http://localhost:3000/api';

  await measure('Admin Users List', `${API}/admin/users?page=1&limit=50`, adminToken);
  await measure('Client Requests', `${API}/service-requests/me`, clientToken);
  await measure('Tech Notifications', `${API}/notifications?page=1&limit=50`, techToken);
  
  const request = await prisma.serviceRequest.findFirst({ where: { status: 'PENDING' } });
  if (request) {
    // Matching is an internal method or triggered via API. 
    // Wait, Matching doesn't have an endpoint directly exposed in the controller!
    // It's triggered by `BullMQ` or similar later, or internally when a request is created.
    // If there is no endpoint for matching, I cannot benchmark it via HTTP.
    // Let's check if there is a matching endpoint for dev/admin.
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
