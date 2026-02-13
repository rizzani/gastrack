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

## 8. Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli` or use `npx`)
- EAS CLI (`npm install -g eas-cli`)
- Appwrite account ([cloud.appwrite.io](https://cloud.appwrite.io) or self-hosted)

### Initial Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd gastrack
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `EXPO_PUBLIC_APPWRITE_ENDPOINT` — Your Appwrite endpoint (e.g., `https://cloud.appwrite.io/v1`)
   - `EXPO_PUBLIC_APPWRITE_PROJECT` — Your Appwrite project ID
   - `EXPO_PUBLIC_APPWRITE_DATABASE` — Database ID (default: `gastrack`)
   - `EXPO_PUBLIC_APPWRITE_COLLECTION_*` — Collection IDs (optional; defaults match collection names)
   - `APPWRITE_API_KEY` — For setup script only (see below)

3. **Set up Appwrite backend:**
   
   **Option A: Automated setup (recommended)**
   ```bash
   # Ensure APPWRITE_API_KEY is set in .env
   npm run appwrite:setup
   ```
   This creates the database and all collections with proper attributes and indexes.

   **Option B: Manual setup**
   See `docs/APPWRITE_SETUP.md` for detailed instructions.

4. **Verify setup:**
   ```bash
   npm run view-collections
   ```
   This lists all collections to confirm they exist.

5. **Existing deployments (Add movement):**  
   If you ran `appwrite:setup` before the Add movement feature, add `add` to the `finance_transactions` collection’s `type` enum in Appwrite Console (Database → `finance_transactions` → Attributes → `type` → add `add`). New setups include it automatically.

6. **Start development server:**
   ```bash
   npm start
   # or
   npm run android  # for Android
   npm run ios      # for iOS
   ```

### Environment Variables

All environment variables are defined in `.env` (copy from `.env.example`). Only variables prefixed with `EXPO_PUBLIC_` are available in the React Native app.

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_APPWRITE_ENDPOINT` | Appwrite API endpoint | `https://cloud.appwrite.io/v1` |
| `EXPO_PUBLIC_APPWRITE_PROJECT` | Appwrite project ID | `6975cf5600297955323f` |
| `EXPO_PUBLIC_APPWRITE_DATABASE` | Database ID | `gastrack` |

#### Collection Variables (Optional)

These default to the collection name if not set:

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS` | `customers` | Customer directory |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_CYLINDER_TYPES` | `cylinder_types` | Cylinder type definitions |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_INVENTORY` | `inventory` | Stock counts by type/state |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_MOVEMENTS` | `movements` | Transaction history |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_OWED` | `customer_owed` | Outstanding empty cylinders |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_PRICES` | `prices` | Pricing information |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_FINANCE_TRANSACTIONS` | `finance_transactions` | Financial records |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_BALANCE` | `customer_balance` | Customer account balances |

#### Server-Only Variables

| Variable | Description | Usage |
|----------|-------------|-------|
| `APPWRITE_API_KEY` | API key with database/collection permissions | Used by `npm run appwrite:setup` only. **Never commit to git.** |

---

## 9. Data Model (Appwrite)

### Collections

Complete list of Appwrite collections used by the app:

| Collection ID | Purpose | Key Attributes |
|---------------|---------|----------------|
| `customers` | Customer directory | `userId`, `name`, `phone?`, `notes?` |
| `cylinder_types` | Cylinder type definitions | `id`, `label` (e.g., "25lb", "50lb") |
| `inventory` | Stock counts by type and state | `userId`, `cylinderTypeId`, `full`, `empty`, `damaged?` |
| `movements` | Transaction history | `userId`, `type`, `cylinderTypeId`, `quantity`, `customerId?`, `createdAt`, `notes?` |
| `customer_owed` | Outstanding empty cylinders | `userId`, `customerId`, `cylinderTypeId`, `quantity` |
| `prices` | Pricing information | Pricing data per cylinder type |
| `finance_transactions` | Financial records | Transaction details for accounting |
| `customer_balance` | Customer account balances | Balance tracking per customer |

### Collection Details

#### `customers`
- **Purpose:** Store customer information
- **Attributes:** `userId` (String, required), `name` (String, required), `phone` (String, optional), `notes` (String, optional)
- **Index:** `userId` for filtering by user

#### `inventory`
- **Purpose:** Track stock counts per cylinder type and state
- **Attributes:** `userId` (String, required), `cylinderTypeId` (String, required), `full` (Integer, default: 0), `empty` (Integer, default: 0), `damaged` (Integer, optional, default: 0)
- **Index:** Unique compound on `userId` + `cylinderTypeId`

#### `movements`
- **Purpose:** Record all transactions (sales, returns, restocks)
- **Attributes:** `userId` (String, required), `type` (String, required: `swap`/`loan`/`return`/`restock`), `cylinderTypeId` (String, required), `quantity` (Integer, required), `customerId` (String, optional), `createdAt` (String, required), `notes` (String, optional)
- **Index:** Compound on `userId` + `createdAt` (desc) for history

#### `customer_owed`
- **Purpose:** Track which customers owe empty cylinders
- **Attributes:** `userId` (String, required), `customerId` (String, required), `cylinderTypeId` (String, required), `quantity` (Integer, required)
- **Index:** Unique compound on `userId` + `customerId` + `cylinderTypeId`

### Movement Types

- `swap` — Standard sale (Full out, Empty back)
- `loan` — Full out, no Empty back (customer owes)
- `return` — Empty back (reduces owed)
- `restock` — From plant: Full +Qty, Empty −Qty

---

## 10. Key Flows

1. **Record Swap:** Ledger → MovementForm (type=swap, customer, size, qty) → create movement → inventory: Full −1, Empty +1.  
2. **Record Loan:** Same form, type=loan → Full −1, customer_owed +1.  
3. **Record Return:** Form with type=return, customer, size, qty → Empty +1, customer_owed −1.  
4. **Restock:** RestockForm (size, qty) → Full +qty, Empty −qty.  
5. **Owed list:** `useOwed()` from `customer_owed` or derived from `movements` → OwedRow per (customer, size, count).  
6. **History:** `useHistory()` or `useMovements` → MovementCard list, read-only.

---

## 11. Build & Release

### EAS Build Configuration

The project uses Expo Application Services (EAS) for building Android and iOS apps. Configuration is in `eas.json` with three profiles:

- **development** — Development client builds (APK for Android)
- **preview** — Internal testing builds (APK for Android, simulator for iOS)
- **production** — Play Store/App Store builds (AAB for Android)

### Prerequisites for Building

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure project (first time only):**
   ```bash
   eas build:configure
   ```

### Building for Android

#### Development Build
```bash
eas build --profile development --platform android
```
- Builds an APK with development client
- Useful for testing with Expo Dev Tools

#### Preview Build
```bash
eas build --profile preview --platform android
```
- Builds an APK for internal testing
- Can be shared with testers via download link

#### Production Build
```bash
eas build --profile production --platform android
```
- Builds an AAB (Android App Bundle) for Google Play Store
- Requires Google Play Console setup

### Building for iOS

#### Preview Build (Simulator)
```bash
eas build --profile preview --platform ios
```
- Builds for iOS Simulator
- Useful for testing on Mac

#### Production Build
```bash
eas build --profile production --platform ios
```
- Builds for App Store distribution
- Requires Apple Developer account and certificates

### Submitting to Stores

#### Android (Google Play)
1. **Prepare service account:**
   - Create a Google Cloud service account
   - Download JSON key file
   - Place at `./google-service-account.json` (add to `.gitignore`)
   - Grant Play Console access to the service account

2. **Submit:**
   ```bash
   eas submit --profile production --platform android
   ```

#### iOS (App Store)
1. **Configure App Store Connect:**
   - Set up app in App Store Connect
   - Configure app metadata

2. **Submit:**
   ```bash
   eas submit --profile production --platform ios
   ```

### Local Development

For local development without EAS:
```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator/device
npm run ios           # Run on iOS simulator/device
```

### Build Status

Check build status:
```bash
eas build:list
```

View build logs:
```bash
eas build:view [build-id]
```

---

## 12. Config Files

| File           | Role                                                                 |
|----------------|----------------------------------------------------------------------|
| `app.json`     | Expo: name, slug, scheme, plugins, splash, icon                      |
| `package.json` | expo, expo-router, react-native, appwrite SDK, @tanstack/react-query |
| `tsconfig.json`| baseUrl, paths (`@/*`)                                               |
| `eas.json`     | EAS: development, preview, production; Android `buildType: "app-bundle"` |
| `.env.example` | `EXPO_PUBLIC_APPWRITE_*` endpoint, project, database, collections    |

---

---

## 13. Additional Resources

- **Appwrite Setup Guide:** See `docs/APPWRITE_SETUP.md` for detailed backend configuration
- **Expo Documentation:** [docs.expo.dev](https://docs.expo.dev)
- **EAS Build Docs:** [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)
- **Appwrite Docs:** [appwrite.io/docs](https://appwrite.io/docs)

---

*Last updated: January 2026*
