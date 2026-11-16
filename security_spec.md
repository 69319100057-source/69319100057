# Security Specification & Invariants

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document under `/users/{userId}`, `/users/{userId}/transactions/{transactionId}`, and `/users/{userId}/budgets/{budgetId}` belongs exclusively to the authenticated, email-verified user whose `request.auth.uid == userId`.
2. **Parent Existence Gate**: A `Transaction` or `MonthlyBudget` document cannot be created unless its parent `/users/{userId}` document exists in Firestore.
3. **Immutable Ownership & Creation Timestamps**: `uid`, `userId`, and `createdAt` can never change after document creation. `createdAt` and `updatedAt` must always equal `request.time`.
4. **Strict Payload Keys & Types**: Shadow/ghost fields (such as `isAdmin`, `role`, `verified`) are rejected on both `create` and `update` via `hasAll`/`hasOnly` and `affectedKeys().hasOnly(...)`.
5. **Bounded Sizes & Numeric Ranges**: All strings have explicit `size()` bounds; IDs match `^[a-zA-Z0-9_\-]+$`; transaction `amount` must be strictly positive (`> 0` and `<= 1000000000`); `date` (`YYYY-MM-DD`) and `monthKey` (`YYYY-MM`) match strict regexes and `monthKey` must match the `YYYY-MM` prefix of `date`.
6. **Verified Email Requirement**: All writes require `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Reading `/users/u1/transactions` or writing without `request.auth`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create a transaction.
3. **Cross-User Read/List**: User `u2` attempting `get` or `list` on `/users/u1/transactions`.
4. **UID Spoofing on Create**: User `u1` creating `/users/u1/transactions/tx1` with `userId: "u2"`.
5. **Shadow Field Injection on Create**: User `u1` creating `/users/u1` with an extra `"role": "admin"` ghost field.
6. **Shadow Field Injection on Update**: User `u1` updating `/users/u1/transactions/tx1` with an extra `"approved": true` field.
7. **Immutable Field Mutation**: User `u1` updating `/users/u1/transactions/tx1` to alter `createdAt` or `userId`.
8. **Client-Forged Timestamp**: User `u1` creating a transaction with a past `createdAt` timestamp instead of `request.time`.
9. **Negative or Zero Amount**: User `u1` creating a transaction with `amount: -500` or `amount: 0`.
10. **Invalid Enum / Category Injection**: User `u1` creating a transaction with `type: "transfer"` or `paymentMethod: "crypto"`.
11. **Oversized String / Resource Poisoning**: User `u1` submitting a 10KB `note` string or an invalid/oversized `transactionId` path variable (`tx$invalid!`).
12. **Date / MonthKey Mismatch**: User `u1` creating a transaction with `date: "2026-11-15"` and `monthKey: "2026-01"` to corrupt monthly summaries.
