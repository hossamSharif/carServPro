# Command: /test-plan (v3 - Code-Scanning)

> Generates TEST-PLAN.md by scanning codebase (no specs required)

---

## Usage

```bash
/test-plan [feature-name]
# Examples:
# /test-plan Doctors
# /test-plan Invoices
# /test-plan Services
# /test-plan all
```

---

## What This Does

```
┌─────────────────────────────────────────────────────────────────┐
│  CODEBASE SCAN → CODE ANALYSIS → TEST GENERATION                │
│                                                                 │
│  1. Find feature files (component, services, types)             │
│  2. Analyze code structure and behavior                         │
│  3. Generate tests based on what the code does                  │
│  4. Output TEST-PLAN.md ready for execution                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Prompt

```
Generate a comprehensive TEST-PLAN.md by scanning the codebase.

## PHASE 1: ENVIRONMENT DETECTION

1. Detect project type:
   - Check firebase.json for Firebase
   - Check supabase/config.toml for Supabase
   - Check package.json dependencies

2. Find running app:
   - Check ports 3000-5174
   - Verify correct project
   - Start if needed (npm run dev)

3. Identify git branch for output path

## PHASE 2: CODEBASE SCAN

### Step 1: Discover Feature Files

```bash
# For specified feature (e.g., "Doctors"):

# 1. Main component
COMPONENT="components/[Feature].tsx"
cat $COMPONENT

# 2. Service layer
SERVICE="services/firebase/firestore.ts"
grep -A 50 "[feature]" $SERVICE

# 3. Type definitions
grep -A 20 "interface [Feature]" types.ts

# 4. Custom hooks
grep -A 30 "use[Feature]" services/firebase/hooks.ts

# 5. Context usage
grep "[feature]" contexts/*.tsx

# 6. If "all" specified, scan all components:
ls components/*.tsx
```

### Step 2: Analyze Component Code

For each component, extract:

```typescript
// From reading the component JSX:
const UI_ELEMENTS = {
  tables: 'Look for <table> or mapping arrays',
  forms: 'Look for <form> or input handling',
  modals: 'Look for Modal/Dialog components',
  buttons: 'Look for <button> or onClick handlers',
  lists: 'Look for .map() rendering'
}

// From reading function calls:
const CRUD_OPERATIONS = {
  create: 'add*, create*, save* functions',
  read: 'get*, fetch*, load*, list* functions',
  update: 'update*, edit*, modify* functions',
  delete: 'delete*, remove* functions'
}

// From reading hooks:
const STATE_MANAGEMENT = {
  loading: 'isLoading, loading state',
  error: 'error state handling',
  empty: 'empty data checks',
  data: 'main data state'
}

// From reading form handling:
const VALIDATION = {
  required: 'required checks',
  format: 'pattern/regex validation',
  custom: 'custom validation logic'
}
```

### Step 3: Map Service Functions

```bash
# Read firestore.ts and identify:
# - Collection paths used
# - Query patterns
# - Add/Update/Delete operations
# - Real-time listeners

cat services/firebase/firestore.ts | grep -E "(add|update|delete|get|set)Doc"
cat services/firebase/firestore.ts | grep -E "collection\(|doc\("
```

### Step 4: Identify Data Models

```bash
# Read types.ts for interfaces:
cat types.ts | grep -A 15 "interface"

# Extract fields that need testing:
# - Required vs optional fields
# - Field types (string, number, date)
# - Nested objects
```

## PHASE 3: GENERATE TEST-PLAN.md

Output: specs/[branch]/TEST-PLAN-[feature].md

Structure:

