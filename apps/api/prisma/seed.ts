import { PrismaClient, UserRole, UserStatus, VerificationDocumentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@serviceflow.com' },
    update: {},
    create: {
      email: 'admin@serviceflow.com',
      passwordHash: '$2b$12$N9X.V1K9Gv.H7I.G6q.z.O.O.O.O.O.O.O.O.O.O.O', // Dummy hash
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // 2. Create Platform Configuration
  const configs = [
    { key: 'request_expiry_hours', value: '24', description: 'Horas hasta expiración de solicitud' },
    { key: 'match_response_hours', value: '2', description: 'Horas para que técnico responda un match' },
    { key: 'max_technicians_per_request', value: '20', description: 'Máximo de técnicos notificados por solicitud' },
    { key: 'verification_required', value: 'true', description: 'Verificación obligatoria para recibir solicitudes' },
    { key: 'max_request_images', value: '5', description: 'Máximo de fotos por solicitud' },
    { key: 'max_service_images_per_phase', value: '5', description: 'Máximo de fotos por fase de servicio' },
  ];

  for (const conf of configs) {
    await prisma.platformConfig.upsert({
      where: { key: conf.key },
      update: {},
      create: { ...conf, updatedById: admin.id },
    });
  }
  console.log(`✅ Platform configurations created (${configs.length})`);

  // 3. Create Categories and Subcategories
  const categoriesData = [
    {
      name: 'Electricidad',
      slug: 'electricidad',
      icon: 'zap',
      description: 'Instalaciones y reparaciones eléctricas',
      subcategories: ['Instalación', 'Reparación', 'Cableado', 'Iluminación'],
      requirements: [VerificationDocumentType.ID_DOCUMENT, VerificationDocumentType.CERTIFICATION],
    },
    {
      name: 'Plomería',
      slug: 'plomeria',
      icon: 'droplet',
      description: 'Servicios de agua, tuberías y sanitarios',
      subcategories: ['Fugas', 'Destapes', 'Instalación', 'Calentadores'],
      requirements: [VerificationDocumentType.ID_DOCUMENT],
    },
    {
      name: 'Limpieza',
      slug: 'limpieza',
      icon: 'sparkles',
      description: 'Limpieza profunda, general y especializada',
      subcategories: ['General', 'Profunda', 'Muebles', 'Post-construcción'],
      requirements: [VerificationDocumentType.ID_DOCUMENT, VerificationDocumentType.BACKGROUND_CHECK],
    },
  ];

  for (const cat of categoriesData) {
    // Create or update Category
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
      },
    });

    // Create Subcategories
    for (const subName of cat.subcategories) {
      const subSlug = `${cat.slug}-${subName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      await prisma.subcategory.upsert({
        where: { slug: subSlug },
        update: {},
        create: {
          categoryId: category.id,
          name: subName,
          slug: subSlug,
        },
      });
    }

    // Create Verification Requirements
    for (const docType of cat.requirements) {
      // Because we use a composite unique constraint, upsert works well if we have a unique ID, 
      // but Prisma upsert requires a unique criteria matching the exact unique constraint.
      // Easiest is to try create and ignore duplicate.
      const existing = await prisma.categoryVerificationRequirement.findFirst({
        where: { categoryId: category.id, documentType: docType },
      });

      if (!existing) {
        await prisma.categoryVerificationRequirement.create({
          data: {
            categoryId: category.id,
            documentType: docType,
            isRequired: true,
          },
        });
      }
    }
    
    console.log(`✅ Category created: ${cat.name} with ${cat.subcategories.length} subcategories`);
  }

  console.log('🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
