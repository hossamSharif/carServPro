<!--
SYNC IMPACT REPORT
==================================================
Version change: 1.1.0 → 1.2.0
Bump rationale: MINOR — new principle (VII) added

Modified principles: None (existing I–VI unchanged)

Added sections:
  - Principle VII: Mandatory Firebase CLI Usage
  - Firebase CLI sub-sections:
    CLI Usage Triggers, CLI Verification Steps, File Ownership
    Rules, Prohibited Firebase Patterns, Firebase Violation
    Consequence

Removed sections: None

Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no update needed
    (Constitution Check gate is generic; new principle auto-applies)
  - .specify/templates/spec-template.md — ✅ no update needed
    (acceptance scenarios already required per template)
  - .specify/templates/tasks-template.md — ✅ no update needed
    (task notes already say "Commit after each task or logical group")
  - .specify/templates/commands/ — ✅ no command templates exist

Follow-up TODOs: None
==================================================
-->

# CarServPro Constitution

## Core Principles

### I. Auto-Commit on Implementation Success

After every `speckit.implementation` task completes successfully,
the AI agent MUST perform a Git commit before moving to the next
task or stopping.

A successful implementation is defined as: all acceptance scenarios
for the task pass, no TypeScript/lint errors exist, and the app
builds without errors.

The agent MUST execute the following steps in exact order after
each successful implementation task:

1. Stage all changed files: `git add -A`
2. Verify staged files — run `git status` and confirm only files
   relevant to the completed task are staged. Unstage unrelated
   files with `git restore --staged <file>` before committing.
3. Commit with a structured message (see Principle II).
4. Confirm commit was created: `git log --oneline -1`

**Rationale**: Every implementation task MUST leave a traceable,
atomic commit. Partial progress without a commit is not accepted.

### II. Conventional Commit Format

All implementation commits MUST use Conventional Commits format:

```
<type>(P{N}-T{N}): <short description in English>

- <what was implemented>
- <requirement fulfilled (FR-XXX)>
- <files changed or created>

Spec: 001-carserv-pro-platform
Phase: {phase name}
Task: P{N}-T{N}
```

**Rationale**: Structured commit messages enable automated
changelogs, traceability to requirements, and clear audit trails.

### III. Branch Isolation

- All implementation commits MUST happen on the feature branch:
  `001-carserv-pro-platform`
- The agent MUST NEVER commit directly to `main` or `master`.
- If the branch does not exist, create it before the first commit:
  `git checkout -b 001-carserv-pro-platform`

**Rationale**: Feature branches protect the mainline from
incomplete or untested work.

### IV. Build Integrity Gates

The agent MUST NOT commit if ANY of the following are true:

- The build fails: `vite build` exits with errors
- TypeScript compiler reports errors: `tsc --noEmit` fails
- ESLint reports errors (warnings are acceptable):
  `eslint src/` exits non-zero
- Acceptance scenarios for the task have not been verified

If any blocking condition is met, the agent MUST:

1. Report the failure clearly
2. Fix the issue within the same task scope
3. Re-verify all conditions pass
4. Only then proceed with the commit

**Rationale**: Commits MUST represent verified, buildable,
lint-clean states. Broken commits waste reviewer time and
introduce compounding failures.

### V. Safe Rollback Policy

If a commit is made and a subsequent task reveals the previous
commit introduced a regression, the agent MUST:

1. Create a fix commit referencing the original:
   `git commit -m "fix(P{N}-T{N}): fix regression from
   P{X}-T{X} — <description>"`
2. NEVER use `git push --force` on the feature branch without
   explicit user approval.

**Rationale**: Silent overwrites destroy audit history. Fix-forward
commits preserve traceability and enable bisection.

### VI. Mandatory shadcn/ui MCP Tool Usage for UI Implementation

The AI agent MUST use the shadcn/ui MCP tool as the first action
whenever any implementation task involves creating, modifying, or
styling a UI component, page layout, or design element.

