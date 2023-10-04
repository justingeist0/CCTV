const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
const deviceCollection = "device"

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

async function getDevices(clientId) {
    const collection = database.collection(deviceCollection)
    let clients = await collection.find({"clientId": clientId}).toArray()
    return clients
}

async function getDevice(deviceId) {
    const collection = database.collection(deviceCollection)
    let clients = await collection.find({"_id": new ObjectId(deviceId)}).toArray()
    return clients
}
  
async function storeDevice(data) {
    console.log("storing", data)
    data['images'] = []
    const collection = database.collection(deviceCollection)
    return await collection.insertOne(data)
}
  
async function setDeviceImages(deviceObjectId, images) {
    const collection = database.collection(deviceCollection);
    const filter = { _id: new ObjectId(deviceObjectId) };
    const update = { $set: { images: images } };
    const result = await collection.updateOne(filter, update);
    console.log(result)
    return result;
}

module.exports = { run, getClients, storeClient, getDevices, storeDevice, setDeviceImages, getDevice }