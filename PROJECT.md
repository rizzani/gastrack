# GasTrack MVP — Project Overview & Repo Guide

---

## 1. Project Goal

Help a shop owner answer two critical questions at any moment:

1. **"How much gas do I actually have available to sell?"**
2. **"Who currently has my empty cylinders at their house?"**

---

## 2. Core Features (Must-Haves)

### A. Inventory Management (The "Live" Stock)

Tracks cylinder counts by **Size/Type** (e.g., 25lb, 50lb) and **State**:

| State    | Meaning                          |
|----------|----------------------------------|
| **Full** | Ready for sale                   |
| **Empty**| Ready to be refilled             |
| **Damaged** | Out of rotation (optional)    |

### B. Customer Directory

A simple list of buyers:

- **Required:** Name  
- **Optional:** Phone number, general notes  

### C. Movement Ledger (Recording Sales)

The "brain" of the app. Every transaction is a **Movement** that updates inventory automatically:

| Transaction | Description                      | Logic                     |
|-------------|----------------------------------|---------------------------|
| **Swap** (Standard) | User gives Full, gets Empty back | Full −1 \| Empty +1       |
| **Loan** (No Empty) | User gives Full, gets nothing back | Full −1 \| Customer Owed +1 |
| **Return** (Settle) | Customer returns borrowed empty   | Empty +1 \| Customer Owed −1 |

### D. Owed Empties List

Exception screen for people who haven’t returned cylinders:

- Who owes  
- What size they owe  
- How many they owe  

### E. History Timeline

Read-only log of every action (sales, returns, adjustments) for disputes and daily totals.

---

## 3. Logic Table: Inventory vs. State

| Transaction Type      | Full Count | Empty Count | Customer Owed |
|-----------------------|------------|-------------|---------------|
| **Standard Sale (Swap)** | −1       | +1          | 0 (no change) |
| **Loan (No Empty)**   | −1         | 0 (no change) | +1          |
| **Empty Return**      | 0 (no change) | +1       | −1            |
| **Restock (From Plant)** | +Qty    | −Qty        | 0             |

*Restock: assumes plant gives Full and takes Empty. Adjust if your flow differs.*

---

## 4. Technology Stack

| Layer        | Choice                              | Purpose                                  |
|-------------|-------------------------------------|------------------------------------------|
| **Frontend**| React Native + Expo + TypeScript    | Cross-platform, fast iteration           |
| **Routing** | Expo Router                         | File-based navigation                    |
| **Backend** | Appwrite                            | Auth, Database, real-time sync           |
| **Data**    | TanStack Query (React Query)        | Caching, offline-ready feel              |
| **Deploy**  | EAS Build                           | Android .aab for Play Store              |

---

## 5. Out of Scope

To stay focused, **do not** build:

- Cash/payment tracking (prices, taxes, revenue)
- Printed or digital receipts / SMS reminders
- Multi-staff accounts (single-user only)
- Serial-number tracking of individual bottles

---

## 6. Repo Structure

```
gastrack/
├── app/                         # Expo Router (file-based routes)
│   ├── _layout.tsx              # Root: AuthProvider, QueryClientProvider, tabs
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Bottom tabs
│   │   ├── index.tsx            # Dashboard: quick stock + owed summary
│   │   ├── inventory.tsx        # Live stock by size/state
│   │   ├── ledger.tsx           # Record: Swap, Loan, Return, Restock
│   │   ├── owed.tsx             # Owed empties only
│   │   └── history.tsx          # Read-only movement timeline
│   └── customers/
│       ├── _layout.tsx
│       ├── index.tsx            # Customer directory
│       ├── [id].tsx             # Customer detail
│       └── new.tsx              # Add customer
│
├── components/
│   ├── ui/                      # Button, Card, Input, Screen
│   ├── inventory/               # StockRow, StockSummary, RestockForm
│   ├── movements/               # MovementForm, MovementCard, MovementTypePicker
│   ├── customers/               # CustomerCard, CustomerForm, CustomerPicker
│   └── owed/                    # OwedRow
│
├── lib/
│   ├── appwrite.ts              # Client, DB, collections
│   ├── queryClient.ts           # TanStack Query config
│   ├── types.ts                 # Customer, CylinderType, Movement, etc.
│   └── movements.ts             # applyMovement logic (Full ±, Empty ±, Owed ±)
│
├── hooks/
│   ├── useInventory.ts
│   ├── useMovements.ts
│   ├── useCustomers.ts
│   ├── useOwed.ts
│   ├── useHistory.ts
│   └── useAuth.ts
│
├── constants/
│   ├── cylinderTypes.ts         # e.g. 25lb, 50lb
│   └── movementTypes.ts         # swap, loan, return, restock
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── app.json
├── package.json
├── tsconfig.json
├── eas.json
├── .env.example
├── .gitignore
└── PROJECT.md                   # This file
```

---

## 7. Screen Map

| Route                 | Screen        | Purpose                                    |
|-----------------------|---------------|--------------------------------------------|
| `/(tabs)`             | Dashboard     | Stock summary + owed count                 |
| `/(tabs)/inventory`   | Inventory     | Full / Empty / Damaged by size             |
| `/(tabs)/ledger`      | Movement Ledger| Record Swap, Loan, Return, Restock         |
| `/(tabs)/owed`        | Owed Empties  | Who owes what (exception list)             |
| `/(tabs)/history`     | History       | Full movement log                          |
| `/customers`          | Directory     | List all customers                         |
| `/customers/[id]`     | Customer      | Detail + linked movements                  |
| `/customers/new`      | New Customer  | Add customer                               |

---

## 8. Data Model (Appwrite)

### Collections

| Collection       | Purpose                                      |
|------------------|----------------------------------------------|
| `customers`      | Name, phone?, notes?                         |
| `cylinder_types` | id, label (e.g. "25lb", "50lb") — or in-app constants |
| `inventory`      | Per type: full, empty, damaged?              |
| `movements`      | type, cylinderTypeId, quantity, customerId?, createdAt, notes? |
| `customer_owed`  | customerId, cylinderTypeId, quantity — or derived from movements |

### Movement Types

- `swap` — Standard sale (Full out, Empty back)
- `loan` — Full out, no Empty back (customer owes)
- `return` — Empty back (reduces owed)
- `restock` — From plant: Full +Qty, Empty −Qty

---

## 9. Key Flows

1. **Record Swap:** Ledger → MovementForm (type=swap, customer, size, qty) → create movement → inventory: Full −1, Empty +1.  
2. **Record Loan:** Same form, type=loan → Full −1, customer_owed +1.  
3. **Record Return:** Form with type=return, customer, size, qty → Empty +1, customer_owed −1.  
4. **Restock:** RestockForm (size, qty) → Full +qty, Empty −qty.  
5. **Owed list:** `useOwed()` from `customer_owed` or derived from `movements` → OwedRow per (customer, size, count).  
6. **History:** `useHistory()` or `useMovements` → MovementCard list, read-only.

---

## 10. Config Files

| File           | Role                                                                 |
|----------------|----------------------------------------------------------------------|
| `app.json`     | Expo: name, slug, scheme, plugins, splash, icon                      |
| `package.json` | expo, expo-router, react-native, appwrite SDK, @tanstack/react-query |
| `tsconfig.json`| baseUrl, paths (`@/*`)                                               |
| `eas.json`     | EAS: development, preview, production; Android `buildType: "app-bundle"` |
| `.env.example` | `EXPO_PUBLIC_APPWRITE_*` endpoint, project, database, collections    |

---

*Last updated: Jan 2025*
