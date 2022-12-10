const express = require("express");
const cors = require("cors");
const CryptoJS = require("crypto-js");
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/image", express.static("image"));
const { client, uploads } = require("./databaseConnection/databaseConnection");
const collection = require("./Collection/collection");
const user = require("./user/user");
const payment = require("./Payment/Payment");

async function run() {
  try {
    await client.connect();

        app.use("/", collection);
        app.use("/", user);
        app.use("/", payment); 
    app.use((err, req, res, next) => {
      if (err.message) {
        res.status(500).send(err.message)
      }
      else {
        res.status(500).send('there was an error');
      }
    })
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.json({ msg: "server is running" });
});
app.listen(5000, () => {
  // console.log(new Date().getDate())
  console.log("app is running");
});

