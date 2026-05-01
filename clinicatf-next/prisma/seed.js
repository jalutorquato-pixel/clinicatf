const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Criar Usuário Admin
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        hashed_password: hashedPassword,
      },
    });
    console.log('Usuário admin criado (admin / admin123)');
  }

  // Configurações
  const settings = {
    clinic_name: 'Clínica TF',
    clinic_cnpj: '00.000.000/0001-00',
    default_credit_after_20: '50',
    program_rules: 'Cada indicação validada vale 1 ponto. Benefícios são preservados ao fim do ciclo.',
    professionals: 'Dra. Fernanda; Dra. Marina',
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log('Configurações criadas');

  // Benefícios
  const benefits = [
    { points: 3, name: 'Limpeza de pele' },
    { points: 5, name: 'Peeling' },
    { points: 7, name: 'Microagulhamento' },
    { points: 8, name: 'Skinbooster' },
    { points: 10, name: 'Botox 1 região' },
    { points: 12, name: 'Lipo enzimática papada ou abdômen' },
    { points: 14, name: 'Botox 2 regiões' },
    { points: 16, name: 'Preenchimento labial ou preenchimento de bigode chinês' },
    { points: 18, name: 'Bioestimulador de colágeno, preenchimento ou combo botox + skinbooster' },
    { points: 20, name: 'Harmonização facial' },
  ];

  for (const b of benefits) {
    const exists = await prisma.benefit.findFirst({
      where: { required_points: b.points, name: b.name },
    });
    if (!exists) {
      await prisma.benefit.create({
        data: {
          required_points: b.points,
          name: b.name,
          description: b.name,
          type: 'procedimento',
        },
      });
    }
  }
  console.log('Benefícios criados');

  // Procedimentos
  const procedures = [
    { name: 'Limpeza de pele', category: 'Facial', price: 180 },
    { name: 'Peeling químico', category: 'Facial', price: 320 },
    { name: 'Microagulhamento', category: 'Facial', price: 550 },
    { name: 'Skinbooster', category: 'Injetáveis', price: 900 },
    { name: 'Botox', category: 'Injetáveis', price: 750 },
    { name: 'Preenchimento labial', category: 'Injetáveis', price: 1200 },
  ];

  for (const p of procedures) {
    const exists = await prisma.procedure.findUnique({
      where: { name: p.name },
    });
    if (!exists) {
      await prisma.procedure.create({
        data: {
          name: p.name,
          category: p.category,
          description: `Procedimento de ${p.category.toLowerCase()}`,
          default_price: p.price,
        },
      });
    }
  }
  console.log('Procedimentos criados');

  // Ciclo Atual
  const activeCycle = await prisma.cycle.findFirst({
    where: { status: 'ativo' },
  });

  if (!activeCycle) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 90);

    await prisma.cycle.create({
      data: {
        name: 'Ciclo Atual',
        start_date: today,
        end_date: endDate,
        status: 'ativo',
        notes: 'Ciclo inicial de demonstração',
      },
    });
    console.log('Ciclo criado');
  }

  // Cliente Demo
  let demoClient = await prisma.client.findFirst({
    where: { email: 'ana@example.com' },
  });

  if (!demoClient) {
    demoClient = await prisma.client.create({
      data: {
        full_name: 'Ana Ribeiro',
        phone: '11999990000',
        email: 'ana@example.com',
        cpf: '12345678900',
        origin: 'Cliente antiga',
        notes: 'Cliente demo',
      },
    });
    console.log('Cliente demo criado');
  }

  // Embaixadora Demo
  const ambassadorExists = await prisma.ambassador.findUnique({
    where: { client_id: demoClient.id },
  });

  if (!ambassadorExists) {
    const coupon = 'ANARIBEIRO';
    await prisma.ambassador.create({
      data: {
        client_id: demoClient.id,
        public_name: 'Ana R.',
        coupon: coupon,
        exclusive_link: `https://wa.me/5511900000000?text=Olá,%20tenho%20o%20cupom%20${coupon}`,
        status: 'ativa',
        level: 'comum',
      },
    });
    console.log('Embaixadora demo criada');
  }

  console.log('Seed completo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
