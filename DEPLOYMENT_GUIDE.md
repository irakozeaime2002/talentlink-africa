# URGENT: Fix Email Update Bug - Deployment Steps

## Problem
After changing email, professional profile data disappears because the system was using email as a foreign key instead of userId.

## Solution Applied
✅ Added `applicant_id` field to Candidate model (links to User._id)
✅ Added `import_id` field for CSV/PDF imports
✅ Updated all controllers to use applicant_id instead of email
✅ Created migration script to populate these fields

## CRITICAL: You Must Run Migration Script

**The code changes alone won't fix existing data!** You need to run the migration script to populate `applicant_id` for all existing candidates.

### Step 1: Backup Database (CRITICAL!)
```bash
# Replace <MONGODB_URI> with your actual connection string
mongodump --uri="<MONGODB_URI>" --out=backup_$(date +%Y%m%d_%H%M%S)
```

### Step 2: Run Migration Script
```bash
cd backend
node scripts/migrateApplicantIds.js
```

**Expected Output:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found X profile candidates to migrate

✅ Profile: John Doe (john@example.com) -> User ID: 507f1f77bcf86cd799439011
✅ Profile: Jane Smith (jane@example.com) -> User ID: 507f1f77bcf86cd799439012
...

📊 Found Y imported candidates to migrate

✅ Import: Candidate 1 -> import_id: csv-507f1f77bcf86cd799439011-1234567890-0
✅ Import: Candidate 2 -> import_id: resume-507f1f77bcf86cd799439011-1234567890-1
...

📈 Migration Summary:
   Profile Candidates:
     ✅ Updated: X
     ⚠️  Not found: 0
     📊 Total: X
   Imported Candidates:
     ✅ Updated: Y
     📊 Total: Y
   Grand Total: X+Y

✅ Migration complete!
```

### Step 3: Restart Backend
```bash
# If using pm2
pm2 restart backend

# If using npm
npm run dev
# or
npm run start
```

### Step 4: Test
1. Login as applicant
2. Go to Profile → Professional tab
3. Verify all data is visible
4. Update email in Personal Info tab
5. Go back to Professional tab
6. **Data should still be there!** ✅

## If Migration Fails

### Common Issues:

**Issue 1: "Cannot find module 'mongoose'"**
```bash
cd backend
npm install
```

**Issue 2: "MONGODB_URI not found"**
```bash
# Make sure .env file exists in backend folder
cd backend
cat .env | grep MONGODB_URI
```

**Issue 3: "No candidates found"**
This is normal if you have no data yet. The migration will show:
```
📊 Found 0 profile candidates to migrate
📊 Found 0 imported candidates to migrate
```

## Rollback (If Something Goes Wrong)

```bash
# Restore from backup
mongorestore --uri="<MONGODB_URI>" backup_YYYYMMDD_HHMMSS

# Revert code changes
git revert HEAD
git push
```

## Verification Checklist

After migration, verify:

- [ ] Existing applicants can see their professional profile
- [ ] Updating email doesn't lose profile data
- [ ] New applicants can create profiles
- [ ] CSV imports work correctly
- [ ] PDF resume uploads work correctly
- [ ] AI screening works with both job board applicants and imports
- [ ] Screening results display correctly

## Why This Happened

**Before:**
```typescript
// ❌ BAD: Using email as foreign key
const candidate = await Candidate.findOne({ email: user.email });
```

**After:**
```typescript
// ✅ GOOD: Using immutable userId
const candidate = await Candidate.findOne({ applicant_id: user._id });
```

Email is mutable (users can change it), so it should never be used as a foreign key. MongoDB ObjectIds are immutable and perfect for this.

## Need Help?

If you encounter any issues:
1. Check the migration script output for errors
2. Verify MongoDB connection string is correct
3. Ensure you have backup before proceeding
4. Check backend logs for detailed error messages

## Files Changed

- `backend/src/models/Candidate.ts` - Added applicant_id and import_id fields
- `backend/src/controllers/applicationController.ts` - 8 functions updated
- `backend/src/controllers/candidateController.ts` - 2 functions updated
- `backend/src/controllers/screeningController.ts` - 1 function updated
- `backend/scripts/migrateApplicantIds.js` - NEW migration script
