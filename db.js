const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = "mongodb+srv://iimezzooo:eivZC5pqhSxBeCJv@serverlessinstance0.hbpr236.mongodb.net/?retryWrites=true&w=majority&appName=ServerlessInstance0";
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
    return await collection.insertOne({"name": data.name, "address": data.address, "phone": data.address})
}

async function updateClient(data) {
  const collection = database.collection(clientCollection)
  if (data.name === "") {
    return await collection.deleteOne({"_id": new ObjectId(data._id)})
  }
  return await collection.updateOne(
    {"_id": new ObjectId(data._id)}, 
    {$set: {"name": data.name, "address": data.address, "phone": data.phone}}
  )
}

async function getDevices(clientId) {
    const collection = database.collection(deviceCollection)
    let clients = await collection.find({"clientId": clientId}).toArray()
    return clients
}

async function getDevice(deviceId) {
    const collection = database.collection(deviceCollection)
    const projection = { images: 1, mirrorDeviceId: 1 };
    let clients = await collection.find({"_id": new ObjectId(deviceId)}).project(projection).toArray()
    if (clients.length > 0 && clients[0].images.length == 1) {
        const image = clients[0].images[0]
        clients[0].images = [image, image]
    }
    return clients
}
  
async function storeDevice(data) {
    data['images'] = []
    const collection = database.collection(deviceCollection)
    return await collection.insertOne(data)
}
  
async function setDeviceImages(deviceObjectId, images) {
    const collection = database.collection(deviceCollection);
    const filter = { _id: new ObjectId(deviceObjectId) };
    const update = { $set: { images: images } };
    const result = await collection.updateOne(filter, update);
    return result;
}
  
async function setDeviceData(deviceObjectId, data) {
    const collection = database.collection(deviceCollection);
    if (data.name === "") {
      return await collection.deleteOne({"_id": new ObjectId(data._id)})
    }
    const filter = { _id: new ObjectId(deviceObjectId) };
    const update = { $set: { images: data.images, "name": data.name, "password": data.password, "remoteLink": data.remoteLink, "mirrorDeviceId": data.mirrorDeviceId } };
    const result = await collection.updateOne(filter, update);
    return result;
}

module.exports = { run, getClients, storeClient, updateClient, getDevices, storeDevice, setDeviceImages, setDeviceData, getDevice }