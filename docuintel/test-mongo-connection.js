/**
 * MongoDB connection test utility
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('URI:', uri?.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const db = client.db('docuintel');
    const collections = await db.listCollections().toArray();
    console.log('Database: docuintel');
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    console.error('\nPossible solutions:');
    console.error('1. Check if the password needs URL encoding (special characters like @, :, /, etc.)');
    console.error('2. Verify the user "professor" exists and has read/write permissions');
    console.error('3. Check if your IP address is whitelisted in MongoDB Atlas Network Access');
    console.error('4. Verify the cluster is running and accessible');
    process.exit(1);
  }
}

testConnection();
