#!/usr/bin/env node
// Fix existing users script
// Updates null names and sets correct allocation targets

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingUsers() {
  console.log('🔧 Fixing existing users...');

  try {
    // Get all users
    const allUsers = await prisma.user.findMany();
    
    // 1. Fix users with null names
    const usersWithNullNames = allUsers.filter(user => !user.name || user.name === '');

    console.log(`Found ${usersWithNullNames.length} users with null/empty names`);

    for (const user of usersWithNullNames) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: 'User' }
      });
      console.log(`✅ Fixed user: ${user.email}`);
    }

    // 2. Update allocation targets for all users to 25/25/25/25
    for (const user of allUsers) {
      // Update user's allocation targets directly
      await prisma.user.update({
        where: { id: user.id },
        data: {
          coreTarget: 25,
          growthTarget: 25,
          hedgeTarget: 25,
          liquidityTarget: 25,
          rebalanceThreshold: 5
        }
      });

      // Update asset categories to 25/25/25/25
      await prisma.assetCategory.updateMany({
        where: { userId: user.id },
        data: {
          targetPercentage: 25
        }
      });

      console.log(`✅ Updated allocation targets for: ${user.email}`);
    }

    console.log('🎉 All existing users fixed!');
    console.log('- Null names: Fixed');
    console.log('- Allocation targets: Updated to 25/25/25/25');
    console.log('- Asset categories: Updated to 25% each');

  } catch (error) {
    console.error('❌ Error fixing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUsers(); 