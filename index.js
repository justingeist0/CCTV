const { run, getClients, storeClient, getDevices, storeDevice, setDeviceImages, getDevice } = require('./db')
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const admins = ["iimezzooo@gmail.com", "justingeist0@gmail.com", "rylensalvi@gmail.com"]

run().catch(console.dir);

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const version = 1

app.use(bodyParser.json());

const port = 3000;

const authenticateUser = (req, res, next) => {
  const idToken = req.headers.authorization;

  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      console.log(decodedToken.email)
      for (var i in admins) {
        if (admins[i] == decodedToken.email)
          return next();
      }
      return res.status(401).json({ error: 'Unauthorized' });
    })
    .catch((error) => {
      console.error('Error verifying Firebase ID token:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    });
};

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

app.get('/device/:id', async (req, res) => {
  const id = req.params.id;
  const data = await getDevice(id)
  res.json(data)
});

app.get('/get-version', async (req, res) => {
  res.json({version});
});

app.get('/add-client', authenticateUser, (req, res) => {
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

app.post('/add-client', authenticateUser, async (req, res) => {
  const clientData = req.body;
  const store = await storeClient(clientData)
  console.log(store)
  res.json(store);
});

app.get('/add-device', authenticateUser, (req, res) => {
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

app.post('/add-device', authenticateUser, async (req, res) => {
  const clientData = req.body;
  const store = await storeDevice(clientData)
  clientData['_id'] = store.insertedId
  res.json(clientData);
});


app.post('/device-images/:id', authenticateUser, async (req, res) => {
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

app.get('/clients', authenticateUser, async (req, res) => {
    const clients = await getClients()
    res.json(clients);
});

app.get('/devices/:id', authenticateUser, async (req, res) => {
  const id = req.params.id;
  const data = await getDevices(id)
  res.json(data)
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
