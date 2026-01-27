# Appwrite Setup for GasTrack

This guide walks through creating the Appwrite project, database, and collections so the app can reach them. Do this once in [Appwrite Console](https://cloud.appwrite.io) (or your self‑hosted instance).

---

## Option A: Setup script (recommended)

1. **Create a project** in [Appwrite Console](https://cloud.appwrite.io) and copy the **Project ID** into `.env` as `EXPO_PUBLIC_APPWRITE_PROJECT`.
2. In the project: **API Keys** → **Create API Key** — name it e.g. `gastrack-setup`, scopes: **databases** (read, write), **collections** (read, write), **attributes** (read, write). Copy the secret into `.env` as `APPWRITE_API_KEY` (do not commit).
3. In `.env` set `EXPO_PUBLIC_APPWRITE_ENDPOINT` and optionally `EXPO_PUBLIC_APPWRITE_DATABASE` (default `gastrack`). Copy from `.env.example` if needed.
4. Run:
   ```bash
   npm run appwrite:setup
   ```
   This creates the database `gastrack` and the collections (`customers`, `inventory`, `movements`, `customer_owed`, `prices`, `finance_transactions`, `customer_balance`) with attributes and recommended indexes. If the database or a collection already exists, it is skipped.
5. Ensure `EXPO_PUBLIC_APPWRITE_DATABASE=gastrack` (or your chosen ID) in `.env`.

---

## Option B: Manual in Console

### 1. Create Project

1. Open [Appwrite Console](https://cloud.appwrite.io) and sign in.
2. **Create project** → name: `GasTrack` (or any name).
3. Copy the **Project ID** (from project **Settings** → **General**) into `.env`:
   ```env
   EXPO_PUBLIC_APPWRITE_PROJECT=your-project-id
   ```
4. Set **Endpoint** in `.env` (Cloud default):
   ```env
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   ```

---

### 2. Create Database

1. In the project: **Databases** → **Create database**.
2. Name: `GasTrack`; Database ID: `gastrack` (or any; you’ll use this in `.env`).
3. Copy the **Database ID** into `.env`:
   ```env
   EXPO_PUBLIC_APPWRITE_DATABASE=gastrack
   ```

---

### 3. Collections and Attributes

Create each collection under the `GasTrack` database. Use the **Collection ID** exactly as below so it matches `.env.example`.

### 3.1 `customers` (Collection ID: `customers`)

| Attribute | Type   | Required | Size / Constraints |
|----------|--------|----------|--------------------|
| `userId` | String | Yes      | 36 (Appwrite user ID) |
| `name`   | String | Yes      | 1–2048             |
| `phone`  | String | No       | 0–512              |
| `notes`  | String | No       | 0–65535            |

**Index (recommended):** `userId` for filtering by user.

**Permissions:** Add `create`, `read`, `update`, `delete` for `any` (or your auth role) so the app and Console can manage docs.

---

### 3.2 `inventory` (Collection ID: `inventory`)

One document per `(userId, cylinderTypeId)`. Counts are integers.

| Attribute        | Type    | Required | Default | Constraints |
|-----------------|---------|----------|---------|-------------|
| `userId`        | String  | Yes      | —       | 36 (Appwrite user ID) |
| `cylinderTypeId`| String  | Yes      | —       | —           |
| `full`          | Integer | Yes      | 0       | Min: 0      |
| `empty`         | Integer | Yes      | 0       | Min: 0      |
| `damaged`       | Integer | No       | 0       | Min: 0      |

**Index (recommended):** Unique compound on `userId` + `cylinderTypeId` so you have at most one doc per user per cylinder type.

**Permissions:** Same as `customers` (e.g. `any` for create/read/update/delete).

---

### 3.3 `movements` (Collection ID: `movements`)

| Attribute        | Type    | Required | Notes                                      |
|-----------------|---------|----------|--------------------------------------------|
| `userId`        | String  | Yes      | 36 (Appwrite user ID) |
| `type`          | String  | Yes      | One of: `swap`, `loan`, `return`, `restock`|
| `cylinderTypeId`| String  | Yes      | —                                          |
| `quantity`      | Integer | Yes      | —                                          |
| `customerId`    | String  | No       | For swap/loan/return                       |
| `notes`         | String  | No       | 0–65535                                    |
| `createdAt`     | String  | Yes      | App sets on create: `new Date().toISOString()` |

**Index (recommended):** Compound on `userId` + `createdAt` (desc) for history; optional: `userId` + `type` if you filter by type.

**Permissions:** Same as above.

---

### 3.4 `customer_owed` (Collection ID: `customer_owed`)

One document per `(userId, customerId, cylinderTypeId)`. Use upsert in the app: find by `userId` + `customerId` + `cylinderTypeId`, then update quantity or create.

| Attribute        | Type    | Required |
|-----------------|---------|----------|
| `userId`        | String  | Yes      | 36 (Appwrite user ID) |
| `customerId`    | String  | Yes      |
| `cylinderTypeId`| String  | Yes      |
| `quantity`      | Integer | Yes      |

**Index (recommended):** Unique compound on `userId` + `customerId` + `cylinderTypeId` to speed up upsert lookups and enforce one doc per user per customer per cylinder type.

**Permissions:** Same as above.

---

### 4. Permissions (summary)

For each collection, in **Settings** → **Permissions**, add for `any` (or your role):

- `create`
- `read`
- `update`
- `delete`

For development you can use `any`; for production, replace with specific roles/users.

---

### 5. Env and sanity check

1. Copy `.env.example` to `.env` and set:
   - `EXPO_PUBLIC_APPWRITE_ENDPOINT`
   - `EXPO_PUBLIC_APPWRITE_PROJECT`
   - `EXPO_PUBLIC_APPWRITE_DATABASE`
   - `EXPO_PUBLIC_APPWRITE_COLLECTION_*` (optional; defaults match the IDs above).

2. Run `npm install` and `npx expo start`. The app uses `lib/appwrite.ts` and should be able to list at least one collection (e.g. `customers`) without crashing. A minimal test: `db.listDocuments(IDs.database, IDs.customers)`.

---

### 6. Collection IDs (for `.env`)

Default values used by `lib/env.ts` and `lib/appwrite.ts`:

| Env variable                               | Default      |
|--------------------------------------------|-------------|
| `EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS` | `customers` |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_INVENTORY` | `inventory` |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_MOVEMENTS` | `movements` |
| `EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_OWED` | `customer_owed` |

If you choose different Collection IDs in the Console, set these env vars accordingly.
