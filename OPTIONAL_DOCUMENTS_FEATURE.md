# Optional Documents Feature

## Summary
Added the ability for recruiters to mark documents as optional when posting jobs. Applicants will see which documents are required vs optional when applying.

## Changes Made

### 1. Backend - Job Model (`backend/src/models/Job.ts`)
- Changed `required_documents` from `string[]` to `{ name: string; optional: boolean }[]`
- Documents now store both the name and whether they're optional

### 2. Frontend - Job Form (`frontend/components/jobs/JobForm.tsx`)
- Added checkbox next to each document to mark it as optional
- Documents are now stored as objects with `name` and `optional` properties
- Backward compatible with old string format

### 3. Frontend - Job Detail Page (`frontend/app/board/[id]/page.tsx`)
- Updated to display "(optional)" label next to optional documents
- Handles both old string format and new object format

### 4. Frontend - Application Form (`frontend/app/board/[id]/apply/page.tsx`)
- Only validates required documents (skips optional ones)
- Shows "(optional)" label next to optional document upload fields
- Handles both old string format and new object format

### 5. TypeScript Types (`frontend/types/index.ts`)
- Updated `Job` interface to support both formats: `{ name: string; optional: boolean }[] | string[]`
- Ensures backward compatibility with existing jobs

## Usage

### For Recruiters
1. When creating/editing a job, add documents in the "Required Documents" section
2. Check the "Optional" checkbox next to any document that is not mandatory
3. Unchecked documents will be required for applicants

### For Applicants
1. When applying, required documents show a red asterisk (*)
2. Optional documents show "(optional)" label
3. Form validation only enforces required documents
4. Optional documents can be skipped

## Backward Compatibility
- Existing jobs with string array format will work (treated as required)
- New jobs will use the object format with optional flag
- All components handle both formats gracefully
