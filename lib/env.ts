/**
 * Appwrite env — read from .env via Expo (EXPO_PUBLIC_* inlined at build).
 * Copy .env.example to .env and set your Appwrite project values.
 */

export const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? '';
export const APPWRITE_PROJECT = process.env.EXPO_PUBLIC_APPWRITE_PROJECT ?? '';
export const APPWRITE_DATABASE = process.env.EXPO_PUBLIC_APPWRITE_DATABASE ?? '';
export const APPWRITE_COLLECTION_CUSTOMERS =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS ?? 'customers';
export const APPWRITE_COLLECTION_CYLINDER_TYPES =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CYLINDER_TYPES ?? 'cylinder_types';
export const APPWRITE_COLLECTION_INVENTORY =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_INVENTORY ?? 'inventory';
export const APPWRITE_COLLECTION_MOVEMENTS =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_MOVEMENTS ?? 'movements';
export const APPWRITE_COLLECTION_CUSTOMER_OWED =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_OWED ?? 'customer_owed';
export const APPWRITE_COLLECTION_PRICES =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_PRICES ?? 'prices';
export const APPWRITE_COLLECTION_FINANCE_TRANSACTIONS =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_FINANCE_TRANSACTIONS ?? 'finance_transactions';
export const APPWRITE_COLLECTION_CUSTOMER_BALANCE =
  process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_BALANCE ?? 'customer_balance';
