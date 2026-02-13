/**
 * Appwrite setup script — creates database, collections, attributes, indexes.
 * Run: npm run appwrite:setup
 * Requires: .env with APPWRITE_API_KEY, EXPO_PUBLIC_APPWRITE_ENDPOINT, EXPO_PUBLIC_APPWRITE_PROJECT, EXPO_PUBLIC_APPWRITE_DATABASE
 */

require('dotenv').config();
const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE || 'gastrack';
const API_KEY = process.env.APPWRITE_API_KEY;

const COLLECTION_IDS = {
  customers: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS || 'customers',
  inventory: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_INVENTORY || 'inventory',
  movements: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_MOVEMENTS || 'movements',
  customer_owed: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_OWED || 'customer_owed',
  prices: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_PRICES || 'prices',
  finance_transactions: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_FINANCE_TRANSACTIONS || 'finance_transactions',
  customer_balance: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_BALANCE || 'customer_balance',
};

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing required env vars:');
  console.error('  EXPO_PUBLIC_APPWRITE_ENDPOINT:', ENDPOINT || 'MISSING');
  console.error('  EXPO_PUBLIC_APPWRITE_PROJECT:', PROJECT_ID || 'MISSING');
  console.error('  APPWRITE_API_KEY:', API_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

async function createDatabase() {
  try {
    await databases.create(DATABASE_ID, 'GasTrack');
    console.log(`✓ Database "${DATABASE_ID}" created`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`- Database "${DATABASE_ID}" already exists`);
    } else {
      throw err;
    }
  }
}

async function createCollection(collectionId, name) {
  try {
    await databases.createCollection(DATABASE_ID, collectionId, name, [
      Permission.create(Role.any()),
      Permission.read(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ]);
    console.log(`✓ Collection "${collectionId}" created`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`- Collection "${collectionId}" already exists`);
    } else {
      throw err;
    }
  }
}

async function createAttribute(collectionId, key, type, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const method = `create${type}Attribute`;
      const required = options.required !== undefined ? options.required : false;
      
      if (type === 'String') {
        // String attributes: createStringAttribute(databaseId, collectionId, key, size, required, default, array)
        const size = options.size || 255;
        await databases[method](
          DATABASE_ID,
          collectionId,
          key,
          size,
          required,
          options.default || null,
          options.array || false
        );
      } else if (type === 'Integer') {
        // Integer attributes: createIntegerAttribute(databaseId, collectionId, key, required, min, max, default, array)
        // Note: Cannot set default value for required attributes
        const defaultVal = required ? null : (options.default !== undefined ? options.default : null);
        await databases[method](
          DATABASE_ID,
          collectionId,
          key,
          required,
          options.min !== undefined ? options.min : null,
          options.max !== undefined ? options.max : null,
          defaultVal,
          options.array || false
        );
      } else if (type === 'Float') {
        // Float: createFloatAttribute(databaseId, collectionId, key, required, min, max, default, array)
        const defaultVal = required ? null : (options.default !== undefined ? options.default : null);
        await databases[method](
          DATABASE_ID,
          collectionId,
          key,
          required,
          options.min !== undefined ? options.min : null,
          options.max !== undefined ? options.max : null,
          defaultVal,
          options.array || false
        );
      } else if (type === 'Enum') {
        // Enum: createEnumAttribute(databaseId, collectionId, key, elements, required, default, array)
        const elements = options.elements || [];
        const defaultVal = options.default ?? null;
        await databases[method](
          DATABASE_ID,
          collectionId,
          key,
          elements,
          required,
          defaultVal,
          options.array || false
        );
      } else {
        // For other types, try the generic approach
        await databases[method](DATABASE_ID, collectionId, key, required, options);
      }
      console.log(`  ✓ Attribute "${key}" (${type})`);
      return; // Success, exit retry loop
    } catch (err) {
      if (err.code === 409) {
        console.log(`  - Attribute "${key}" already exists`);
        return; // Already exists, no need to retry
      } else if (err.message && err.message.includes('fetch failed') && attempt < retries) {
        // Network error, retry after a delay
        const delay = attempt * 2000; // 2s, 4s, 6s
        console.log(`  ⚠ Network error creating "${key}", retrying in ${delay/1000}s... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry
      } else {
        // Other error or max retries reached
        console.error(`  ✗ Failed to create attribute "${key}" (${type}):`, err.message);
        if (err.code) console.error(`    Error code: ${err.code}`);
        if (err.type) console.error(`    Error type: ${err.type}`);
        throw err;
      }
    }
  }
}

async function waitForAttributes(collectionId) {
  // Wait for all attributes to be ready before creating indexes
  let allReady = false;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max wait
  
  while (!allReady && attempts < maxAttempts) {
    try {
      const attributes = await databases.listAttributes(DATABASE_ID, collectionId);
      
      allReady = attributes.attributes.every(attr => attr.status === 'available');
      
      if (!allReady) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
      }
    } catch (err) {
      if (err.message && err.message.includes('fetch failed') && attempts < maxAttempts - 1) {
        // Network error, retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        continue;
      }
      // If we can't check after retries, assume ready and continue
      console.log(`  ⚠ Warning: Could not verify attribute status, proceeding anyway`);
      allReady = true;
    }
  }
  
  if (!allReady && attempts >= maxAttempts) {
    console.log(`  ⚠ Warning: Some attributes may not be ready, proceeding anyway`);
  }
}

async function createIndex(collectionId, key, type, attributes, orders = null, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (orders && orders.length) {
        await databases.createIndex(DATABASE_ID, collectionId, key, type, attributes, orders);
      } else {
        await databases.createIndex(DATABASE_ID, collectionId, key, type, attributes);
      }
      console.log(`  ✓ Index "${key}"`);
      return; // Success, exit retry loop
    } catch (err) {
      if (err.code === 409) {
        console.log(`  - Index "${key}" already exists`);
        return; // Already exists, no need to retry
      } else if (err.message && err.message.includes('fetch failed') && attempt < retries) {
        // Network error, retry after a delay
        const delay = attempt * 2000; // 2s, 4s, 6s
        console.log(`  ⚠ Network error creating index "${key}", retrying in ${delay/1000}s... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry
      } else {
        // Other error or max retries reached
        console.error(`  ✗ Failed to create index "${key}":`, err.message);
        if (err.code) console.error(`    Error code: ${err.code}`);
        throw err;
      }
    }
  }
}

