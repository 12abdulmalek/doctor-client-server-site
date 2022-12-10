const express = require("express");
const router = express();
const SSLCommerzPayment = require("sslcommerz-lts");
const { v4: uuidv4 } = require("uuid");
const {
  paymentCollection,
} = require("../databaseConnection/databaseConnection");
router.get("/init", async (req, res) => {
  const data = {
    total_amount: 121,
    currency: "BDT",
    tran_id: uuidv4(),
    success_url: "http://localhost:5000/success",
    fail_url: "http://localhost:5000/fail",
    cancel_url: "http://localhost:5000/cancel",
    ipn_url: "http://localhost:5000/ipn",
    shipping_method: "Courier",
    product_name: "Computer.",
    product_category: "Electronic",
    product_profile: "general",
    cus_name: req.body.name,
    paymentStatus: "pending",
    cus_email: "cust@yahoo.com",
    cus_add1: "Dhaka",
    cus_add2: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: "01711111111",
    cus_fax: "01711111111",
    ship_name: "Customer Name",
    ship_add1: "Dhaka",
    ship_add2: "Dhaka",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: 1000,
    ship_country: "Bangladesh",
    multi_card_name: "mastercard",
    value_a: "ref001_A",
    value_b: "ref002_B",
    value_c: "ref003_C",
    value_d: "ref004_D",
  };

  // const result = await paymentCollection.insertOne(data);
  const sslcommer = new SSLCommerzPayment(
    process.env.STORE_ID,
    process.env.STORE_PASS,
    false
  );
  //true for live default false for sandbox
  sslcommer.init(data).then((data) => { 
    console.log(data);
    res.redirect(data.GatewayPageURL);
  });
});
router.post("/success", async (req, res) => {
  const result = await paymentCollection.updateOne(
    { tran_id: req.body.tran_id },
    {
      $set: {
        val_id: req.body.val_id,
      },
    }
  );
  res.status(200).redirect(`http://localhost:3000/success/${req.body.tran_id}`);
});
router.post("/fail", async (req, res) => {
  const result = await paymentCollection.deleteOne({
    tran_id: req.body.tran_id,
  });
  res.redirect(`http://localhost:3000`);
});
router.post("/cancel", async (req, res) => {
  const result = await paymentCollection.deleteOne({
    tran_id: req.body.tran_id,
  });
  res.redirect(`http://localhost:3000`);
});
router.post("/validate", async (req, res) => {
  const result = await paymentCollection.findOne({
    tran_id: req.body.tran_id,
  });
  if (result.val_id === req.body.val_id) {
    const update = await paymentCollection.updateOne(
      { tran_id: req.body.tran_id },
      {
        $set: {
          paymentStatus: "paymentComplete",
        },
      }
    );
    res.send(update.modifiedCount > 0);
  } else {
    res.send("Chor detected");
  }
});
router.get("/orders/:id", async (req, res) => {
  const id = req.params.id;
  const result = await paymentCollection.findOne({ tran_id: id });
  res.json(result);
});
module.exports = router;