The agent MUST NOT write manual Tailwind class combinations,
custom component structures, or hardcoded styles for any element
that shadcn/ui already provides or that can be composed from
shadcn/ui primitives.

**Enforcement**: Hard Rule — the agent MUST NOT write manual UI
code without first consulting the shadcn/ui MCP tool.

#### MCP Tool Usage Triggers

The agent MUST invoke the shadcn/ui MCP tool before writing any
code when the task involves ANY of the following:

- Adding a new page or route that contains UI elements
- Creating a form (Form, Input, Select, Checkbox, etc.)
- Building a data table or list (Table or DataTable)
- Adding navigation (NavigationMenu, Breadcrumb, Tabs)
- Showing alerts, toasts, or notifications (Toast, Alert)
- Creating dialogs, modals, or confirmation prompts (Dialog,
  AlertDialog)
- Building a sidebar or drawer (Sheet or custom with Separator)
- Displaying cards, stats, or KPI widgets (Card)
- Adding date pickers or calendar inputs (Calendar, Popover)
- Adding dropdowns or command palettes (DropdownMenu, Command)
- Building skeleton loading states (Skeleton)
- Any icon usage (lucide-react, consistent with shadcn/ui defaults)
- Any badge, tag, or status indicator (Badge)

#### Required MCP Workflow

For every UI task, the agent MUST follow this sequence:

1. **Query the MCP tool** for the relevant component(s):
   - Ask: "What shadcn/ui components are available for [use case]?"
   - Ask: "What are the props and variants for [component name]?"
   - Ask: "Show me the correct installation command for [component]"

2. **Install the component** if not already present using the MCP
   tool's provided CLI command (e.g.,
   `npx shadcn@latest add <component>`).
   Do NOT copy-paste component source manually.

3. **Use the component exactly as the MCP tool specifies** —
   respect the component's API, variants, and composition patterns.

4. **RTL compliance**: After retrieving the component from MCP,
   the agent MUST verify and apply RTL-compatible Tailwind variants
   (`rtl:` prefix) for any directional styles (padding, margin,
   text alignment, flex direction, icons positioning).

5. **Theme compliance**: The agent MUST use CSS variables defined
   by shadcn/ui (`bg-background`, `text-foreground`, `border`,
   `ring`, etc.) instead of hardcoded Tailwind color classes. This
   ensures dark/light mode works automatically.

#### Prohibited UI Patterns

The agent MUST NEVER do any of the following:

- Write a custom `<button>` element where shadcn/ui `<Button>` is
  available
- Write a custom modal/overlay where shadcn/ui `<Dialog>` is
  available
- Hardcode colors: NO `text-gray-500`, `bg-white`,
  `border-gray-200` etc. — use `text-muted-foreground`,
  `bg-background`, `border` (CSS var-backed)
- Use arbitrary Tailwind values (`w-[347px]`) unless absolutely
  unavoidable for a one-off layout need
- Install a third-party UI component library (Radix directly, MUI,
  Chakra, Ant Design, etc.) when a shadcn/ui equivalent exists
- Modify the source files of installed shadcn/ui components in
  `components/ui/` — extend via composition wrappers in
  `components/shared/` or `components/admin/`

#### Arabic / RTL Design Rules

When using any shadcn/ui component in Arabic (RTL) context:

- Wrap all page roots with `dir="rtl"` when Arabic locale is active
- Use `font-[Tajawal]` or equivalent Arabic-supporting font for
  all Arabic text
- For directional icons (arrows, chevrons), flip using
  `rtl:rotate-180` or `rtl:scale-x-[-1]`
- Ensure shadcn/ui Sheet opens from the correct side:
  `side="right"` for LTR, `side="left"` for RTL
- Numeric display: use Arabic-Indic numerals (٠١٢٣) in Arabic
  mode for invoice numbers, currency, and dates

**Rationale**: A single, consistent UI component library enforced
via MCP tooling prevents design drift, ensures RTL/theme
compliance, and eliminates redundant custom implementations.

#### UI Violation Consequence

