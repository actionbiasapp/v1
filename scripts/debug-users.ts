#!/usr/bin/env node
// Debug script to check all users and their name fields

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUsers() {
  console.log('🔍 Debugging users...\n');

  try {
    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    });

    console.log(`Found ${allUsers.length} users:`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'NULL'}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Check for users with null names
    const usersWithNullNames = allUsers.filter(user => !user.name || user.name === '');
    console.log(`Users with null/empty names: ${usersWithNullNames.length}`);
    
    if (usersWithNullNames.length > 0) {
      console.log('Fixing users with null names...');
      
      for (const user of usersWithNullNames) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: 'User' }
        });
        console.log(`✅ Fixed user: ${user.email}`);
      }
    }

    // Check for users with specific email
    const testUser = allUsers.find(user => user.email === 'actionbiastest1@mh31.com');
    if (testUser) {
      console.log(`\nFound actionbiastest1@mh31.com:`);
      console.log(`   Name: ${testUser.name || 'NULL'}`);
      console.log(`   ID: ${testUser.id}`);
      
      if (!testUser.name) {
        console.log('Fixing this user...');
        await prisma.user.update({
          where: { id: testUser.id },
          data: { name: 'User' }
        });
        console.log('✅ Fixed actionbiastest1@mh31.com');
      }
    } else {
      console.log('\nUser actionbiastest1@mh31.com not found in database');
    }

  } catch (error) {
    console.error('❌ Error debugging users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers(); 