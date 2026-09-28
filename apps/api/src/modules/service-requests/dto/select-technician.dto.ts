import { IsUUID, IsNotEmpty } from 'class-validator';

export class SelectTechnicianDto {
  @IsNotEmpty({ message: 'El ID del técnico es obligatorio' })
  @IsUUID(4, { message: 'ID del técnico inválido' })
  technicianId: string;
}