If the agent implements a UI element without first consulting the
shadcn/ui MCP tool, the task output is considered non-compliant.
The agent MUST refactor the non-compliant code to use the correct
shadcn/ui component before the implementation task can be committed
(CONST-001 commit will be blocked until UI compliance is achieved).

### VII. Mandatory Firebase CLI Usage for All Firebase Operations

The AI agent MUST use the Firebase CLI as the authoritative tool
for all Firebase-related operations. No Firebase resource, rule,
index, or configuration should be created, modified, or deployed
through the Firebase Console UI during implementation. All changes
MUST be code-first, CLI-executed, and committed to the repository.

**Enforcement**: Hard Rule — the agent MUST NOT manually edit
Firebase config files or use the Firebase Console as a substitute
for CLI commands.

#### Firebase CLI Usage Triggers

The agent MUST use Firebase CLI commands for ALL of the following:

**Project & App Setup**:
- Initialize Firebase: `firebase init`
- Select features interactively (Firestore, Auth, Storage,
  Functions, Hosting, Emulators) — document every selected option
- Retrieve app config via: `firebase apps:sdkconfig web <appId>`
- NEVER hardcode Firebase config values — always use `.env`
  variables populated from CLI output

**Firestore Security Rules**:
- All rules MUST be written in `firestore.rules` (never edited in
  the Firebase Console)
- Deploy rules ONLY via: `firebase deploy --only firestore:rules`
- After every rule change, run emulators to verify:
  `firebase emulators:start --only firestore`

**Firestore Indexes**:
- All composite indexes MUST be defined in
  `firestore.indexes.json`
- Deploy via: `firebase deploy --only firestore:indexes`
- NEVER create indexes manually in the Firebase Console
- When Firestore throws a "missing index" error, add the index to
  `firestore.indexes.json` and deploy — not click-create in console

**Firebase Storage Rules**:
- All Storage rules MUST be written in `storage.rules`
- Deploy via: `firebase deploy --only storage`
- Rules MUST restrict uploads by: authenticated users only, file
  type (images: jpg/png/webp, receipts: jpg/png/pdf), max size
  5MB per file, and tenant-scoped paths
  (`/tenants/{tenantId}/...`)

**Firebase Cloud Functions**:
- Functions source lives in `functions/` directory
- Deploy ALL functions: `firebase deploy --only functions`
- Deploy specific function:
  `firebase deploy --only functions:<functionName>`
- NEVER deploy functions via zip upload in the console
- Before any deployment, run local emulation:
  `firebase emulators:start --only functions`
- Set config via: `firebase functions:config:set <key>=<value>`
- NEVER hardcode secrets in function source — use config or
  Secret Manager

**Firebase Hosting**:
- Deploy Vite build:
  `vite build && firebase deploy --only hosting`
- Configure `firebase.json` hosting rewrites for SPA routing:
  `{ "source": "**", "destination": "/index.html" }`
- Set custom headers for PWA (`Cache-Control`,
  `Service-Worker-Allowed`) in `firebase.json`

**Firebase Authentication**:
- Enable Auth providers via CLI or `firebase.json` (not Console
  toggles):
  `firebase auth:import` (for seeding admin users)
- Set custom claims via a one-time Cloud Function or Admin SDK
  script — document the exact CLI command:
  `node scripts/setAdminClaim.js --uid=<uid> --tenantId=<tenantId>`
- NEVER set custom claims manually through the Firebase Console

**Firebase Emulators (Local Development — MANDATORY)**:
- The agent MUST use Firebase Emulators for ALL local development
  and testing. No task should write to production Firebase during
  development.
- Start all relevant emulators:
  `firebase emulators:start --only auth,firestore,storage,functions`
- Emulator configuration MUST be present in `firebase.json` under
  `"emulators"` with explicit ports defined
- The Vite dev environment MUST connect to emulators when
  `VITE_USE_EMULATORS=true` is set:
  ```ts
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
  }
  ```
