const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const fs = require('fs')
const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/hello', (req, res) => {
  res.send('Just Playin');
})

app.get('/getaddress/:devicename', (req, res) => {
    const obj = JSON.parse(fs.readFileSync('info.json', 'utf8'));
    const deviceName = req.params.devicename;
    let response;

    if (obj[deviceName]) {
      obj[deviceName].address.host = decrypt(obj[deviceName].address.host);
      obj[deviceName].address.port = obj[deviceName].address.port ? decrypt(obj[deviceName].address.port) : undefined; 
      response = obj[deviceName];
    } else {
        response = {
          "error": {
            "msg": "No matching node was found"
          }
        };
    }

    res.json(response);
})

app.post('/saveaddress', (req, res) => {
    const data = req.body;
    const deviceName = data.name;

    data.address.host = encrypt(data.address.host);
    data.address.port = data.address.port ? encrypt(data.address.port) : undefined;
    let obj = JSON.parse(fs.readFileSync('info.json', 'utf8'));

    obj[data.name] = {
      "address" : data.address
    };
    fs.writeFileSync('info.json', JSON.stringify(obj, null, "\t"));

    res.json({
      "success": {
        "msg" : "Successfully Saved"
      }
    });
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

const encrypt = (data) => {
    // Encrypt data using the public key
    const publicKey = fs.readFileSync('publicKey.pem', 'utf8');
    const encryptedData = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, Buffer.from(data));

    return encryptedData.toString('base64');
}

const decrypt = (encryptedData) => {
    // Decrypt data using the private key
    const privateKey = fs.readFileSync('privateKey.pem', 'utf8');
    const decryptedData = crypto.privateDecrypt({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, Buffer.from(encryptedData, 'base64'));

    return decryptedData.toString('utf8');
}
