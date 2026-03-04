# Contract: Firestore Security Rules

**Source Requirements**: TC-011, FR-014, FR-022, FR-025, FR-040

## Overview

All Firestore collections are scoped under `tenants/{tenantId}/`. Security rules enforce tenant isolation via `request.auth.token.tenantId` custom claim and role-based access via `request.auth.token.role`.

## Authentication Model

- **Custom Claims**: `{ tenantId: string, role: 'admin' | 'customer' }`
- Claims set exclusively by Cloud Functions (Admin SDK)
- Token refresh required after claims are set

## Helper Functions

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isTenantMember(tenantId) {
  return isAuthenticated() && request.auth.token.tenantId == tenantId;
}

function isAdmin(tenantId) {
  return isTenantMember(tenantId) && request.auth.token.role == 'admin';
}

function isCustomer(tenantId) {
  return isTenantMember(tenantId) && request.auth.token.role == 'customer';
}
```

## Rules by Collection

### settings/{settingId}
- **Read**: Any tenant member
- **Write**: Admin only

### services/{serviceId}
- **Read**: Any tenant member
- **Create/Update/Delete**: Admin only

### categories/{categoryId}
- **Read**: Any tenant member
- **Create/Update/Delete**: Admin only

### reservations/{reservationId}
- **Read**: Admin (all) or Customer (own only, via `resource.data.customerId == request.auth.uid`)
- **Create**: Customer only, must set `customerId == request.auth.uid`
- **Update/Delete**: Admin only

### invoices/{invoiceId}
- **Read**: Admin (all) or Customer (own only)
- **Create**: Admin only
- **Update**: Admin only; if `status == 'issued'`, only allow transition to `cancelled`
- **Delete**: Admin only, only if `status == 'draft'`

### counters/{counterId}
- **Read/Write**: Admin only (accessed via Cloud Function transaction)

### users/{userId}
- **Read**: Admin (all) or own profile (`request.auth.uid == userId`)
- **Create**: Tenant member, own UID only
- **Update**: Admin (all) or own profile (cannot modify `role` or `tenantId` fields)
- **Delete**: Admin only

### journalEntries/{entryId}, expenses/{expenseId}, accounts/{accountId}, assets/{assetId}
- **Read/Write**: Admin only

### payments/{paymentId}
- **Read**: Admin (all) or Customer (own only)
- **Create/Update**: Admin only (or Cloud Function for webhook updates)

### slotBookings/{slotId}
- **Read**: Any tenant member
- **Create**: Customer (via transaction, `currentBookings <= maxCapacity`)
- **Update**: Tenant member (via transaction, `currentBookings <= maxCapacity`)

## Default Rule

```javascript
match /{document=**} {
  allow read, write: if false;
}
```

All paths not explicitly matched are denied.

## Immutability Constraints

- **Issued invoices**: Cannot modify any field except `status` (and only to `cancelled`)
- **System accounts**: `isSystem == true` accounts cannot be deleted
- **Journal entries**: Once created, entries are immutable (no updates or deletes)
