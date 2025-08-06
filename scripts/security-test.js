#!/usr/bin/env node
// Quick Security Test - 80/20 MVP approach
// Checks for common security issues

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

console.log('🔒 Running Security Tests...\n');

// Test 1: Check for hardcoded API keys
function checkForHardcodedSecrets() {
  console.log('1. Checking for hardcoded secrets...');
  
  const filesToCheck = [
    'app/lib/auth.ts',
    'app/lib/config.ts',
    'app/lib/constants.ts'
  ];
  
  const secretPatterns = [
    /re_[a-zA-Z0-9_-]{40,}/g,  // Resend API keys
    /sk-[a-zA-Z0-9_-]{40,}/g,  // OpenAI API keys
    /your-super-secret-key/g,   // Placeholder secrets
    /localhost:3001/g           // Hardcoded URLs
  ];
  
  let issuesFound = 0;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      secretPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`   ❌ Found in ${file}: ${matches[0]}`);
          issuesFound++;
        }
      });
    }
  });
  
  if (issuesFound === 0) {
    console.log('   ✅ No hardcoded secrets found');
  }
  
  return issuesFound;
}

// Test 2: Check environment variables
function checkEnvironmentVariables() {
  console.log('\n2. Checking environment variables...');
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL', 
    'RESEND_API_KEY',
    'DATABASE_URL'
  ];
  
  let missingVars = 0;
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`   ❌ Missing: ${varName}`);
      missingVars++;
    } else if (varName === 'NEXTAUTH_SECRET' && process.env[varName].includes('your-super-secret')) {
      console.log(`   ❌ ${varName} still has placeholder value`);
      missingVars++;
    } else {
      console.log(`   ✅ ${varName} is set`);
    }
  });
  
  return missingVars;
}

// Test 3: Check .gitignore
function checkGitignore() {
  console.log('\n3. Checking .gitignore...');
  
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredEntries = ['.env', '.env.local', '.env.production'];
  
  let missingEntries = 0;
  
  requiredEntries.forEach(entry => {
    if (!gitignore.includes(entry)) {
      console.log(`   ❌ Missing from .gitignore: ${entry}`);
      missingEntries++;
    } else {
      console.log(`   ✅ .gitignore includes ${entry}`);
    }
  });
  
  return missingEntries;
}

// Run all tests
const secretIssues = checkForHardcodedSecrets();
const envIssues = checkEnvironmentVariables();
const gitignoreIssues = checkGitignore();

console.log('\n📊 Security Test Results:');
console.log(`   Hardcoded secrets: ${secretIssues} issues`);
console.log(`   Environment variables: ${envIssues} issues`);
console.log(`   .gitignore: ${gitignoreIssues} issues`);

const totalIssues = secretIssues + envIssues + gitignoreIssues;

if (totalIssues === 0) {
  console.log('\n🎉 All security tests passed!');
} else {
  console.log(`\n⚠️  Found ${totalIssues} security issues to fix`);
} 