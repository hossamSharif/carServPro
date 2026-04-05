# Command: /test (v3 - Code-Scanning)

> Complete autonomous testing via codebase analysis (no specs required)

---

## Usage

```bash
/test [feature-name]
# Examples:
# /test Doctors
# /test Invoices
# /test all
```

---

## What This Does

```
/test = Scan Code → Generate Plan → Execute Tests → FIX BUGS → Report

┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: CODEBASE SCAN                                         │
│  ├── Discover feature files (component, services, types)        │
│  ├── Analyze code structure                                     │
│  └── Understand what the code does                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: GENERATE TEST-PLAN.md                                 │
│  ├── Generate tests from code analysis                          │
│  ├── UI tests from JSX structure                                │
│  ├── CRUD tests from service functions                          │
│  └── Validation tests from form schemas                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: EXECUTE + FIX (Ralph Wiggum Loop)                     │
│  ├── Run each test                                              │
│  ├── If fail: READ CODE → FIX → COMMIT → RE-TEST                │
│  ├── Continue until all tests processed                         │
│  └── Generate TEST-REPORT.md with all fixes                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT                                                         │
│  ├── All bugs FIXED and committed                               │
│  ├── TEST-REPORT.md with fix details                            │
│  └── <promise>ALL_TESTS_COMPLETE</promise>                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   THE CODEBASE IS THE SPECIFICATION                             │
│                                                                 │
│   1. SCAN the codebase to find feature files                    │
│   2. READ the component code to understand behavior             │
│   3. GENERATE tests from what the code does                     │
│   4. EXECUTE tests via Chrome MCP                               │
│   5. When bugs found: READ CODE → FIX → COMMIT                  │
│   6. CONTINUE until all tests processed                         │
│                                                                 │
│   You NEVER need external spec documents.                       │
│   You NEVER wait for humans.                                    │
│   You FIX and CONTINUE.                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Prompt

```
You are an autonomous DEVELOPER-TESTER. Scan code, generate tests, execute, and FIX all bugs yourself.

## PHASE 1: ENVIRONMENT & CODEBASE SCAN

1. Detect project type (Firebase/Supabase)
2. Find running app (ports 3000-5174)
3. Discover feature files:

```bash
# List all components (each is a testable feature)
ls components/*.tsx

# For specified feature, find related files:
# Component: components/[Feature].tsx
# Services: services/firebase/firestore.ts
# Types: types.ts
# Hooks: services/firebase/hooks.ts
# Context: contexts/*.tsx
```

4. Read and analyze the code:

```bash
# Read main component
cat components/[Feature].tsx

# Extract:
# - UI elements (from JSX return)
# - CRUD operations (from function calls)
# - State management (from hooks)
# - Validation (from form handling)
# - Data types (from TypeScript)

# Read service layer
cat services/firebase/firestore.ts

# Read types
cat types.ts | grep -A 20 "interface [Feature]"
```

## PHASE 2: GENERATE TEST-PLAN.md

From code analysis, generate tests:

```markdown
# TEST-PLAN: [Feature Name]

Generated: [timestamp]
Approach: Code-Scanning (v3)

## Codebase Analysis

| File | Path | Purpose |
|------|------|---------|
| Component | components/[X].tsx | Main UI |
| Service | services/firebase/firestore.ts | DB ops |
| Types | types.ts | Data model |

## UI Tests (from JSX analysis)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| [F]-UI-1 | Page loads | Renders | Chrome | [ ] |
| [F]-UI-2 | Table visible | Data displayed | Chrome | [ ] |
| [F]-UI-3 | Add button | Opens form | Chrome | [ ] |

## CRUD Tests (from service analysis)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| [F]-CRUD-1 | Create | Saved to DB | Chrome+DB | [ ] |
| [F]-CRUD-2 | Read | Data loaded | Chrome+DB | [ ] |
| [F]-CRUD-3 | Update | Changes saved | Chrome+DB | [ ] |
| [F]-CRUD-4 | Delete | Removed from DB | Chrome+DB | [ ] |

## Validation Tests (from form analysis)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| [F]-VAL-1 | Required fields | Error shown | Chrome | [ ] |
| [F]-VAL-2 | Valid input | Accepted | Chrome | [ ] |

## State Tests (from hook analysis)
| ID | Test | Expected | Tool | Status |
|----|------|----------|------|--------|
| [F]-STATE-1 | Loading | Loader shown | Chrome | [ ] |
| [F]-STATE-2 | Empty | Message shown | Chrome | [ ] |

### **HARD STOP** - [Feature] Complete
```

Save to: specs/[branch]/TEST-PLAN-[feature].md

