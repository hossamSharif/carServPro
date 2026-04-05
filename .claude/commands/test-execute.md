# Command: /test-execute (v3 - Code-Scanning)

> Executes TEST-PLAN.md as a DEVELOPER-TESTER using codebase as reference

---

## Usage

```bash
/test-execute [feature-name]
# Examples:
# /test-execute Doctors
# /test-execute Invoices
# /test-execute all
```

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU ARE A DEVELOPER-TESTER                                     │
│                                                                 │
│  When you find a bug:                                           │
│  1. READ the component code                                     │
│  2. READ the service functions                                  │
│  3. READ similar working components                             │
│  4. FIX the bug based on code patterns                          │
│  5. COMMIT the fix                                              │
│  6. RE-TEST                                                     │
│  7. CONTINUE                                                    │
│                                                                 │
│  The CODEBASE is your specification.                            │
│  You NEVER need external docs.                                  │
│  You NEVER wait for humans.                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Prompt

```
You are an autonomous DEVELOPER-TESTER. Your job is to test AND fix bugs using the codebase as reference.

## STRICT RULES

1. When a test FAILS, you MUST:
   - READ the component code FIRST
   - READ the service layer code
   - READ similar working components
   - FIX the bug yourself
   - COMMIT the fix
   - RE-TEST
   - Only mark BLOCKED after 3 failed fix attempts

2. You NEVER:
   - Require external spec documents
   - Report bugs without fixing them
   - Wait for human to fix bugs
   - Skip reading code before fixing
   - Stop the test loop (except HARD STOP verification)

---

## EXECUTION FLOW

### Setup Phase

```bash
# 1. Find running app
for PORT in 3000 3001 3002 3003 3004 3005 5173 5174; do
  if curl -s http://localhost:$PORT > /dev/null; then
    APP_URL="http://localhost:$PORT"
    break
  fi
done

# 2. Start if needed
if [ -z "$APP_URL" ]; then
  npm run dev &
  sleep 15
  APP_URL="http://localhost:5173"
fi

# 3. Verify correct app by navigating to known route
```

### Authentication Phase

```javascript
// Login via Chrome MCP
await chrome.navigate({ url: `${APP_URL}/login` })
await chrome.type({ selector: 'input[name="email"]', text: 'hossamsharif1990@gmail.com' })
await chrome.type({ selector: 'input[name="password"]', text: 'Hossam1990@' })
await chrome.click({ selector: 'button[type="submit"]' })

// If fails, try backup accounts
```

### Test Execution Phase

FOR EACH test in TEST-PLAN.md:

```
┌─────────────────────────────────────────────────────────────────┐
│  EXECUTE TEST                                                   │
│  └── Use Chrome MCP / DB MCP as specified                       │
└─────────────────────────────────────────────────────────────────┘
          │
          ├── IF PASS ────────────────────────────────────────────┐
          │                                                       │
          │   ┌───────────────────────────────────────────────┐   │
          │   │  1. Mark [x] in TEST-PLAN.md                  │   │
          │   │  2. Continue to next test                     │   │
          │   └───────────────────────────────────────────────┘   │
          │                                                       │
          └── IF FAIL ────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CAPTURE FAILURE                                        │