async function setupCustomers() {
  await createCollection(COLLECTION_IDS.customers, 'Customers');
  await createAttribute(COLLECTION_IDS.customers, 'userId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between attributes
  await createAttribute(COLLECTION_IDS.customers, 'name', 'String', { required: true, size: 2048 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.customers, 'phone', 'String', { required: false, size: 512 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.customers, 'notes', 'String', { required: false, size: 65535 });
  await waitForAttributes(COLLECTION_IDS.customers);
  await createIndex(COLLECTION_IDS.customers, 'userId', 'key', ['userId']);
}

async function setupInventory() {
  await createCollection(COLLECTION_IDS.inventory, 'Inventory');
  await createAttribute(COLLECTION_IDS.inventory, 'userId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between attributes
  await createAttribute(COLLECTION_IDS.inventory, 'cylinderTypeId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.inventory, 'full', 'Integer', { required: true, min: 0 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.inventory, 'empty', 'Integer', { required: true, min: 0 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.inventory, 'damaged', 'Integer', { required: false, min: 0, default: 0 });
  await waitForAttributes(COLLECTION_IDS.inventory);
  await createIndex(COLLECTION_IDS.inventory, 'userId_cylinderTypeId', 'unique', ['userId', 'cylinderTypeId']);
}

async function setupMovements() {
  await createCollection(COLLECTION_IDS.movements, 'Movements');
  await createAttribute(COLLECTION_IDS.movements, 'userId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between attributes
  await createAttribute(COLLECTION_IDS.movements, 'type', 'String', { required: true, size: 20 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.movements, 'cylinderTypeId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.movements, 'quantity', 'Integer', { required: true, min: 1 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.movements, 'customerId', 'String', { required: false, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.movements, 'notes', 'String', { required: false, size: 65535 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.movements, 'addKind', 'String', { required: false, size: 10 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.movements, 'createdAt', 'String', { required: true, size: 50 });
  await waitForAttributes(COLLECTION_IDS.movements);
  await createIndex(COLLECTION_IDS.movements, 'userId_createdAt', 'key', ['userId', 'createdAt']);
  await createIndex(COLLECTION_IDS.movements, 'userId_type', 'key', ['userId', 'type']);
}

async function setupCustomerOwed() {
  await createCollection(COLLECTION_IDS.customer_owed, 'Customer Owed');
  await createAttribute(COLLECTION_IDS.customer_owed, 'userId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between attributes
  await createAttribute(COLLECTION_IDS.customer_owed, 'customerId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.customer_owed, 'cylinderTypeId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.customer_owed, 'quantity', 'Integer', { required: true, min: 0 });
  await waitForAttributes(COLLECTION_IDS.customer_owed);
  await createIndex(COLLECTION_IDS.customer_owed, 'userId_customerId_cylinderTypeId', 'unique', [
    'userId',
    'customerId',
    'cylinderTypeId',
  ]);
}

async function setupPrices() {
  await createCollection(COLLECTION_IDS.prices, 'Prices');
  await createAttribute(COLLECTION_IDS.prices, 'userId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.prices, 'cylinderTypeId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.prices, 'sellUnitPrice', 'Float', { required: true });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.prices, 'refillUnitCost', 'Float', { required: true });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.prices, 'effectiveFrom', 'String', { required: true, size: 50 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.prices, 'notes', 'String', { required: false, size: 65535 });
  await waitForAttributes(COLLECTION_IDS.prices);
  await createIndex(COLLECTION_IDS.prices, 'userId_cylinderTypeId', 'key', ['userId', 'cylinderTypeId']);
  await createIndex(COLLECTION_IDS.prices, 'uid_cyl_eff_desc', 'key', ['userId', 'cylinderTypeId', 'effectiveFrom'], ['ASC', 'ASC', 'DESC']);
}

async function setupFinanceTransactions() {
  await createCollection(COLLECTION_IDS.finance_transactions, 'Finance Transactions');
  await createAttribute(COLLECTION_IDS.finance_transactions, 'userId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.finance_transactions, 'type', 'Enum', {
    required: true,
    elements: ['sale_cash', 'sale_credit', 'payment', 'refill', 'expense', 'add'],
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.finance_transactions, 'amount', 'Float', { required: true });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.finance_transactions, 'customerId', 'String', { required: false, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.finance_transactions, 'movementId', 'String', { required: false, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.finance_transactions, 'notes', 'String', { required: false, size: 65535 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.finance_transactions, 'createdAt', 'String', { required: true, size: 50 });
  await waitForAttributes(COLLECTION_IDS.finance_transactions);
  await createIndex(COLLECTION_IDS.finance_transactions, 'userId_createdAt_desc', 'key', ['userId', 'createdAt'], ['ASC', 'DESC']);
  await createIndex(COLLECTION_IDS.finance_transactions, 'userId_customerId', 'key', ['userId', 'customerId']);
}

async function setupCustomerBalance() {
  await createCollection(COLLECTION_IDS.customer_balance, 'Customer Balance');
  await createAttribute(COLLECTION_IDS.customer_balance, 'userId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.customer_balance, 'customerId', 'String', { required: true, size: 36 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await createAttribute(COLLECTION_IDS.customer_balance, 'balance', 'Float', { required: true });
  await waitForAttributes(COLLECTION_IDS.customer_balance);
  await createIndex(COLLECTION_IDS.customer_balance, 'userId_customerId', 'unique', ['userId', 'customerId']);
}

async function main() {
  console.log('Setting up Appwrite database and collections...\n');
  try {
    await createDatabase();
    console.log();
    await setupCustomers();
    console.log();
    await setupInventory();
    console.log();
    await setupMovements();
    console.log();
    await setupCustomerOwed();
    console.log();
    await setupPrices();
    console.log();
    await setupFinanceTransactions();
    console.log();
    await setupCustomerBalance();
    console.log('\n✓ Setup complete!');
  } catch (err) {
    console.error('\n✗ Setup failed:', err.message);
    if (err.response) {
      console.error('Response:', err.response);
    }
    process.exit(1);
  }
}

main();