## PHASE 3: EXECUTE WITH SELF-FIXING

Use Ralph Wiggum loop:

```bash
/ralph-loop "Execute TEST-PLAN.md as DEVELOPER-TESTER.

FOR EACH TEST:

1. EXECUTE test via Chrome MCP / DB MCP

2. IF PASS:
   - Mark [x]
   - Continue

3. IF FAIL:

   a. CAPTURE:
      - Screenshot to specs/[branch]/screenshots/
      - Console errors
      - Expected vs actual

   b. READ CODE (MANDATORY):
      ```
      cat components/[Feature].tsx
      cat services/firebase/firestore.ts
      cat types.ts
      cat [similar-working-component].tsx
      ```

   c. ANALYZE:
      - What does code intend to do?
      - What is actually happening?
      - Where is the mismatch?

   d. FIX:
      - Match fix to project patterns
      - Follow existing conventions
      - For UI: fix JSX/styles
      - For CRUD: fix service functions
      - For validation: fix form logic
      - For state: fix hooks

   e. COMMIT:
      git add .
      git commit -m 'fix([scope]): [description]'

   f. RE-TEST:
      - Run same test
      - If pass: mark [x], continue
      - If fail: repeat b-f (max 3 times)

   g. AFTER 3 ATTEMPTS:
      - Mark BLOCKED with details
      - Continue to next test

HARD STOPS:
- Verify all section tests complete
- Note any BLOCKED
- Continue to next section

AT END:
- Generate TEST-REPORT.md
- Include all fixes with commits
- Include any BLOCKED with attempts

OUTPUT:
- <promise>ALL_TESTS_COMPLETE</promise> when done
- <promise>BLOCKED</promise> if >50% blocked
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

## PHASE 4: FINAL REPORT

Generate specs/[branch]/TEST-REPORT-[feature].md:

```markdown
# TEST REPORT: [Feature]

Status: ✅ COMPLETE
Approach: Code-Scanning (v3)

## Codebase Analyzed

| File | Path | Purpose |
|------|------|---------|
| Component | components/[X].tsx | Main UI |
| Service | services/firebase/firestore.ts | DB ops |

## Summary
| Metric | Count |
|--------|-------|
| Total | XX |
| Passed (First) | XX |
| Passed (Fixed) | XX |
| Blocked | XX |

## Fixes Applied
| Test | Bug | Fix | Commit |
|------|-----|-----|--------|
| ... | ... | ... | ... |

## Fix Details
### Fix #1
- Bug: ...
- Code Analyzed: ...
- Solution: ...
- Commit: ...

## Blocked (if any)
### [Test ID]
- Attempt 1: ...
- Attempt 2: ...
- Attempt 3: ...
```

---

## Bug Fix Protocols (Code-Based)

### UI (Render Issues)

```
1. Read component JSX structure
2. Read similar working components
3. Fix JSX, props, or Tailwind classes
4. Handle RTL for Arabic (dir="rtl")
5. Commit: fix(ui): [description]
```

### CRUD (Data Issues)

```
1. Read service function in firestore.ts
2. Read component that calls it
3. Check collection paths, parameters
4. Verify with Firebase/Supabase MCP
5. Commit: fix(crud): [description]
```

### State (Hook Issues)

```
1. Read useState/useEffect usage
2. Check dependency arrays
3. Read similar components for patterns
4. Fix state logic
5. Commit: fix(state): [description]
```

### Validation (Form Issues)

```
1. Read form component
2. Find validation logic
3. Check similar forms for pattern
4. Fix validation
5. Commit: fix(validation): [description]
```

### TypeScript (Type Errors)

```
1. Read error message
2. Check types.ts definitions
3. Fix type mismatches
4. Commit: fix(types): [description]
```

---

## Output Files

```
specs/[branch]/
├── TEST-PLAN-[feature].md   # Generated from code
├── TEST-REPORT-[feature].md # Report with all fixes
└── screenshots/             # Failure evidence
```

---

## Success Output

```
✅ Codebase scanned for [feature]
✅ TEST-PLAN.md generated from code analysis
✅ All tests executed
✅ X bugs found and FIXED
✅ X commits made
✅ TEST-REPORT.md generated

<promise>ALL_TESTS_COMPLETE</promise>
```

---

## Rules

### ALWAYS ✅
- Scan codebase to understand feature
- Read component code before fixing
- Match fixes to project patterns
- Commit each fix
- Re-test after fix
- Continue after fix or block
- Try 3 times before blocking

### NEVER ❌
- Require external spec documents
- Report bugs without fixing
- Wait for human
- Skip reading code before fix
- Give up after 1 attempt
- Stop the loop mid-execution
```
