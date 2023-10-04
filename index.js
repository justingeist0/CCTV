const { run, getClients, storeClient, getDevices, storeDevice, setDeviceImages, getDevice } = require('./db')
// var admin = require("firebase-admin");
// var serviceAccount = require("./firebase-admin.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

run().catch(console.dir);

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

app.use(bodyParser.json());

const port = 3000;

app.get('/', (req, res) => {
  // Read the content of a file (e.g., "index.html")
  fs.readFile('index.html', 'utf8', (err, data) => {
    if (err) {
      // Handle any errors
      console.error(err);
      res.status(500).send('Error reading the file.');
    } else {
      // Send the file content as the response
      res.send(data);
    }
  });
});

app.get('/obs', (req, res) => {
  // Read the content of a file (e.g., "index.html")
  fs.readFile('obs.html', 'utf8', (err, data) => {
    if (err) {
      // Handle any errors
      console.error(err);
      res.status(500).send('Error reading the file.');
    } else {
      // Send the file content as the response
      res.send(data);
    }
  });
});


app.get('/add-client', (req, res) => {
  // Read the content of a file (e.g., "index.html")
  fs.readFile('add-client.html', 'utf8', (err, data) => {
    if (err) {
      // Handle any errors
      console.error(err);
      res.status(500).send('Error reading the file.');
    } else {
      // Send the file content as the response
      res.send(data);
    }
  });
});

app.post('/add-client', async (req, res) => {
  const clientData = req.body;
  const store = await storeClient(clientData)
  console.log(store)
  res.json(store);
});

app.get('/add-device', (req, res) => {
  // Read the content of a file (e.g., "index.html")
  fs.readFile('add-device.html', 'utf8', (err, data) => {
    if (err) {
      // Handle any errors
      console.error(err);
      res.status(500).send('Error reading the file.');
    } else {
      // Send the file content as the response
      res.send(data);
    }
  });
});

app.post('/add-device', async (req, res) => {
  const clientData = req.body;
  const store = await storeDevice(clientData)
  clientData['_id'] = store.insertedId
  res.json(clientData);
});

app.post('/device-images/:id', async (req, res) => {
    const id = req.params.id;
    const images = req.body;
    console.log("id: ", id, "images: ", images)
    const result = await setDeviceImages(id, images)
    if (result) {
        res.status(400)
    } else {
        res.status(404).json({ error: 'Data not found for the provided ID' });
    }
});

app.get('/clients', async (req, res) => {
    const clients = await getClients()
    res.json(clients);
});

app.get('/devices/:id', async (req, res) => {
  const id = req.params.id;
  const data = await getDevices(id)
  res.json(data)
});

app.get('/device/:id', async (req, res) => {
  const id = req.params.id;
  const data = await getDevice(id)
  res.json(data)
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
