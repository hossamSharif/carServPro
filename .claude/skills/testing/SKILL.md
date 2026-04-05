# 🧪 MCP-Driven Autonomous Testing Skill (v2 - Self-Fixing)

> Autonomous testing AND fixing for Next.js + Supabase/Firebase apps

---

## 🎯 Core Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ OLD: Test → Find Bug → Report → Wait for Developer         │
│  ✅ NEW: Test → Find Bug → READ DOCS → FIX IT → Continue       │
└─────────────────────────────────────────────────────────────────┘
```

**The agent is BOTH tester AND developer. It NEVER waits for human fixes.**

---

## 🔧 Required MCP Tools

| Tool | Purpose | Fallback |
|------|---------|----------|
| `chrome-devtools` | UI navigation, interaction, screenshots | None (required) |
| `supabase` | Database verification, data seeding | Supabase CLI |
| `firebase` | Database verification, data seeding | Firebase CLI |

---

## 🚨 CRITICAL: Self-Fixing Protocol

### When ANY Test Fails:

```
TEST FAILS
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: UNDERSTAND THE BUG                                     │
│  ├── Take screenshot of failure                                 │
│  ├── Capture console errors                                     │
│  ├── Identify the failing component/page/feature                │
│  └── Note the expected vs actual behavior                       │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: READ RELATED DOCUMENTATION (MANDATORY)                 │
│  ├── specs/[branch]/spec.md → Feature requirements              │
│  ├── specs/[branch]/tasks.md → Implementation details           │
│  ├── specs/[branch]/*.md → Any other relevant docs              │
│  ├── Component source code → Understand implementation          │
│  └── Related files (utils, hooks, API routes)                   │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: ANALYZE ROOT CAUSE                                     │
│  ├── Compare spec requirements vs actual behavior               │
│  ├── Check for missing implementations                          │
│  ├── Identify logic errors                                      │
│  ├── Check for typos, wrong imports, missing props              │
│  └── Verify database schema matches expected                    │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: IMPLEMENT THE FIX                                      │
│  ├── Write the fix based on spec requirements                   │
│  ├── Follow project coding standards                            │
│  ├── Handle edge cases mentioned in docs                        │
│  └── Add any missing translations (i18n)                        │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: COMMIT THE FIX                                         │
│  └── git commit -m "fix([scope]): [description]"                │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: RE-TEST                                                │
│  ├── Run the same test again                                    │
│  ├── If PASS → Mark [x], continue to next test                  │
│  └── If FAIL → Repeat from Step 2 (max 3 attempts)              │
└─────────────────────────────────────────────────────────────────┘
    ↓
ONLY AFTER 3 FAILED FIX ATTEMPTS:
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: MARK BLOCKED (Last Resort)                             │
│  ├── Document what was tried                                    │
│  ├── Document why fixes failed                                  │
│  ├── Continue to next test (don't stop)                         │
│  └── Include in final report                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📖 Mandatory Doc Reading Before Fixing

### Doc Reading Protocol

```javascript
// BEFORE writing ANY fix, agent MUST:

const REQUIRED_READING = {
  // 1. Feature specification
  specFile: 'specs/[branch]/spec.md',
  
  // 2. Implementation tasks
  tasksFile: 'specs/[branch]/tasks.md',
  
  // 3. Any additional docs in spec directory
  additionalDocs: 'specs/[branch]/*.md',
  
  // 4. Source code of failing component
  sourceCode: '[path to component/page]',
  
  // 5. Related files
  relatedFiles: [
    'hooks used by component',
    'utils imported',
    'API routes called',
    'types/interfaces'
  ]
}

// Extract from docs:
const EXTRACT = {
  requirements: 'What should this feature do?',
  expectedBehavior: 'How should it behave?',
  dataStructure: 'What data format is expected?',
  edgeCases: 'What edge cases are mentioned?',
  validations: 'What validations are required?'
}
```

### Reading Command

```bash
# Agent must execute before fixing:

# 1. Read spec
cat specs/[branch]/spec.md

# 2. Read tasks
cat specs/[branch]/tasks.md

# 3. Read all docs in directory
ls specs/[branch]/*.md | xargs cat

# 4. Read failing component
cat [component-path]

# 5. Read related imports
grep -r "import" [component-path] | head -20
```

---

## 🔧 Bug Categories & Fix Strategies

### 1. i18n Issues (Translation Keys Visible)

```
SYMPTOM: "expenses.title" instead of "المصروفات"

FIX PROTOCOL:
1. Read specs for expected translations
2. Find translation files:
   - /locales/ar.json
   - /messages/ar.json
   - /public/locales/ar/*.json
3. Add missing keys
4. If keys exist but don't load:
   - Check useTranslation() hook
   - Check namespace imports
   - Check i18n config
5. Commit: git commit -m "fix(i18n): add [keys] translations"
6. Refresh and re-test
```

### 2. UI Render Issues (Elements Missing/Wrong)

```
SYMPTOM: Component doesn't render or renders incorrectly

FIX PROTOCOL:
1. Read spec.md for UI requirements
2. Read component source code
3. Check for:
   - Missing imports
   - Wrong props
   - Conditional rendering bugs
   - CSS/Tailwind issues
   - RTL issues for Arabic
4. Fix the component
5. Commit: git commit -m "fix(ui): [description]"
6. Re-test
```

### 3. CRUD Issues (Data Not Saving/Loading)

```
SYMPTOM: Create/Read/Update/Delete not working

FIX PROTOCOL:
1. Read spec.md for data requirements
2. Read tasks.md for API implementation details
3. Check:
   - API route handler
   - Database query
   - Form submission logic
   - State management
4. Use Supabase/Firebase MCP to verify DB schema
5. Fix the issue
6. Commit: git commit -m "fix(crud): [description]"
7. Re-test with DB verification
```

### 4. Validation Issues (Forms Not Validating)

```
SYMPTOM: Form accepts invalid data or rejects valid data

FIX PROTOCOL:
1. Read spec.md for validation rules
2. Check form component
3. Check validation schema (zod, yup, etc.)
4. Fix validation logic
5. Commit: git commit -m "fix(validation): [description]"
6. Re-test with valid and invalid data
```

### 5. Auth Issues (Login/Permission Problems)

```
SYMPTOM: Can't login or wrong permissions

FIX PROTOCOL:
1. Read spec.md for auth requirements
2. Check auth middleware
3. Check role-based access
4. Verify user in database
5. Fix auth logic
6. Commit: git commit -m "fix(auth): [description]"
7. Re-test
```

### 6. Logic Errors (Wrong Behavior)

```
SYMPTOM: Feature works but does wrong thing

FIX PROTOCOL:
1. Read spec.md for expected behavior
2. Compare spec vs actual behavior
3. Trace the logic in code
4. Identify where logic diverges from spec
5. Fix to match spec requirements
6. Commit: git commit -m "fix(logic): [description]"
7. Re-test
```

### 7. TypeScript Errors

```
SYMPTOM: TS errors in console or build

FIX PROTOCOL:
1. Read the error message
2. Check types/interfaces
3. Fix type definitions
4. Run: npx tsc --noEmit
5. Commit: git commit -m "fix(types): [description]"
6. Re-test
```

### 8. API Errors (500, 404, etc.)

```
SYMPTOM: API returns error status

FIX PROTOCOL:
1. Read tasks.md for API specs
2. Check API route handler
3. Check request/response format
4. Check database queries
5. Add proper error handling
6. Commit: git commit -m "fix(api): [description]"
7. Re-test
```

---

## 🔄 Enhanced Ralph Wiggum Execution

### Main Loop Prompt

```bash
/ralph-loop "Execute specs/[branch]/TEST-PLAN.md as a DEVELOPER-TESTER.

## YOUR ROLE
You are BOTH a tester AND a developer. When you find bugs, you FIX them yourself.
You NEVER report bugs for someone else to fix. You fix them and continue.

## EXECUTION FLOW

FOR EACH TEST IN TEST-PLAN.md:

1. EXECUTE the test using Chrome MCP / DB MCP
2. IF PASS:
   - Mark [x] in TEST-PLAN.md
   - Continue to next test

3. IF FAIL:
   a. SCREENSHOT: Save to specs/[branch]/screenshots/
   b. READ DOCS (MANDATORY before any fix):
      - cat specs/[branch]/spec.md
      - cat specs/[branch]/tasks.md
      - cat specs/[branch]/*.md
      - Read the failing component source
   c. ANALYZE: Compare spec requirements vs actual behavior
   d. FIX: Write code fix based on spec requirements
   e. COMMIT: git add . && git commit -m 'fix([scope]): [desc]'
   f. RE-TEST: Run same test again
   g. If still fails: Repeat b-f (max 3 attempts)
   h. After 3 attempts: Mark BLOCKED, continue to next test

## RULES

✅ ALWAYS read docs BEFORE writing any fix
✅ ALWAYS base fixes on spec requirements
✅ ALWAYS commit each fix separately
✅ ALWAYS re-test after fixing
✅ ALWAYS continue to next test after fix or block
❌ NEVER report bugs without attempting fix
❌ NEVER wait for human to fix bugs
❌ NEVER skip reading docs before fixing
❌ NEVER stop the loop (except for HARD STOP verification)

## HARD STOP MARKERS

At HARD STOP markers:
- Verify ALL tests in section pass
- If any test is BLOCKED: Note it but continue
- Move to next section

## COMPLETION

When ALL tests processed:
1. Generate TEST-REPORT.md with:
   - Tests passed
   - Tests fixed (with commit hashes)
   - Tests blocked (with reasons)
2. Output <promise>ALL_TESTS_COMPLETE</promise>

If >50% tests BLOCKED after all fix attempts:
- Output <promise>BLOCKED</promise>
" --max-iterations 50 --completion-promise "ALL_TESTS_COMPLETE"
```

---

## 📊 Fix Tracking in Test Report

### TEST-REPORT.md Structure

```markdown
# TEST REPORT: [Feature Name]

Generated: [timestamp]
Status: ✅ COMPLETE | ⚠️ PARTIAL | ❌ BLOCKED

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | XX |
| Passed (First Try) | XX |
| Passed (After Fix) | XX |
| Blocked | XX |

## Fixes Applied

| Test ID | Bug Type | Root Cause | Fix Description | Commit |
|---------|----------|------------|-----------------|--------|
| EXP-i18n-1 | i18n | Missing translation keys | Added ar.json entries | abc123 |
| EXP-CRUD-1 | API | Wrong query filter | Fixed WHERE clause | def456 |
| EXP-UI-2 | UI | Missing RTL class | Added dir="rtl" | ghi789 |

## Fix Details

### Fix #1: EXP-i18n-1

**Bug:** Translation keys showing instead of Arabic text
**Spec Reference:** specs/expenses/spec.md - Section 3.2
**Root Cause:** Keys not added to ar.json
**Files Changed:** locales/ar.json
**Commit:** abc123

```diff
// locales/ar.json
{
+ "expenses": {
+   "title": "المصروفات",
+   "subtitle": "إدارة المصروفات"
+ }
}
```

### Fix #2: EXP-CRUD-1
...

## Blocked Tests (After 3 Fix Attempts)

### BLOCKED: [Test ID]
**Attempts:**
1. [What was tried] → [Why it failed]
2. [What was tried] → [Why it failed]  
3. [What was tried] → [Why it failed]

**Possible Causes:**
- [Theory 1]
- [Theory 2]

**Recommended Manual Review:**
- [Specific file/function to check]
```

---

## 🚀 Pre-Execution Protocol

### Step 1: Detect Database Type

```bash
if [ -f "supabase/config.toml" ] || grep -q "supabase" package.json; then
  DATABASE_TYPE="supabase"
elif [ -f "firebase.json" ] || grep -q "firebase" package.json; then
  DATABASE_TYPE="firebase"
fi
```

### Step 2: Find Running Application

```bash
for PORT in 3000 3001 3002 3003 3004 3005; do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    APP_URL="http://localhost:$PORT"
    break
  fi
done

# If not running, start it
if [ -z "$APP_URL" ]; then
  npm run dev &
  sleep 15
  APP_URL="http://localhost:3000"
fi
```

### Step 3: Verify Correct App

Navigate to known route and verify app identity before testing.

---

## 🔐 Authentication Protocol

### Test Accounts

```yaml
accounts:
  - email: "hossamsharif1990@gmail.com"
    password: "Hossam1990@"
    role: admin
    
  - email: "halabija@gmail.com"
    password: "Hossam1990@"
    role: user
    
  - email: "husameldeenh@gmail.com"
    password: "Hossam1990@"
    role: user
```

### Login Flow

1. Try primary account
2. If fails → Try backup accounts
3. If all fail → Create via Supabase/Firebase CLI
4. Store session for subsequent tests

---

## ⚙️ Configuration

### .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(grep *)",
      "Bash(supabase *)",
      "Bash(firebase *)",
      "Bash(curl *)",
      "mcp__chrome-devtools__*",
      "mcp__supabase__*"
    ]
  }
}
```

---

## 📁 File Structure

```
project/
├── specs/
│   └── [branch]/
│       ├── spec.md           # Feature spec (READ BEFORE FIXING)
│       ├── tasks.md          # Tasks (READ BEFORE FIXING)
│       ├── TEST-PLAN.md      # Generated test plan
│       ├── TEST-REPORT.md    # Generated report with fixes
│       └── screenshots/      # Failure evidence
├── .claude/
│   └── settings.json
├── CLAUDE.md
└── skills/
    └── testing/
        └── SKILL.md
```

---

## 🎯 Key Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "I am not just a tester. I am a developer who tests.         │
│    When I find a bug, I READ THE DOCS and FIX IT.              │
│    I only mark BLOCKED after 3 genuine fix attempts.           │
│    I NEVER wait for a human to fix bugs for me."               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```