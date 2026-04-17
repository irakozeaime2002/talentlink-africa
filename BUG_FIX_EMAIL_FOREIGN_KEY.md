# Bug Fix: Email-Based Foreign Key Issue

## Problem

When users updated their email address in the User model, all their associated data (candidate profiles, applications, screening results) would disappear. Changing the email back would restore the data.

**Root Cause:** The system was using `email` as a foreign key to link Candidate records to User records, instead of using immutable identifiers (`userId` for applicants, unique `import_id` for CSV/PDF imports).

## Impact

- **Data Loss:** Updating email caused apparent data loss (data still existed but couldn't be queried)
- **Data Integrity:** Email is mutable and should never be used as a foreign key
- **Security:** Email-based lookups are less secure than ObjectId-based lookups
- **Import Tracking:** CSV/PDF imports had no permanent unique identifier

## Solution

### Overview

We implemented a dual-identifier system:
1. **`applicant_id`** (ObjectId) - Links profile-source candidates to User accounts (job board applicants)
2. **`import_id`** (String) - Unique identifier for CSV/PDF imports (candidates without user accounts)

This ensures every candidate has a permanent, immutable identifier regardless of how they were added to the system.

### 1. Model Changes

**File:** `backend/src/models/Candidate.ts`

Added two fields to link Candidate records properly:

```typescript
export interface ICandidate extends Document {
  // ... existing fields
  applicant_id?: Schema.Types.ObjectId;  // NEW: Link to User._id for job board applicants
  import_id?: string;                     // NEW: Unique ID for CSV/PDF imports
}

const CandidateSchema = new Schema<ICandidate>({
  // ... existing fields
  applicant_id: { type: Schema.Types.ObjectId, ref: "User" },  // NEW
  import_id: { type: String, unique: true, sparse: true },      // NEW: sparse allows null values
});
```

### 2. Controller Changes

#### A. Application Controller

**File:** `backend/src/controllers/applicationController.ts`

Replaced all email-based Candidate lookups with applicant_id-based lookups:

**Before:**
```typescript
const candidate = await Candidate.findOne({ email: user.email });
```

**After:**
```typescript
const applicant_id = (req as any).user.id;
const candidate = await Candidate.findOne({ applicant_id });
```

**Functions Updated:**
- `uploadMyCV()` - Line 15
- `getMyProfile()` - Line 25
- `updateMyProfile()` - Line 36
- `applyToJob()` - Line 95
- `getJobApplicantCandidates()` - Line 141
- `updateMyApplication()` - Line 210
- `getMyJobsCandidates()` - Line 242
- `getApplicantProfile()` - Line 268

#### B. Candidate Controller

**File:** `backend/src/controllers/candidateController.ts`

Generate unique `import_id` for CSV and PDF uploads:

**Before:**
```typescript
const candidates = await Candidate.insertMany(
  parsed.map((c) => ({ ...c, source: "csv", recruiter_id: recruiterId(req) }))
);
```

**After:**
```typescript
const recId = recruiterId(req);
const timestamp = Date.now();

const candidates = await Candidate.insertMany(
  parsed.map((c, index) => ({
    ...c,
    source: "csv",
    recruiter_id: recId,
    import_id: `csv-${recId}-${timestamp}-${index}`, // Unique permanent ID
    ...(job_id ? { job_id } : {})
  }))
);
```

**Format:** `{source}-{recruiterId}-{timestamp}-{index}`
- Ensures uniqueness across all imports
- Persists even if candidate data is updated
- Allows tracking of import batches

#### C. Screening Controller

**File:** `backend/src/controllers/screeningController.ts`

Updated AI screening to match candidates with applications using applicant_id instead of email:

**Before:**
```typescript
const emailToAppData: Record<string, AppData> = {};
for (const app of applications) {
  const user = await User.findById(app.applicant_id).select("email");
  if (!user?.email) continue;
  emailToAppData[user.email] = { ... };
}
const appData = c.email ? emailToAppData[c.email] : undefined;
```

**After:**
```typescript
const applicantIdToAppData: Record<string, AppData> = {};
for (const app of applications) {
  const applicantId = app.applicant_id.toString();
  applicantIdToAppData[applicantId] = { ... };
}
const appData = c.applicant_id ? applicantIdToAppData[c.applicant_id.toString()] : undefined;
```

### 3. Migration Script

**File:** `backend/scripts/migrateApplicantIds.js`

Created migration script to populate both `applicant_id` and `import_id` for existing Candidate records:

**Part 1: Profile Candidates (Job Board Applicants)**
```javascript
const profileCandidates = await Candidate.find({
  source: 'profile',
  email: { $exists: true, $ne: null },
  applicant_id: { $exists: false },
});

for (const candidate of profileCandidates) {
  const user = await User.findOne({ email: candidate.email });
  if (user) {
    candidate.applicant_id = user._id;
    await candidate.save();
  }
}
```

**Part 2: Imported Candidates (CSV/PDF)**
```javascript
const importedCandidates = await Candidate.find({
  source: { $in: ['csv', 'resume'] },
  import_id: { $exists: false },
});

for (const candidate of importedCandidates) {
  const timestamp = candidate.createdAt.getTime();
  const recruiterId = candidate.recruiter_id;
  const mongoId = candidate._id.toString().slice(-6);
  
  candidate.import_id = `${candidate.source}-${recruiterId}-${timestamp}-${mongoId}`;
  await candidate.save();
}
```

This script:
1. **Profile candidates:** Finds User by email and sets applicant_id
2. **Imported candidates:** Generates unique import_id using source, recruiter, timestamp, and MongoDB ID
3. Reports success/failure for each record with detailed summary

## Testing

### Test Case 1: Update Email (Job Board Applicant)
1. Login as applicant
2. View profile (should show data)
3. Update email address
4. View profile again (should still show data) ✅

### Test Case 2: Apply to Job
1. Apply to a job as applicant
2. Update email
3. View "My Applications" (should still show application) ✅

### Test Case 3: AI Screening (Job Board Applicants)
1. Recruiter screens applicants
2. Applicant updates email
3. Recruiter views screening results (should still show candidate) ✅

### Test Case 4: CSV Import
1. Import candidates via CSV
2. View candidates page (should show all imported candidates) ✅
3. Update candidate email in database manually
4. View candidates page (should still show candidates with same import_id) ✅

### Test Case 5: AI Screening with Mixed Sources
1. Screen both job board applicants and CSV imports together
2. Update emails for some candidates
3. View screening results (should show all candidates correctly) ✅

## Candidate Identification Logic

### Profile-Source Candidates (Job Board Applicants)
- **Primary Key:** `applicant_id` (links to User._id)
- **When Created:** User applies to job via /board
- **Lookup Method:** `Candidate.findOne({ applicant_id })`
- **Email Updates:** Safe - uses immutable ObjectId

### CSV-Source Candidates (Bulk Imports)
- **Primary Key:** `import_id` (format: `csv-{recruiterId}-{timestamp}-{index}`)
- **When Created:** Recruiter uploads CSV file
- **Lookup Method:** `Candidate.findOne({ import_id })` or `Candidate.findById(_id)`
- **Email Updates:** Safe - uses unique import_id

### Resume-Source Candidates (PDF Uploads)
- **Primary Key:** `import_id` (format: `resume-{recruiterId}-{timestamp}-{index}`)
- **When Created:** Recruiter uploads PDF resumes
- **Lookup Method:** `Candidate.findOne({ import_id })` or `Candidate.findById(_id)`
- **Email Updates:** Safe - uses unique import_id

## Database Indexes

Recommended indexes for optimal performance:

```javascript
// Candidate model indexes
CandidateSchema.index({ applicant_id: 1 });           // Fast lookup for job board applicants
CandidateSchema.index({ import_id: 1 }, { unique: true, sparse: true }); // Fast lookup for imports
CandidateSchema.index({ recruiter_id: 1, source: 1 }); // Fast filtering by recruiter and source
CandidateSchema.index({ email: 1 });                   // Keep for display/search purposes
```

## Deployment Steps

1. **Backup Database** (critical!)
   ```bash
   mongodump --uri="<MONGODB_URI>" --out=backup_before_migration
   ```

2. **Deploy Code Changes**
   ```bash
   cd backend
   git pull
   npm install
   npm run build
   ```

3. **Run Migration Script**
   ```bash
   node scripts/migrateApplicantIds.js
   ```

4. **Verify Migration**
   - Check migration output for errors
   - Test email update functionality
   - Verify existing data is still accessible
   - Test CSV/PDF imports

5. **Restart Backend**
   ```bash
   pm2 restart backend
   # or
   npm run start
   ```

## Rollback Plan

If issues occur:

1. **Restore Database**
   ```bash
   mongorestore --uri="<MONGODB_URI>" backup_before_migration
   ```

2. **Revert Code**
   ```bash
   git revert <commit-hash>
   git push
   ```

## Future Improvements

1. **Add Indexes:** Create indexes on `applicant_id` and `import_id` for faster lookups
   ```typescript
   CandidateSchema.index({ applicant_id: 1 });
   CandidateSchema.index({ import_id: 1 }, { unique: true, sparse: true });
   ```

2. **Deprecate Email Lookups:** Remove any remaining email-based queries

3. **Add Validation:** Ensure either applicant_id or import_id is always set based on source
   ```typescript
   CandidateSchema.pre('save', function(next) {
     if (this.source === 'profile' && !this.applicant_id) {
       return next(new Error('Profile candidates must have applicant_id'));
     }
     if (['csv', 'resume'].includes(this.source) && !this.import_id) {
       return next(new Error('Imported candidates must have import_id'));
     }
     next();
   });
   ```

4. **Batch Import Tracking:** Add `import_batch_id` to group candidates from same upload

5. **Import History:** Track import metadata (filename, date, row count, errors)

## Notes

- **Email field preserved:** Kept in Candidate model for display purposes and backward compatibility
- **Dual identifier system:** Profile candidates use `applicant_id`, imports use `import_id`
- **MongoDB _id still works:** All candidates can still be queried by their MongoDB _id
- **Sparse index on import_id:** Allows null values for profile-source candidates
- **Unique import_id format:** Combines source, recruiter, timestamp, and index for guaranteed uniqueness
- **No breaking changes:** Existing queries by _id continue to work