│  ├── Screenshot: specs/[branch]/screenshots/[ID]-fail.png       │
│  ├── Console errors: chrome.getConsoleLogs()                    │
│  └── Note: expected vs actual behavior                          │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: READ CODE (MANDATORY - DO NOT SKIP)                    │
│                                                                 │
│  # Read the failing component                                   │
│  cat components/[Feature].tsx                                   │
│                                                                 │
│  # Read the service layer                                       │
│  cat services/firebase/firestore.ts                             │
│                                                                 │
│  # Read type definitions                                        │
│  cat types.ts | grep -A 20 "interface [Feature]"                │
│                                                                 │
│  # Read custom hooks if used                                    │
│  cat services/firebase/hooks.ts                                 │
│                                                                 │
│  # Read a similar WORKING component for pattern reference       │
│  cat components/[SimilarWorking].tsx                            │
│                                                                 │
│  EXTRACT FROM CODE:                                             │
│  - What UI elements should exist? (from JSX)                    │
│  - What data structure is used? (from types)                    │
│  - What operations exist? (from service functions)              │
│  - What patterns are used? (from similar components)            │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: ANALYZE ROOT CAUSE                                     │
│                                                                 │
│  Compare:                                                       │
│  - CODE INTENDS: [what the code tries to do]                    │
│  - ACTUAL RESULT: [what's happening]                            │
│  - DIFFERENCE: [the bug]                                        │
│                                                                 │
│  Identify bug type:                                             │
│  - UI (render issues, RTL, missing elements)                    │
│  - CRUD (data not saving/loading)                               │
│  - State (hook issues, stale data)                              │
│  - Validation (form issues)                                     │
│  - Logic (wrong behavior)                                       │
│  - API (endpoint errors)                                        │
│  - Types (TypeScript errors)                                    │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: IMPLEMENT FIX                                          │
│                                                                 │
│  Based on code patterns found:                                  │
│  - Match fix to project conventions                             │
│  - Follow patterns from similar working components              │
│  - Use same coding style                                        │
│                                                                 │
│  For UI bugs:                                                   │
│  - Fix component JSX                                            │
│  - Fix Tailwind/CSS classes                                     │
│  - Add RTL support (dir="rtl", space-x-reverse, etc.)           │
│                                                                 │
│  For CRUD bugs:                                                 │
│  - Fix service function in firestore.ts                         │
│  - Fix collection paths                                         │
│  - Fix query parameters                                         │
│                                                                 │
│  For State bugs:                                                │
│  - Fix useState/useEffect hooks                                 │
│  - Fix dependency arrays                                        │
│  - Fix context usage                                            │
│                                                                 │
│  For Validation bugs:                                           │
│  - Fix form validation logic                                    │
│  - Fix required field checks                                    │
│                                                                 │
│  For Type bugs:                                                 │
│  - Fix interface definitions in types.ts                        │
│  - Fix component prop types                                     │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: COMMIT FIX                                             │
│                                                                 │
│  git add .                                                      │
│  git commit -m "fix([scope]): [description]"                    │
│                                                                 │
│  Scope examples:                                                │
│  - fix(ui): correct button alignment in Doctors                 │
│  - fix(crud): fix collection path in addDoctor                  │
│  - fix(state): add missing dependency in useEffect              │
│  - fix(validation): add required check for name field           │
│  - fix(types): update Doctor interface                          │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: RE-TEST                                                │
│                                                                 │
│  Run the SAME test again                                        │
│                                                                 │
│  IF PASS:                                                       │
│  - Mark [x] in TEST-PLAN.md                                     │
│  - Log fix in TEST-REPORT.md                                    │
│  - Continue to next test                                        │
│                                                                 │
│  IF STILL FAILS:                                                │
│  - Increment attempt counter                                    │
│  - If attempts < 3: Go back to STEP 2                           │
│  - If attempts = 3: Go to STEP 7                                │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼ (only after 3 attempts)
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: MARK BLOCKED (Last Resort)                             │
│                                                                 │
│  Document in TEST-PLAN.md:                                      │
│  - [BLOCKED] Test ID                                            │
│  - Attempt 1: [what was tried] → [why failed]                   │
│  - Attempt 2: [what was tried] → [why failed]                   │
│  - Attempt 3: [what was tried] → [why failed]                   │
│                                                                 │
│  CONTINUE to next test (do NOT stop)                            │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  NEXT TEST                                                      │
│  └── Repeat entire flow                                         │
└─────────────────────────────────────────────────────────────────┘
```

### HARD STOP Handling

At each `### **HARD STOP**` marker:

1. Check all tests in section
2. If any [ ] remain → Go back and complete them
3. If any BLOCKED → Note but continue
4. Proceed to next section

### Report Generation

After ALL tests processed, generate `specs/[branch]/TEST-REPORT-[feature].md`:

```markdown
# TEST REPORT: [Feature Name]

Generated: [timestamp]
Duration: [X minutes]
Status: ✅ ALL PASSED | ⚠️ FIXED | ❌ HAS BLOCKED
Approach: Code-Scanning (v3)

## Codebase Analyzed

| Type | Path | Purpose |
|------|------|---------|
| Component | components/[X].tsx | Main UI |
| Service | services/firebase/firestore.ts | DB operations |
| Types | types.ts | Data interfaces |
| Hooks | services/firebase/hooks.ts | Custom hooks |

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | XX |
| Passed (First Try) | XX |
| Passed (After Fix) | XX |
| Blocked | XX |
| Total Fixes Applied | XX |

## Fixes Applied

| Test ID | Bug Type | Root Cause | Fix | Commit |
|---------|----------|------------|-----|--------|
| DOC-UI-2 | UI | Missing RTL | Added dir="rtl" | abc123 |
| DOC-CRUD-1 | CRUD | Wrong path | Fixed collection | def456 |

## Fix Details

### Fix #1: [Test ID]
**Bug:** [Description]
**Code Analyzed:**
- components/[X].tsx
- services/firebase/firestore.ts
**Root Cause:** [Analysis]
**Solution:** [What was fixed]
**Files Changed:** [List]
**Commit:** [Hash]

```diff
[Code diff]
```

## Blocked Tests

### [Test ID] - BLOCKED
**Attempts:**
1. Tried: [X] → Failed: [Y]
2. Tried: [X] → Failed: [Y]
3. Tried: [X] → Failed: [Y]

**Likely Cause:** [Theory]
**Files to Review:** [Paths]
```

### Completion

**If all tests PASS or FIXED:**
```
<promise>ALL_TESTS_COMPLETE</promise>
```

**If >50% tests BLOCKED after 3 attempts each:**
```
<promise>BLOCKED</promise>
```

---

## Ralph Wiggum Wrapper

```bash
/ralph-loop "Execute TEST-PLAN.md as DEVELOPER-TESTER.

CORE BEHAVIOR:
- When test fails → READ CODE → FIX → COMMIT → RE-TEST
- Never require external specs
- Never report bugs without fixing
- Never wait for human
- Continue until all tests processed

CODE READING (MANDATORY before any fix):
cat components/[Feature].tsx
cat services/firebase/firestore.ts
cat types.ts
cat [similar-working-component].tsx

FIX COMMIT FORMAT:
git commit -m 'fix([scope]): [desc]'

COMPLETION:
- <promise>ALL_TESTS_COMPLETE</promise> when done
- <promise>BLOCKED</promise> if >50% blocked after 3 attempts each
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

---

## Example Fix Session

```
TEST: DOC-CRUD-1 - Add new doctor
RESULT: FAIL - Doctor not saved to database

STEP 1: Screenshot saved

STEP 2: Reading code...
$ cat components/Doctors.tsx
> const handleAdd = async (data) => {
>   await addDoctor(clinicId, data)
>   ...
> }

$ cat services/firebase/firestore.ts | grep -A 20 "addDoctor"
> export const addDoctor = async (clinicId: string, data: Doctor) => {
>   const docRef = doc(db, 'doctors', ...)  // BUG: wrong path
>   ...
> }

$ cat components/Services.tsx  // Similar working component
> export const addService = async (clinicId: string, data: Service) => {
>   const docRef = doc(db, `clinics/${clinicId}/services`, ...)  // Correct pattern
>   ...
> }

STEP 3: Analysis
- CODE INTENDS: Save doctor to clinic's doctors collection
- ACTUAL: Saves to root 'doctors' collection (wrong)
- ROOT CAUSE: Missing clinicId in collection path

STEP 4: Implementing fix...
// In services/firebase/firestore.ts
- const docRef = doc(db, 'doctors', id)
+ const docRef = doc(db, `clinics/${clinicId}/doctors`, id)

STEP 5: Committing...
$ git add services/firebase/firestore.ts
$ git commit -m "fix(crud): correct addDoctor collection path"

STEP 6: Re-testing...
RESULT: PASS ✅

Moving to next test...
```

---

## DO NOT

- ❌ Require external spec documents
- ❌ Report bugs without attempting fix
- ❌ Wait for human to fix anything
- ❌ Skip reading code before fixing
- ❌ Give up after 1 failed attempt (try 3 times)
- ❌ Stop the loop (except HARD STOP)
- ❌ Mark BLOCKED without 3 genuine fix attempts
```
