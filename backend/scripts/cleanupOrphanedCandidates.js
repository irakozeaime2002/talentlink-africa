/**
 * Cleanup Script: Delete Orphaned Candidates
 * 
 * This script deletes candidate records that don't have a matching user account.
 * These are typically seed/test data that were created for testing but don't
 * belong to any real user.
 * 
 * Run with: node scripts/cleanupOrphanedCandidates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      name: String,
    }));

    const Candidate = mongoose.model('Candidate', new mongoose.Schema({
      name: String,
      email: String,
      source: String,
      applicant_id: mongoose.Schema.Types.ObjectId,
      recruiter_id: mongoose.Schema.Types.ObjectId,
    }));

    // Find all profile candidates (job board applicants)
    const profileCandidates = await Candidate.find({ source: 'profile' });
    
    console.log(`📊 Found ${profileCandidates.length} profile candidates\n`);

    const toDelete = [];
    const toKeep = [];

    for (const candidate of profileCandidates) {
      // Skip if already has applicant_id (already migrated and linked)
      if (candidate.applicant_id) {
        toKeep.push(candidate);
        continue;
      }

      // Skip if no email (can't check for user)
      if (!candidate.email || candidate.email.trim() === '') {
        console.log(`⚠️  ${candidate.name} - No email, will DELETE`);
        toDelete.push(candidate);
        continue;
      }

      // Check if user exists
      const user = await User.findOne({ email: candidate.email });
      
      if (user) {
        console.log(`✅ ${candidate.name} (${candidate.email}) - User exists, will KEEP`);
        toKeep.push(candidate);
      } else {
        console.log(`🗑️  ${candidate.name} (${candidate.email}) - No user found, will DELETE`);
        toDelete.push(candidate);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Candidates to keep: ${toKeep.length}`);
    console.log(`   🗑️  Candidates to delete: ${toDelete.length}`);

    if (toDelete.length === 0) {
      console.log('\n✨ No orphaned candidates found. Database is clean!');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('\n⚠️  WARNING: The following candidates will be PERMANENTLY DELETED:');
    toDelete.forEach(c => {
      console.log(`   - ${c.name} (${c.email || 'no email'}) - ID: ${c._id}`);
    });

    console.log('\n❓ Do you want to proceed with deletion?');
    console.log('   To confirm, run: node scripts/cleanupOrphanedCandidates.js --confirm');
    
    // Check if --confirm flag is present
    const confirmed = process.argv.includes('--confirm');
    
    if (!confirmed) {
      console.log('\n⏸️  Deletion cancelled. No changes made.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Proceed with deletion
    console.log('\n🗑️  Deleting orphaned candidates...');
    
    let deleted = 0;
    for (const candidate of toDelete) {
      await Candidate.findByIdAndDelete(candidate._id);
      deleted++;
      console.log(`   ✅ Deleted: ${candidate.name} (${candidate.email || 'no email'})`);
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deleted} candidates`);
    console.log(`   Remaining: ${toKeep.length} candidates`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
