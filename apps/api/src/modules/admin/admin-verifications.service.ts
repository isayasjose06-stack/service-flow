import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { VerificationDocumentStatus, VerificationStatus, UserStatus } from '@serviceflow/shared';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';

@Injectable()
export class AdminVerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async approveDocument(adminId: string, documentId: string, note?: string) {
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updatedDoc = await this.prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: VerificationDocumentStatus.APPROVED,
        reviewNote: note,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    await this.auditService.logAction(adminId, 'APPROVE_DOCUMENT', 'VerificationDocument', documentId, { note });

    // Check if all required docs are approved to verify the technician
    await this.checkAndUpdateTechnicianVerification(updatedDoc.technicianProfileId);

    const profile = await this.prisma.technicianProfile.findUnique({ where: { id: updatedDoc.technicianProfileId } });
    if (profile) {
      this.eventEmitter.emit('notification.send', {
        userId: profile.userId,
        type: NotificationType.DOCUMENT_STATUS_CHANGED,
        title: 'Documento Aprobado',
        body: 'Un documento de tu perfil ha sido aprobado.',
        data: { documentId, status: 'APPROVED' },
        sendEmail: true,
        sendPush: true,
        idempotencyKey: `document_approved_${documentId}`
      });
    }

    return updatedDoc;
  }

  async rejectDocument(adminId: string, documentId: string, reason: string) {
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updatedDoc = await this.prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: VerificationDocumentStatus.REJECTED,
        reviewNote: reason,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.technicianProfile.update({
      where: { id: document.technicianProfileId },
      data: { verificationStatus: VerificationStatus.REQUIRES_UPDATE },
    });

    await this.auditService.logAction(adminId, 'REJECT_DOCUMENT', 'VerificationDocument', documentId, { reason });

    const profile = await this.prisma.technicianProfile.findUnique({ where: { id: document.technicianProfileId } });
    if (profile) {
      this.eventEmitter.emit('notification.send', {
        userId: profile.userId,
        type: NotificationType.DOCUMENT_STATUS_CHANGED,
        title: 'Documento Rechazado',
        body: `Un documento ha sido rechazado. Razón: ${reason}`,
        data: { documentId, status: 'REJECTED' },
        sendEmail: true,
        sendPush: true,
        idempotencyKey: `document_rejected_${documentId}`
      });
    }

    return updatedDoc;
  }

  private async checkAndUpdateTechnicianVerification(technicianProfileId: string) {
    const profile = await this.prisma.technicianProfile.findUnique({
      where: { id: technicianProfileId },
      include: { documents: true },
    });

    if (!profile) return;

    const allApproved = profile.documents.length > 0 && profile.documents.every(doc => doc.status === VerificationDocumentStatus.APPROVED);

    if (allApproved) {
      await this.prisma.technicianProfile.update({
        where: { id: technicianProfileId },
        data: {
          isVerified: true,
          verificationStatus: VerificationStatus.APPROVED,
        },
      });

      await this.prisma.user.update({
        where: { id: profile.userId },
        data: { status: UserStatus.ACTIVE },
      });
    }
  }
}
