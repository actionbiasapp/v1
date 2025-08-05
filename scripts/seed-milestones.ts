import { PrismaClient } from '@prisma/client';
import { APP_CONFIG } from '../app/lib/config';

const prisma = new PrismaClient();

async function main() {
  const userId = 'default-user';

  // Check if user exists, if not create one
  let user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        email: 'default@example.com',
        name: 'Default User'
      }
    });
  }

  // Check if milestones already exist
  const existingMilestones = await prisma.fIMilestone.findMany({
    where: { userId: userId }
  });

  if (existingMilestones.length > 0) {
    console.log('Milestones already exist, skipping...');
    return;
  }

  // Create default milestones
  const defaultMilestones = [
    {
      name: 'My First Million',
      amount: APP_CONFIG.FINANCIAL.FI_TARGETS.FIRST_MILLION,
      description: 'Reach your first million dollars',
      order: 1
    },
    {
      name: 'Lean FI',
      amount: APP_CONFIG.FINANCIAL.FI_TARGETS.LEAN_FI,
      description: 'Achieve lean financial independence',
      order: 2
    },
    {
      name: 'Full FI',
      amount: APP_CONFIG.FINANCIAL.FI_TARGETS.FULL_FI,
      description: 'Achieve full financial independence',
      order: 3
    }
  ];

  for (const milestone of defaultMilestones) {
    await prisma.fIMilestone.create({
      data: {
        userId: userId,
        name: milestone.name,
        amount: milestone.amount,
        description: milestone.description,
        order: milestone.order
      }
    });
  }

  console.log('Default FI milestones created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 