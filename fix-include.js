const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/api/src/modules/service-requests/service-requests.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target = `include: {
          technician: {
            include: {
              technicianProfile: {
                include: {
                  specialties: { include: { category: true, subcategory: true } }
                }
              }
            }
          }
        },`;

const replacement = `include: {
          technician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              technicianProfile: {
                select: {
                  id: true,
                  isVerified: true
                }
              }
            }
          }
        },`;

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content);
console.log('Fixed include in service-requests.service.ts');
