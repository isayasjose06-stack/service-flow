import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsIn, Matches } from 'class-validator';
import { UserRole } from '@serviceflow/shared';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(100)
  lastName: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, y un número o carácter especial',
  })
  password: string;

  @IsIn([UserRole.CLIENT, UserRole.TECHNICIAN], { message: 'El rol debe ser CLIENT o TECHNICIAN' })
  role: UserRole;
}
