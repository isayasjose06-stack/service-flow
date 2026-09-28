import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceRequestStatus, ServiceRequestMatchStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async matchServiceRequest(serviceRequestId: string) {
    this.logger.log(`MATCHING_STARTED for request ${serviceRequestId}`);
    
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId }
    });

    if (!request) {
      this.logger.error(`Service Request ${serviceRequestId} no encontrada`);
      throw new NotFoundException('Service Request not found');
    }

    if (request.status !== ServiceRequestStatus.PENDING) {
      this.logger.warn(`Request ${serviceRequestId} ya no está PENDING`);
      return;
    }

    await this.prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status: ServiceRequestStatus.MATCHING }
    });

    try {
      let dayOfWeek = null;
      let timeString = null;
      
      if (request.scheduledDate && request.scheduledTime) {
        // Interpret in America/Bogota strictly as requested
        const yyyy = request.scheduledDate.getUTCFullYear();
        const mo = request.scheduledDate.getUTCMonth() + 1;
        const dd = request.scheduledDate.getUTCDate();
        const hh = request.scheduledTime.getUTCHours();
        const min = request.scheduledTime.getUTCMinutes();
        
        // This constructs the exact moment interpreting it as Bogota time
        const combinedStr = `${yyyy}-${String(mo).padStart(2, '0')}-${String(dd).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(min).padStart(2, '0')}:00-05:00`;
        const dateObj = new Date(combinedStr);
        
        const options: Intl.DateTimeFormatOptions = { timeZone: 'America/Bogota', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false };
        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(dateObj);
        
        dayOfWeek = parts.find(p => p.type === 'weekday')?.value.toUpperCase();
        timeString = `${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}`;
      }

      // IMPORTANTE: $queryRaw usa bind parameters de forma segura ($1, $2, etc) debajo,
      // no hay inyección SQL con Prisma.sql
      const subCatParam = request.subcategoryId ? Prisma.sql`${request.subcategoryId}::uuid` : Prisma.sql`NULL`;

      const query = Prisma.sql`
        SELECT u.id as "technicianId"
        FROM "User" u
        JOIN "TechnicianProfile" tp ON tp."userId" = u.id
        WHERE u.status = 'ACTIVE' 
          AND tp."isAvailable" = true
          AND tp."isVerified" = true
          AND NOT EXISTS (
            SELECT 1 FROM "CategoryVerificationRequirement" cvr
            WHERE cvr."categoryId" = ${request.categoryId}::uuid
              AND cvr."isRequired" = true
              AND NOT EXISTS (
                SELECT 1 FROM "VerificationDocument" vd
                WHERE vd."technicianProfileId" = tp.id
                  AND vd.type = cvr."documentType"
                  AND vd.status = 'APPROVED'
              )
          )
          AND EXISTS (
            SELECT 1 FROM "TechnicianSpecialty" ts
            WHERE ts."technicianProfileId" = tp.id
              AND ts."categoryId" = ${request.categoryId}::uuid
              AND (ts."subcategoryId" IS NULL OR ts."subcategoryId" = ${subCatParam})
          )
          AND EXISTS (
            SELECT 1 FROM "CoverageZone" cz
            WHERE cz."technicianProfileId" = tp.id
              AND cz."isActive" = true
              AND ST_DWithin(
                cz.geom, 
                (SELECT location FROM "ServiceRequest" WHERE id = ${request.id}::uuid), 
                cz."radiusKm" * 1000
              )
          )
          ${dayOfWeek && timeString ? Prisma.sql`
            AND EXISTS (
              SELECT 1 FROM "TechnicianAvailability" ta
              WHERE ta."technicianProfileId" = tp.id
                AND ta."isActive" = true
                AND ta."dayOfWeek" = ${dayOfWeek}
                AND ta."startTime" <= ${timeString}
                AND ta."endTime" >= ${timeString}
            )
          ` : Prisma.empty}
      `;

      const eligibleTechnicians: { technicianId: string }[] = await this.prisma.$queryRaw(query);

      if (eligibleTechnicians.length === 0) {
        this.logger.log(`MATCHING_NO_RESULTS para request ${serviceRequestId}`);
        await this.prisma.serviceRequest.update({
          where: { id: serviceRequestId },
          data: { status: ServiceRequestStatus.NO_MATCH }
        });
        return { matched: 0 };
      }

      let matchesCreated = 0;
      if (eligibleTechnicians.length > 0) {
        const matchesToCreate = eligibleTechnicians.map(tech => ({
          serviceRequestId: request.id,
          technicianId: tech.technicianId,
          status: ServiceRequestMatchStatus.MATCHED,
          matchedAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 horas
        }));

        try {
          const result = await this.prisma.serviceRequestMatch.createMany({
            data: matchesToCreate,
            skipDuplicates: true
          });
          matchesCreated = result.count;
          
          this.logger.log(`MATCH_CREATED para request ${request.id} con ${matchesCreated} tǸcnicos`);
          
          // Emit events in parallel but batched if necessary. We use Promise.all.
          await Promise.all(eligibleTechnicians.map(tech => 
            this.eventEmitter.emitAsync('notification.send', {
              userId: tech.technicianId,
              type: NotificationType.MATCH_FOUND,
              title: 'Nueva Solicitud Compatible',
              body: 'Se ha encontrado una nueva solicitud que encaja con tus especialidades y cobertura.',
              data: { serviceRequestId: request.id },
              sendEmail: true,
              sendPush: true,
              idempotencyKey: `match_${request.id}_${tech.technicianId}`
            })
          ));
        } catch (error: any) {
          throw error;
        }
      }

      await this.prisma.serviceRequest.update({
        where: { id: serviceRequestId },
        data: { 
          matchedCount: matchesCreated 
        }
      });

      this.logger.log(`MATCHING_COMPLETED para request ${serviceRequestId} con ${matchesCreated} matches`);
      return { matched: matchesCreated };

    } catch (err) {
      this.logger.error(`Error en matching de request ${serviceRequestId}:`, err);
      await this.prisma.serviceRequest.update({
        where: { id: serviceRequestId },
        data: { status: ServiceRequestStatus.PENDING }
      });
      throw err;
    }
  }
}
