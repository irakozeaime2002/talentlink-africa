/**
 * Migration Script: Add applicant_id and import_id to Candidate records
 * 
 * This script migrates existing Candidate records from email-based lookups
 * to userId-based lookups by:
 * 1. Adding applicant_id field for profile-source candidates (job board applicants)
 * 2. Adding import_id field for csv/resume-source candidates (bulk imports)
 * 
 * Run with: node scripts/migrateApplicantIds.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String,
    }));

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({
      email: String,
      applicant_id: mongoose.Schema.Types.ObjectId,
      import_id: String,
      source: String,
      recruiter_id: mongoose.Schema.Types.ObjectId,
      createdAt: Date,
    }));

    // PART 1: Migrate profile-source candidates (job board applicants)
    // Find all profile candidates with email but no applicant_id
    const profileCandidates = await Candidate.find({
      source: 'profile',
      email: { $exists: true, $ne: null, $ne: '' },
      applicant_id: { $exists: false },
    });

    console.log(`📊 Found ${profileCandidates.length} profile candidates to migrate\n`);

    let profileUpdated = 0;
    let profileNotFound = 0;
    let profileSkipped = 0;

    for (const candidate of profileCandidates) {
      if (!candidate.email || candidate.email.trim() === '') {
        profileSkipped++;
        console.log(`⏭️  Profile: ${candidate.name} - Skipped (no email)`);
        continue;
      }

      // Find the user with matching email
      const user = await User.findOne({ email: candidate.email });

      if (user) {
        candidate.applicant_id = user._id;
        await candidate.save();
        profileUpdated++;
        console.log(`✅ Profile: ${candidate.name} (${candidate.email}) -> User ID: ${user._id}`);
      } else {
        profileNotFound++;
        console.log(`⚠️  Profile: No user found for ${candidate.name} (${candidate.email})`);
      }
    }

    // PART 2: Migrate csv/resume-source candidates (bulk imports)
    // Find all imported candidates without import_id
    const importedCandidates = await Candidate.find({
      source: { $in: ['csv', 'resume'] },
      import_id: { $exists: false },
    });

    console.log(`\n📊 Found ${importedCandidates.length} imported candidates to migrate\n`);

    let importUpdated = 0;

    for (const candidate of importedCandidates) {
      // Generate unique import_id based on source, recruiter, timestamp, and MongoDB _id
      const timestamp = candidate.createdAt ? candidate.createdAt.getTime() : Date.now();
      const recruiterId = candidate.recruiter_id || 'unknown';
      const mongoId = candidate._id.toString().slice(-6); // Last 6 chars of MongoDB ID for uniqueness
      
      candidate.import_id = `${candidate.source}-${recruiterId}-${timestamp}-${mongoId}`;
      await candidate.save();
      importUpdated++;
      console.log(`✅ Import: ${candidate.name} -> import_id: ${candidate.import_id}`);
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   Profile Candidates:`);
    console.log(`     ✅ Updated: ${profileUpdated}`);
    console.log(`     ⚠️  Not found: ${profileNotFound}`);
    console.log(`     ⏭️  Skipped (no email): ${profileSkipped}`);
    console.log(`     📊 Total: ${profileCandidates.length}`);
    console.log(`   Imported Candidates:`);
    console.log(`     ✅ Updated: ${importUpdated}`);
    console.log(`     📊 Total: ${importedCandidates.length}`);
    console.log(`   Grand Total: ${profileCandidates.length + importedCandidates.length}`);

    if (profileNotFound > 0) {
      console.log(`\n⚠️  WARNING: ${profileNotFound} candidates have no matching user account.`);
      console.log(`   These are likely seed/test data. They will remain in the database but won't be linked to any user.`);
      console.log(`   You can safely delete them if they're not needed.`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Migration complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify data integrity in your database');
    console.log('   2. Test email updates for applicants');
    console.log('   3. Test CSV/PDF imports');
    console.log('   4. Test AI screening with both types of candidates');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
