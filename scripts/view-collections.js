/**
 * Script to view all collections and their data in Appwrite
 * Run: node scripts/view-collections.js
 */

require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT;
const database = process.env.EXPO_PUBLIC_APPWRITE_DATABASE;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !project || !database || !apiKey) {
  console.error('Missing required environment variables:');
  console.error('  EXPO_PUBLIC_APPWRITE_ENDPOINT:', endpoint ? '✓' : '✗');
  console.error('  EXPO_PUBLIC_APPWRITE_PROJECT:', project ? '✓' : '✗');
  console.error('  EXPO_PUBLIC_APPWRITE_DATABASE:', database ? '✓' : '✗');
  console.error('  APPWRITE_API_KEY:', apiKey ? '✓' : '✗');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(apiKey);

const databases = new Databases(client);

const collections = {
  customers: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS || 'customers',
  cylinder_types: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CYLINDER_TYPES || 'cylinder_types',
  inventory: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_INVENTORY || 'inventory',
  movements: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_MOVEMENTS || 'movements',
  customer_owed: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_OWED || 'customer_owed',
  prices: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_PRICES || 'prices',
  finance_transactions: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_FINANCE_TRANSACTIONS || 'finance_transactions',
  customer_balance: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_CUSTOMER_BALANCE || 'customer_balance',
};

async function viewCollection(collectionName) {
  try {
    console.log(`\n📦 Collection: ${collectionName}`);
    console.log('─'.repeat(60));
    
    const { documents, total } = await databases.listDocuments(
      database,
      collectionName,
      []
    );
    
    console.log(`Total documents: ${total}`);
    
    if (documents.length === 0) {
      console.log('  (empty)');
      return;
    }
    
    // Show first 10 documents, or all if less than 10
    const toShow = documents.slice(0, 10);
    toShow.forEach((doc, idx) => {
      console.log(`\n  Document ${idx + 1}:`);
      console.log(`    ID: ${doc.$id}`);
      try {
        const createdAt = doc.$createdAt 
          ? (typeof doc.$createdAt === 'string' 
              ? doc.$createdAt 
              : new Date(doc.$createdAt * 1000).toISOString())
          : 'N/A';
        console.log(`    Created: ${createdAt}`);
      } catch (e) {
        console.log(`    Created: ${doc.$createdAt || 'N/A'}`);
      }
      // Show all attributes except Appwrite metadata
      const dataKeys = Object.keys(doc).filter(k => !k.startsWith('$'));
      if (dataKeys.length > 0) {
        console.log('    Data:');
        dataKeys.forEach(key => {
          const value = doc[key];
          const displayValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
          console.log(`      ${key}: ${displayValue}`);
        });
      }
    });
    
    if (documents.length > 10) {
      console.log(`\n  ... and ${documents.length - 10} more documents`);
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    if (error.code === 404) {
      console.error('    Collection does not exist or is not accessible');
    }
  }
}

async function main() {
  console.log('🔍 Viewing Appwrite Collections');
  console.log('═'.repeat(60));
  console.log(`Database: ${database}`);
  console.log(`Project: ${project}`);
  console.log(`Endpoint: ${endpoint}`);
  
  for (const [key, collectionName] of Object.entries(collections)) {
    await viewCollection(collectionName);
  }
  
  console.log('\n✅ Done');
}

main().catch(console.error);
