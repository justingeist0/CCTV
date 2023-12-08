const { run, getClients, storeClient, updateClient, getDevices, storeDevice, setDeviceImages, setDeviceData, getDevice } = require('./db')

var admin = require("firebase-admin");
var serviceAccount = require("./firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const admins = ["iimezzooo@gmail.com", "justingeist0@gmail.com", "rylensalvi@gmail.com"]

run().catch(console.dir);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors())
const version = 1

app.set('view engine', 'ejs');

app.use(express.static('public', { extensions: ['html'] }));
app.use(bodyParser.json());

const port = 8080;

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

app.get('/device/:id', async (req, res) => {
  const id = req.params.id;
  const data = await getDevice(id)
  res.json(data)
});

app.get('/get-version', async (req, res) => {
  res.json({version});
});

app.post('/add-client', authenticateUser, async (req, res) => {
  const clientData = req.body;
  const store = await storeClient(clientData)
  res.json(store);
});

app.post('/update-client', authenticateUser, async (req, res) => {
  const clientData = req.body;
  const store = await updateClient(clientData)
  res.json(store);
});

app.post('/add-device', authenticateUser, async (req, res) => {
  const deviceData = req.body;
  const store = await storeDevice(deviceData)
  deviceData['_id'] = store.insertedId
  res.json(deviceData);
});


app.post('/device-images/:id', authenticateUser, async (req, res) => {
    const id = req.params.id;
    const images = req.body;
    const result = await setDeviceImages(id, images)
    if (result) {
        res.status(200).json({})
    } else {
        res.status(404).json({ error: 'Data not found for the provided ID' });
    }
});


app.put('/devices/:id', authenticateUser, async (req, res) => {
  const id = req.params.id;
  const deviceData = req.body;
  const result = await setDeviceData(id, deviceData)
  if (result) {
      res.status(200).json({ok: true})
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
