# Contract: Cloud Functions

**Source Requirements**: TC-012, TC-010, FR-022, FR-044

## Overview

Minimal set of Firebase Cloud Functions required by the architecture. All functions run on Node.js 20 with Firebase Functions v2.

---

## 1. Payment Webhook Handler

**Endpoint**: HTTPS trigger (public)
**Path**: `POST /paymentWebhook`
**Source**: TC-012, FR-044, FR-045, FR-047

### Request

Incoming POST from payment gateway (Moyasar, Tap, or HyperPay).

**Headers (Moyasar)**:
- `x-moyasar-signature`: HMAC-SHA256 hex digest

**Body (Moyasar example)**:
```json
{
  "id": "event-uuid",
  "type": "payment_paid",
  "secret_token": "merchant-token",
  "data": {
    "id": "payment-uuid",
    "status": "paid",
    "amount": 10000,
    "currency": "SAR",
    "metadata": { "invoiceId": "inv-123", "tenantId": "tenant-1" }
  }
}
```

### Processing

1. Verify webhook signature using gateway-specific method
2. Extract `tenantId` and `invoiceId` from metadata
3. Validate payment amount against invoice `grandTotal`
4. Create payment document in `tenants/{tenantId}/payments/`
5. Update invoice `paymentStatus` in `tenants/{tenantId}/invoices/{invoiceId}`
6. Auto-create journal entry if payment status becomes `paid`

### Response

- `200 OK` on success
- `401 Unauthorized` on signature failure
- `400 Bad Request` on invalid payload

### Idempotency

Check if payment with `gatewayTransactionId` already exists before processing.

---

## 2. User Claims Setter (Auth Trigger)

**Trigger**: `auth.user().onCreate()`
**Source**: TC-011, custom claims architecture

### Processing

1. Triggered on new Firebase Auth user creation
2. Read pending registration doc from `pendingRegistrations/{uid}`
3. Set custom claims: `{ tenantId, role: 'customer' }`
4. Create user profile doc at `tenants/{tenantId}/users/{uid}`
5. Delete pending registration doc

### Error Handling

- Log warning if no pending registration doc (manual/admin-created user)
- Retry on Firestore write failure (Cloud Functions auto-retry)

---

## 3. Admin Role Provisioner (Callable)

**Trigger**: `https.onCall()`
**Path**: `setAdminRole`
**Source**: FR-013 (admin provisioning)

### Request

```typescript
{
  targetUid: string;      // UID of user to promote
  role: 'admin' | 'customer';
  tenantId: string;
}
```

### Authorization

- Caller must have `role == 'admin'` in custom claims
- Caller's `tenantId` must match request `tenantId` (no cross-tenant)

### Processing

1. Validate caller is admin for the same tenant
2. Set custom claims on target user: `{ tenantId, role }`
3. Return `{ success: true }`

### Response

- `{ success: true }` on success
- `permission-denied` if caller is not admin or cross-tenant
- `invalid-argument` if role is invalid

---

## 4. Invoice Number Generator (Callable)

**Trigger**: `https.onCall()`
**Path**: `generateInvoiceNumber`
**Source**: TC-010, FR-026

### Request

```typescript
{
  invoiceId: string;      // ID of the draft invoice to issue
}
```

### Authorization

- Caller must have `role == 'admin'` in custom claims

### Processing

1. Validate caller is admin
2. Run Firestore transaction on `tenants/{tenantId}/counters/invoiceCounter`:
   - Read current counter
   - If year changed, reset to 1
   - Increment counter
   - Write updated counter
3. Format: `INV-{year}-{nnnn}` (4-digit zero-padded)
4. Update invoice document with `invoiceNumber`, `status: 'issued'`, `issuedAt`
5. Return `{ invoiceNumber }`

### Atomicity Guarantee

Transaction ensures no duplicate or gap in numbering even under concurrent admin usage.

---

## 5. User Deactivation (Callable)

**Trigger**: `https.onCall()`
**Path**: `deactivateUser`
**Source**: FR-022

### Request

```typescript
{
  targetUid: string;      // UID of customer to deactivate
}
```

### Authorization

- Caller must have `role == 'admin'`
- Caller's `tenantId` must match target user's `tenantId`

### Processing

1. Disable Firebase Auth account via `auth().updateUser(targetUid, { disabled: true })`
2. Update `tenants/{tenantId}/users/{targetUid}` → `{ active: false }`
3. Return `{ success: true }`

### Business Rules

- Deactivated user's reservation history remains visible to admin
- User can no longer log in or create new reservations

---

## Configuration

All secrets stored in Firebase Functions config (not in Firestore):

```
functions.config().moyasar.webhook_secret
functions.config().moyasar.secret_key
functions.config().tap.secret_key
functions.config().hyperpay.access_token
functions.config().hyperpay.entity_id
functions.config().hyperpay.notification_key
```
