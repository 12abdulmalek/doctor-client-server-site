const express = require('express');
const router = express.Router();
const app = express();
const dotenv = require('dotenv');
dotenv.config();
// const fileUpload = require('express-fileupload');
// app.use(fileUpload())
const stripe = require("stripe")(process.env.STRIPE_SECRETS_KEY);
const fs = require('node:fs');
const { ObjectId, profileCollection, doctorsCollection, appointmentCollection } = require('../databaseConnection/databaseConnection');
const { upload ,storage} = require('../multer/multer');

// profile Collection

router.get('/profile', async (req, res) => {
    const cursor = profileCollection.find();
    const result = await cursor.toArray();
    res.json(result);
})
router.get('/profile/:email', async (req, res) => {
    const query = { email: req.params.email }
    const result = await profileCollection.findOne(query);
    res.json(result);
})
// update profile 
router.put('/profile', upload.single("userPhoto"), async (req, res) => {
    // const pic = req.files.userPhoto;
    // const picData = pic.data;
    // const encodedPic = picData.toString('base64');
    // const bufferImage = Buffer.from(encodedPic, 'base64');
    const filter = { email: req.body.email };
    const updateDoc = {
        $set: {
            name: req.body.name,
            gender: req.body.gender,
            bufferImage: "http://localhost:5000/image/"  +  req.file.filename
        },

    };
    const result = await profileCollection.updateOne(filter, updateDoc);
    res.json(result);
})

//  make admin 
router.get('/profile/admin/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const result = await profileCollection.findOne(query);
    let isAdmin;
    if (result?.role === 'admin') {
        res.json({ isAdmin: true })
    }
    else {
        res.json({ isAdmin: false })
    }
})

// make admin 
router.put('/profile/makeAdmin', async (req, res) => {
    const email = req.body.adminEmail;
    const filter = { email: email };
    const adminMakeEmail = await profileCollection.findOne(filter);
    if (!adminMakeEmail) {
        return res.status(400).json({
            msg: 'not registration email'
        }); 
    }
    const updateDoc = {
        $set: {
            role: 'admin',
        }
    }
    const result = await profileCollection.updateOne(filter, updateDoc);
    res.json(result);
})
// doctor collection method here 
router.get('/doctors', async (req, res) => {
    const cursor = doctorsCollection.find();
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    // console.log(size,page);
    let result;
    if (page||size) {
        
        result = await cursor.skip(page * size).limit(size).toArray({});
    }
    else {
        result = await cursor.toArray({});
    }

    res.json(result);
})
//  doctor collection count
router.get('/doctorCount', async (req, res) => {
    const count = await doctorsCollection.estimatedDocumentCount();
    res.json({ count });
})

// delete doctor collection 
 router.delete('/doctors/:id',async(req,res)=>{
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await doctorsCollection.deleteOne(query);
    res.json(result);
})
// added doctor 
router.post('/doctors', upload.single('image'), async (req, res) => {
    const { email, name, specialist, gender, education, work_in, experience, fee } = req.body;
    const filter = { email: email };
    const adminMakeEmail = await profileCollection.findOne(filter);
    if (!adminMakeEmail) {
        return res.status(400).json({
            msg: 'not registration email'
        });
    }
    // const pic = req.files.image;
    // const picData = pic.data;
    // const encodedPic = picData.toString('base64');
    // const imageBuffer = Buffer.from(encodedPic, 'base64');
    await doctorsCollection.insertOne({
        name: name,
        education: education,
        specialist: specialist,
        work_in: work_in,
        experience: experience,
        fee: fee,
        gender: gender,
        imageBuffer:"http://localhost:5000/image/"  +  req.file.filename
    });

    res.json({ msg: "successfully added data" })
})


// appointment post collection
router.post('/appointment', async (req, res) => {
    const { email, id, time } = req.body;
    const query = {_id:ObjectId(id)};
    const  {name,education,specialist,work_in,experience,fee,imageBuffer,gender}  =await doctorsCollection.findOne(query);
    const user = await profileCollection.findOne({ email: email });
    const getTime = new Date(time).toLocaleDateString();
    const presentTime = new Date().toLocaleDateString();
     const d1 = new Date(getTime)
     const d2 = new Date(presentTime)
     console.log(d1);
      if(d1<d2){
        console.log('bigger time')
        return res.status(401).json({msg:'please selecet next day'})
    }
        const result = await appointmentCollection.insertOne({
            user: user?.name,
            name: name,
            education: education,
            specialist: specialist,
            work_in: work_in,
            experience: experience,
            fee: fee,
            gender: gender,
            time: getTime,
            email: email,
            imageBuffer: imageBuffer
        });
        // console.log(result);
        res.json(result);
    
    
//    console.log(result);
  



})
router.get('/appointment', async (req, res) => {
    const email = req.query.search;
    const date = req.query.date;
    const time = new Date(date).toLocaleDateString("en-US", { timeZone: "America/New_York" });
    const filter = { email: email, time: time }
    const cursor = appointmentCollection.find(filter);
    const result = await cursor.toArray({});
    res.json(result);
});
router.get('/appointment/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) }
    const cursor = await appointmentCollection.findOne(query);
    res.json(cursor);
});
// appointment delete method 
router.delete('/appointment/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await appointmentCollection.deleteOne(query);
    res.json(result);
})

//  payment gateway is here  
router.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    let amount = 50;
    if (price) {
        amount = price * 100;
    }
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "eur",
        payment_method_types: ['card'],
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

module.exports = router;