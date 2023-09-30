const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://tvadmin:U3KYDUWzo8gGqrHH@cluster0.huzogvt.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
const dbName = "database"

const clientCollection = "client"
const deviceCollection = "payments"
const imageCollection = "user"

const database = client.db(dbName)

async function run() {
    try {
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      console.log("done")
    }
}

async function getClients() {
    const collection = database.collection(clientCollection)
    let clients = await collection.find({}).toArray()
    return clients
}
  
async function storeClient(data) {
    const collection = database.collection(clientCollection)
    return await collection.insertOne({"name": data.name})
}

module.exports = { run, getClients, storeClient }