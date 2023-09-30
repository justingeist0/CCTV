const { run, getClients, storeClient } = require('./db')
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


// Sample data for demonstration
const data = {
    1: ["String 1", "String 2", "String 3"],
    2: ["Apple", "Banana", "Cherry"],
    3: ["One", "Two", "Three"],
  };
  
app.get('/images/:id', (req, res) => {
    const id = req.params.id;
    if (data[id]) {
        res.json(data[id]);
    } else {
        res.status(404).json({ error: 'Data not found for the provided ID' });
    }
});

app.post('/images/:id', (req, res) => {
    const id = req.params.id;
    if (data[id]) {
        res.json(data[id]);
    } else {
        res.status(404).json({ error: 'Data not found for the provided ID' });
    }
});

app.delete('/images/:id', (req, res) => {
    const id = req.params.id;
    if (data[id]) {
        res.json(data[id]);
    } else {
        res.status(404).json({ error: 'Data not found for the provided ID' });
    }
});

app.get('/devices', (req, res) => {
    res.json({"data": [
        "Device 1", "device 2"
    ]});
});

app.get('/clients', async (req, res) => {
    const clients = await getClients()
    res.json(clients);
});

app.post('/devices', (req, res) => {
    const id = req.params.id;
    if (data[id]) {
        res.json(data[id]);
    } else {
        res.status(404).json({ error: 'Data not found for the provided ID' });
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
