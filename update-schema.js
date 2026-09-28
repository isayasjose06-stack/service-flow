const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'apps/api/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. User
schema = schema.replace(
  '    updatedAt     DateTime   @updatedAt @db.Timestamp(6)',
  '    updatedAt     DateTime   @updatedAt @db.Timestamp(6)\n\n    @@index([createdAt])'
);

// 2. Notification
schema = schema.replace(
  '    @@index([userId, readAt])',
  '    @@index([userId, readAt])\n    @@index([userId, createdAt])'
);

// 3. ServiceRequest
schema = schema.replace(
  '    @@index([clientId])',
  '    @@index([clientId])\n    @@index([clientId, createdAt])'
);

// 4. Offer
schema = schema.replace(
  '    technician     User           @relation(fields: [technicianId], references: [id], onDelete: Cascade)\n    service        Service?\n  }',
  '    technician     User           @relation(fields: [technicianId], references: [id], onDelete: Cascade)\n    service        Service?\n\n    @@index([serviceRequestId, status])\n    @@index([technicianId, status])\n  }'
);

// 5. Service
schema = schema.replace(
  '    @@index([technicianId])',
  '    @@index([technicianId])\n    @@index([technicianId, status])'
);

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully');