- Emulator data seeding via:
  `firebase emulators:start --import=./emulator-seed-data`
- Export emulator state:
  `firebase emulators:export ./emulator-seed-data`

**Environment & Secrets**:
- All Firebase config values flow through `.env.local` (gitignored)
  for local dev and environment variables for CI/CD
- The agent MUST NEVER commit `.env.local` or any file containing
  Firebase API keys, service account credentials, or function
  secrets
- `.env.example` MUST be kept up to date with all required variable
  keys (no values) after every phase that introduces new config

#### CLI Verification Steps

After every Firebase deployment in any phase, the agent MUST run
and output the result of:

- `firebase deploy --only <target> --debug` (confirm deployment)
- `firebase firestore:rules` (confirm rules are active)
- `firebase emulators:exec "npm run test"` (run emulator-based
  tests if present)

#### File Ownership Rules

These files are owned by the Firebase CLI and MUST NOT be manually
edited outside of their defined schema — always regenerate or
update via CLI:

- `.firebaserc` — managed by `firebase use`
- `firebase.json` — managed by `firebase init` and manual edits
  following the official JSON schema only
- `firestore.rules` — manually authored but deployed ONLY via CLI
- `firestore.indexes.json` — manually authored but deployed ONLY
  via CLI
- `storage.rules` — manually authored but deployed ONLY via CLI
- `.firebase/` — gitignored, never committed

#### Prohibited Firebase Patterns

The agent MUST NEVER:

- Use the Firebase Console to create Firestore collections,
  indexes, or rules — all MUST be code-first
- Write to production Firestore during local development
  (emulators are mandatory for dev)
- Hardcode Firebase project IDs, API keys, or service account JSON
  in source files
- Deploy untested rules directly to production without emulator
  validation
- Use `firebase deploy` (all targets) when only a specific target
  changed — always use `--only <target>` to prevent unintended
  deployments
- Commit service account JSON files (`serviceAccountKey.json`) to
  the repository under any circumstances

**Rationale**: Code-first Firebase management via CLI ensures all
infrastructure changes are version-controlled, reproducible, and
auditable. Console-based changes create undocumented drift and
break multi-tenant security guarantees.

#### Firebase Violation Consequence

Any Firebase resource created or modified outside the CLI (via
Console or direct SDK admin calls during development) is considered
undocumented infrastructure. The agent MUST audit and reconcile the
change back into the appropriate config file (`firestore.rules`,
`firestore.indexes.json`, `firebase.json`) and redeploy via CLI
before the implementation task can be committed (CONST-001 commit
will be blocked until Firebase CLI compliance is achieved).

## Commit Type Reference

Use the following conventional commit types:

| Type       | Usage                                           |
|------------|------------------------------------------------|
| `feat`     | New feature implementation                      |
| `fix`      | Bug fix within an implementation task            |
| `refactor` | Code restructure with no behavior change         |
| `style`    | UI/design-only change (no logic)                 |
| `test`     | Adding or fixing tests                           |
| `chore`    | Config, tooling, environment setup (Phase 1)     |
| `docs`     | Documentation only                               |

## Enforcement & Violation Policy

**Enforcement Level**: Hard Rule — the agent MUST NOT proceed
without complying.

If the agent completes an implementation task and does NOT commit:

- The `speckit.implementation` session is considered incomplete.
- The session MUST be restarted from the last committed task.
- No partial progress is accepted without a corresponding commit.

## Governance

- This constitution supersedes all ad-hoc commit practices within
  `speckit.implementation` runs.
- Amendments require: (1) documented rationale, (2) version bump,
  (3) updated Sync Impact Report at the top of this file.
- Version follows semantic versioning:
  - MAJOR: Backward-incompatible principle removals or redefinitions
  - MINOR: New principle added or materially expanded guidance
  - PATCH: Clarifications, wording, typo fixes
- All implementation PRs and reviews MUST verify compliance with
  these principles.
- Runtime development guidance lives in `CLAUDE.md` at repo root.

**Version**: 1.2.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-04
