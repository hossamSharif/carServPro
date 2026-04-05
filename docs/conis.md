

Constitution ID: CONST-001
Name: Auto-Commit on Implementation Success
Scope: Global — applies to all speckit.implementation runs
Enforcement: Hard Rule (agent MUST NOT proceed without complying)

---

## RULE

After every `speckit.implementation` task completes successfully, the AI agent 
MUST perform a Git commit before moving to the next task or stopping.

A successful implementation is defined as: all acceptance scenarios for the 
task pass, no TypeScript/lint errors exist, and the app builds without errors.

---

## REQUIRED COMMIT SEQUENCE

The agent MUST execute the following steps in this exact order after each 
successful implementation task:

1. Stage all changed files:
   git add -A

2. Verify staged files are correct — output `git status` and confirm only 
   files relevant to the completed task are staged. If unrelated files are 
   staged, unstage them with `git restore --staged <file>` before committing.

3. Commit with a structured message following Conventional Commits format:
   git commit -m "<type>(P{N}-T{N}): <short description in English>

   - <bullet: what was implemented>
   - <bullet: what requirement this fulfills (FR-XXX)>
   - <bullet: files changed or created>
   
   Spec: 001-carserv-pro-platform
   Phase: {phase name}
   Task: P{N}-T{N}"

4. Confirm commit was created:
   git log --oneline -1

---

## COMMIT TYPE REFERENCE

Use the following conventional commit types:
  - feat     → new feature implementation
  - fix      → bug fix within an implementation task
  - refactor → code restructure with no behavior change
  - style    → UI/design-only change (no logic)
  - test     → adding or fixing tests
  - chore    → config, tooling, environment setup (Phase 1 tasks)
  - docs     → documentation only

---

## BRANCH RULES

- All implementation commits MUST happen on the feature branch:
  `001-carserv-pro-platform`
- The agent MUST NEVER commit directly to `main` or `master`
- If the branch does not exist, create it before the first commit:
  git checkout -b 001-carserv-pro-platform

---

## BLOCKING CONDITIONS

The agent MUST NOT commit if ANY of the following are true:
  - The build fails: `vite build` exits with errors
  - TypeScript compiler reports errors: `tsc --noEmit` fails
  - ESLint reports errors (warnings are acceptable): `eslint src/` exits non-zero
  - Acceptance scenarios for the task have not been manually verified or 
    unit-tested

If any blocking condition is met, the agent MUST:
  1. Report the failure clearly
  2. Fix the issue within the same task scope
  3. Re-verify all conditions pass
  4. Only then proceed with the commit

---

## ROLLBACK RULE

If a commit is made and a subsequent task reveals the previous commit 
introduced a regression, the agent MUST:
  1. Do NOT silently overwrite — create a fix commit referencing the original:
     git commit -m "fix(P{N}-T{N}): fix regression from P{X}-T{X} — <description>"
  2. Never use `git push --force` on the feature branch without explicit 
     user approval

---

## VIOLATION CONSEQUENCE

If the agent completes an implementation task and does NOT commit, the 
`speckit.implementation` session is considered incomplete and MUST be 
restarted from the last committed task. No partial progress is accepted 
without a corresponding commit.