```markdown
# TEST-PLAN: [Feature Name]

Generated: [timestamp]
Approach: Code-Scanning (v3)
Feature: [feature name]

---

## Codebase Analysis

### Files Analyzed

| Type | Path | Key Functions |
|------|------|---------------|
| Component | components/[X].tsx | render, handlers |
| Service | services/firebase/firestore.ts | CRUD ops |
| Types | types.ts | [Interface] |
| Hooks | services/firebase/hooks.ts | use[X] |

### Data Model (from types.ts)

```typescript
interface [Feature] {
  id: string
  // ... extracted fields
}
```

### Service Functions (from firestore.ts)

| Function | Operation | Collection |
|----------|-----------|------------|
| add[X] | CREATE | clinics/{id}/[x] |
| get[X] | READ | clinics/{id}/[x] |
| update[X] | UPDATE | clinics/{id}/[x] |
| delete[X] | DELETE | clinics/{id}/[x] |

---

## Environment

| Setting | Value |
|---------|-------|
| App URL | http://localhost:[port] |
| Database | [firebase/supabase] |
| Auth Account | hossamsharif1990@gmail.com |
| Viewports | Desktop (1920x1080), Mobile (375x812) |

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login | Navigate → Enter creds → Submit | Dashboard | Chrome | [ ] |
| AUTH-2 | Session | Refresh page | Stay logged in | Chrome | [ ] |

**Code Reference:** services/firebase/auth.ts

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Correct user role

---

## Feature: [Name]

### Code Reference
- Component: components/[X].tsx
- Service: services/firebase/firestore.ts
- Types: types.ts ([Interface])

### UI Tests (from JSX analysis)

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [F]-UI-1 | Page Load | Navigate to /[route] | Component renders | Chrome | [ ] |
| [F]-UI-2 | Data Table | Check table element | Shows data rows | Chrome | [ ] |
| [F]-UI-3 | Add Button | Look for add button | Button visible | Chrome | [ ] |
| [F]-UI-4 | Add Modal | Click add button | Modal opens | Chrome | [ ] |
| [F]-UI-5 | Edit Action | Check row actions | Edit button visible | Chrome | [ ] |
| [F]-UI-6 | Delete Action | Check row actions | Delete button visible | Chrome | [ ] |

**Code Pattern Reference:** Similar component that works

### CRUD Tests (from service analysis)

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [F]-CRUD-1 | Create | Fill form → Submit | New record in DB | Chrome+DB | [ ] |
| [F]-CRUD-2 | Read | Load page | Data from DB displayed | Chrome+DB | [ ] |
| [F]-CRUD-3 | Update | Edit → Save | DB record updated | Chrome+DB | [ ] |
| [F]-CRUD-4 | Delete | Delete → Confirm | DB record removed | Chrome+DB | [ ] |

**Service Functions:**
- Create: [functionName] in firestore.ts
- Read: [functionName] in firestore.ts
- Update: [functionName] in firestore.ts
- Delete: [functionName] in firestore.ts

### Validation Tests (from form analysis)

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [F]-VAL-1 | Required Fields | Submit empty form | Error messages | Chrome | [ ] |
| [F]-VAL-2 | Valid Input | Fill valid data | Submission works | Chrome | [ ] |

**Validation in:** Form handling in component

### State Tests (from hook analysis)

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [F]-STATE-1 | Loading | Initial load | Loading indicator | Chrome | [ ] |
| [F]-STATE-2 | Empty State | No data | Empty message | Chrome | [ ] |
| [F]-STATE-3 | Error State | Cause error | Error message | Chrome | [ ] |

**State Management:** useState/useEffect in component

### Mobile Tests

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| [F]-MOB-1 | Responsive | 375x812 viewport | Adapts layout | Chrome | [ ] |
| [F]-MOB-2 | RTL Mobile | Check alignment | Correct RTL | Chrome | [ ] |

### **HARD STOP** - [Feature] Complete
- [ ] All UI tests pass
- [ ] All CRUD verified
- [ ] Validation tested
- [ ] Mobile tested

---

[REPEAT FOR EACH FEATURE if "all" specified]

---

## Self-Fix Protocol Summary

When ANY test fails:

1. **CAPTURE** - Screenshot, console errors
2. **READ CODE** - Component, service, similar working code
3. **ANALYZE** - What code intends vs what happens
4. **FIX** - Match fix to project patterns
5. **COMMIT** - fix([scope]): [description]
6. **RE-TEST** - Run same test
7. **REPEAT** - Up to 3 attempts
8. **BLOCK** - Only after 3 failed fixes

---

## Success Criteria

```
- All [ ] marked [x] OR documented as BLOCKED
- All fixes committed with proper messages
- TEST-REPORT.md generated
- <promise>ALL_TESTS_COMPLETE</promise>
```

---

## Execution Command

\`\`\`bash
/ralph-loop "Execute this TEST-PLAN.md as DEVELOPER-TESTER.
Read code before fixing. Fix bugs yourself. Commit each fix.
Output <promise>ALL_TESTS_COMPLETE</promise> when done."
--max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
\`\`\`
```

---

## Example: Doctors Feature Scan

### Codebase Scan Output:

```bash
# 1. Read component
$ cat components/Doctors.tsx

# Found:
# - Table rendering doctors list
# - Add doctor modal with form
# - Edit/Delete actions per row
# - useState for doctors, loading
# - useClinic() context hook
# - addDoctor(), updateDoctor(), deleteDoctor() calls

# 2. Read service
$ grep -A 30 "doctor" services/firebase/firestore.ts

# Found:
# - addDoctor(clinicId, data)
# - updateDoctor(clinicId, id, data)
# - deleteDoctor(clinicId, id)
# - Collection: clinics/{clinicId}/doctors

# 3. Read types
$ grep -A 15 "interface Doctor" types.ts

# Found:
# interface Doctor {
#   id: string
#   name: string
#   specialty: string
#   phone?: string
#   ...
# }
```

### Generated Tests:

```markdown
## Feature: Doctors

### UI Tests
| ID | Test | Expected |
|----|------|----------|
| DOC-UI-1 | Page loads | Doctors component renders |
| DOC-UI-2 | Table visible | Shows doctor rows |
| DOC-UI-3 | Add button | Opens modal |
| DOC-UI-4 | Edit action | Opens edit modal |
| DOC-UI-5 | Delete action | Shows confirmation |

### CRUD Tests
| ID | Test | Service Function |
|----|------|-----------------|
| DOC-CRUD-1 | Create | addDoctor() |
| DOC-CRUD-2 | Read | getDoctors() |
| DOC-CRUD-3 | Update | updateDoctor() |
| DOC-CRUD-4 | Delete | deleteDoctor() |
```

---

## Key Difference from v2

```
v2 (Spec-Based):
- Required specs/[branch]/spec.md
- Required specs/[branch]/tasks.md
- Tests based on documentation

v3 (Code-Scanning):
- Scans components/*.tsx
- Scans services/firebase/*.ts
- Scans types.ts
- Tests based on actual code
- No external docs required
```
```
