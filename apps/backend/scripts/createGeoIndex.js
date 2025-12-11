const { MongoClient } = require('mongodb');

async function main() {
  const uri =
    process.env.DATABASE_URL ||
    'mongodb://admin:admin123@localhost:7008/reuseit?authSource=admin&replicaSet=rs0&directConnection=true';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); // Uses DB from URI
    const collection = db.collection('Location');
    // Create 2dsphere index on coordinates
    await collection.createIndex({ coordinates: '2dsphere' });
    console.log('2dsphere index created on Location.coordinates');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
