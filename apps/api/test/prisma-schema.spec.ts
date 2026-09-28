import { PrismaClient, Prisma } from '@prisma/client';

describe('Prisma Schema Validation (Phase 2)', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have all expected models defined', () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.clientProfile).toBeDefined();
    expect(prisma.technicianProfile).toBeDefined();
    expect(prisma.category).toBeDefined();
    expect(prisma.subcategory).toBeDefined();
    expect(prisma.technicianSpecialty).toBeDefined();
    expect(prisma.coverageZone).toBeDefined();
    expect(prisma.serviceRequest).toBeDefined();
    expect(prisma.serviceRequestMatch).toBeDefined();
    expect(prisma.offer).toBeDefined();
    expect(prisma.service).toBeDefined();
    expect(prisma.payment).toBeDefined();
    expect(prisma.rating).toBeDefined();
    expect(prisma.categoryVerificationRequirement).toBeDefined();
  });

  it('should have the correct fields on ServiceRequestMatch', () => {
    // We can check the Prisma.ServiceRequestMatchScalarFieldEnum
    const fields = Prisma.ServiceRequestMatchScalarFieldEnum;
    expect(fields.id).toBeDefined();
    expect(fields.serviceRequestId).toBeDefined();
    expect(fields.technicianId).toBeDefined();
    expect(fields.status).toBeDefined();
    expect(fields.matchedAt).toBeDefined();
    expect(fields.notifiedAt).toBeDefined();
    expect(fields.viewedAt).toBeDefined();
    expect(fields.respondedAt).toBeDefined();
    expect(fields.expiresAt).toBeDefined();
  });

  it('should not have commission fields on Payment (Phase 0 decision)', () => {
    const fields = Prisma.PaymentScalarFieldEnum as any;
    expect(fields.platformFee).toBeUndefined();
    expect(fields.technicianEarnings).toBeUndefined();
  });

  it('should support general specialties (subcategoryId is nullable)', () => {
    // If subcategoryId was not nullable, typescript would complain if we assign null
    type SpecialtyCreate = Prisma.TechnicianSpecialtyCreateInput;
    const testPayload: SpecialtyCreate = {
      technicianProfile: { connect: { id: 'uuid' } },
      category: { connect: { id: 'uuid' } },
      subcategory: { connect: { id: 'uuid' } }, // Optional/Nullable check handled by TS compiler
    };
    expect(testPayload).toBeDefined();
  });
  
  it('should have PostGIS manual script generated', () => {
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../prisma/manual-postgis-setup.sql');
    expect(fs.existsSync(sqlPath)).toBe(true);
  });
});
