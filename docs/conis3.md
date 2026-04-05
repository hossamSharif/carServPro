

Constitution ID: CONST-003
Name: Mandatory Firebase CLI Usage for All Firebase Operations
Scope: Global — applies to any task involving Firebase configuration, 
       deployment, rules, indexes, functions, or environment setup
Enforcement: Hard Rule (agent MUST NOT manually edit Firebase config files 
             or use the Firebase Console as a substitute for CLI commands)

---

## RULE

The AI agent MUST use the Firebase CLI as the authoritative tool for all 
Firebase-related operations. No Firebase resource, rule, index, or 
configuration should be created, modified, or deployed through the Firebase 
Console UI during implementation. All changes must be code-first, CLI-executed, 
and committed to the repository.

---

## MANDATORY CLI USAGE TRIGGERS

The agent MUST use Firebase CLI commands for ALL of the following:

### Project & App Setup
  - Initialize Firebase in the project:
    firebase init
  - Select features interactively (Firestore, Auth, Storage, Functions, Hosting, 
    Emulators) — document every selected option in a comment
  - Add Firebase config to the app — retrieve via:
    firebase apps:sdkconfig web <appId>
  - Never hardcode Firebase config values — always use .env variables 
    populated from CLI output

### Firestore Security Rules
  - All security rules MUST be written in `firestore.rules` file (never 
    edited in the Firebase Console)
  - Deploy rules ONLY via:
    firebase deploy --only firestore:rules
  - After every rule change in any phase, the agent MUST run:
    firebase emulators:start --only firestore
    and verify the rules pass before deploying

### Firestore Indexes
  - All composite indexes MUST be defined in `firestore.indexes.json`
  - Deploy indexes via:
    firebase deploy --only firestore:indexes
  - Never create indexes manually in the Firebase Console
  - When Firestore throws a "missing index" error, the agent MUST add the 
    index to `firestore.indexes.json` and deploy — not click-create in console

### Firebase Storage Rules
  - All Storage rules MUST be written in `storage.rules`
  - Deploy via:
    firebase deploy --only storage
  - Rules must restrict uploads by: authenticated users only, file type 
    (images: jpg/png/webp, receipts: jpg/png/pdf), max size 5MB per file, 
    and tenant-scoped paths (`/tenants/{tenantId}/...`)

### Firebase Cloud Functions
  - Functions source lives in `functions/` directory
  - Deploy ALL functions:
    firebase deploy --only functions
  - Deploy a specific function:
    firebase deploy --only functions:<functionName>
  - NEVER deploy functions via zip upload in the console
  - Before any function deployment, run local emulation:
    firebase emulators:start --only functions
  - Set function environment config via:
    firebase functions:config:set <key>=<value>
  - NEVER hardcode secrets in function source — use config or Secret Manager

### Firebase Hosting
  - Deploy the Vite build to Firebase Hosting:
    vite build && firebase deploy --only hosting
  - Configure `firebase.json` hosting rewrites for SPA routing:
    { "source": "**", "destination": "/index.html" }
  - Set custom headers for PWA (`Cache-Control`, `Service-Worker-Allowed`) 
    in `firebase.json`

### Firebase Authentication
  - Enable Auth providers via CLI or `firebase.json` (not Console toggles):
    firebase auth:import  (for seeding admin users)
  - Set custom claims on admin users via a one-time Cloud Function or 
    Admin SDK script — document the exact CLI command to run:
    node scripts/setAdminClaim.js --uid=<uid> --tenantId=<tenantId>
  - Never set custom claims manually through the Firebase Console

### Firebase Emulators (Local Development — MANDATORY)
  - The agent MUST use Firebase Emulators for ALL local development and 
    testing. No task should write to production Firebase during development.
  - Start all relevant emulators:
    firebase emulators:start --only auth,firestore,storage,functions
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
  - Emulator data seeding MUST be done via:
    firebase emulators:start --import=./emulator-seed-data
  - Export emulator state for repeatable testing:
    firebase emulators:export ./emulator-seed-data

### Environment & Secrets
  - All Firebase config values flow through `.env.local` (gitignored) for 
    local dev and environment variables for CI/CD
  - The agent MUST NEVER commit `.env.local` or any file containing 
    Firebase API keys, service account credentials, or function secrets
  - `.env.example` MUST be kept up to date with all required variable keys 
    (no values) after every phase that introduces new config

---

## REQUIRED CLI VERIFICATION STEPS

After every Firebase deployment in any phase, the agent MUST run and 
output the result of:

  firebase deploy --only <target> --debug   # confirm deployment success
  firebase firestore:rules                  # confirm rules are active
  firebase emulators:exec "npm run test"    # run emulator-based tests if present

---

## FILE OWNERSHIP RULES

These files are owned by the Firebase CLI and MUST NOT be manually edited 
outside of their defined schema — always regenerate or update via CLI:

  - `.firebaserc`         → managed by `firebase use`
  - `firebase.json`       → managed by `firebase init` and manual edits 
                            following the official JSON schema only
  - `firestore.rules`     → manually authored but deployed ONLY via CLI
  - `firestore.indexes.json` → manually authored but deployed ONLY via CLI
  - `storage.rules`       → manually authored but deployed ONLY via CLI
  - `.firebase/`          → gitignored, never committed

---

## PROHIBITED PATTERNS

The agent MUST NEVER:
  - Use the Firebase Console to create Firestore collections, indexes, or 
    rules — all must be code-first
  - Write to production Firestore during local development (emulators are 
    mandatory for dev)
  - Hardcode Firebase project IDs, API keys, or service account JSON in 
    source files
  - Deploy untested rules directly to production without emulator validation
  - Use `firebase deploy` (all targets) when only a specific target changed — 
    always use `--only <target>` to prevent unintended deployments
  - Commit service account JSON files (`serviceAccountKey.json`) to the 
    repository under any circumstances

---

## VIOLATION CONSEQUENCE

Any Firebase resource created or modified outside the CLI (via Console or 
direct SDK admin calls during development) is considered undocumented 
infrastructure. The agent MUST audit and reconcile the change back into 
the appropriate config file (`firestore.rules`, `firestore.indexes.json`, 
`firebase.json`) and redeploy via CLI before the implementation task 
can be committed (CONST-001 commit will be blocked until Firebase CLI 
compliance is achieved).