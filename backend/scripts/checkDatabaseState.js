/**
 * Test Script: Check Database State
 * 
 * This script checks your current database state to see what needs to be migrated.
 * Run this BEFORE running the migration to understand what will happen.
 * 
 * Run with: node scripts/checkDatabaseState.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function checkState() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
    }));

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({
      name: String,
      email: String,
      applicant_id: mongoose.Schema.Types.ObjectId,
      import_id: String,
      source: String,
      recruiter_id: mongoose.Schema.Types.ObjectId,
    }));

    // Check Users
    console.log('👥 USERS:');
    const users = await User.find({});
    console.log(`   Total users: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - Role: ${u.role} - ID: ${u._id}`);
    });

    // Check Candidates
    console.log('\n📋 CANDIDATES:');
    const candidates = await Candidate.find({});
    console.log(`   Total candidates: ${candidates.length}`);
    
    const profileCandidates = candidates.filter(c => c.source === 'profile');
    const csvCandidates = candidates.filter(c => c.source === 'csv');
    const resumeCandidates = candidates.filter(c => c.source === 'resume');
    
    console.log(`   - Profile candidates (job board applicants): ${profileCandidates.length}`);
    console.log(`   - CSV imports: ${csvCandidates.length}`);
    console.log(`   - Resume imports: ${resumeCandidates.length}`);

    // Check which candidates need migration
    console.log('\n🔍 MIGRATION NEEDED:');
    
    const profileNeedingMigration = profileCandidates.filter(c => !c.applicant_id && c.email);
    const profileWithoutEmail = profileCandidates.filter(c => !c.email);
    const importsNeedingMigration = [...csvCandidates, ...resumeCandidates].filter(c => !c.import_id);
    
    console.log(`   - Profile candidates without applicant_id: ${profileNeedingMigration.length}`);
    if (profileWithoutEmail.length > 0) {
      console.log(`   - Profile candidates without email (will be skipped): ${profileWithoutEmail.length}`);
    }
    if (profileNeedingMigration.length > 0) {
      console.log('     These candidates will be linked to users by email:');
      let successCount = 0;
      let failCount = 0;
      
      for (const c of profileNeedingMigration.slice(0, 10)) {
        const user = await User.findOne({ email: c.email });
        if (user) {
          console.log(`     ✅ ${c.name} (${c.email}) -> User found: ${user._id}`);
          successCount++;
        } else {
          console.log(`     ⚠️  ${c.name} (${c.email}) -> No user found (seed data?)`);
          failCount++;
        }
      }
      if (profileNeedingMigration.length > 10) {
        console.log(`     ... and ${profileNeedingMigration.length - 10} more`);
      }
      console.log(`\n     Expected results: ${successCount} will be migrated, ${failCount} will be skipped`);
    }
    
    console.log(`\n   - Imported candidates without import_id: ${importsNeedingMigration.length}`);
    if (importsNeedingMigration.length > 0) {
      console.log('     These candidates will get unique import_id generated:');
      importsNeedingMigration.slice(0, 5).forEach(c => {
        console.log(`     📝 ${c.name} (source: ${c.source})`);
      });
      if (importsNeedingMigration.length > 5) {
        console.log(`     ... and ${importsNeedingMigration.length - 5} more`);
      }
    }

    // Check candidates that already have the new fields
    const alreadyMigrated = candidates.filter(c => 
      (c.source === 'profile' && c.applicant_id) || 
      (['csv', 'resume'].includes(c.source) && c.import_id)
    );
    
    console.log(`\n✅ Already migrated: ${alreadyMigrated.length} candidates`);

    console.log('\n📊 SUMMARY:');
    console.log(`   Total candidates: ${candidates.length}`);
    console.log(`   Need migration: ${profileNeedingMigration.length + importsNeedingMigration.length}`);
    console.log(`   Already migrated: ${alreadyMigrated.length}`);
    
    if (profileNeedingMigration.length + importsNeedingMigration.length === 0) {
      console.log('\n🎉 All candidates are already migrated! No action needed.');
    } else {
      console.log('\n⚠️  Migration needed! Run: node scripts/migrateApplicantIds.js');
    }

    await mongoose.disconnect();
    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkState();
