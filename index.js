const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
var cors = require('cors');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectId;
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors())
app.use(fileUpload())
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nasnt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    // this is p
    const database = client.db("doctorsPortal");
    const usersCollection = database.collection('user');
    const doctorsCollection = database.collection('doctorCollection');
    const profileCollection = database.collection('userProfile');
    const appointmentCollection = database.collection('appointment');

    //  authorization
    app.get('/users', async (req, res) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.splite(' ')[1];
      if (token == null) return res.status(401).json({ msg: 'token fail' })
      jwt.verify(token, 'abdul', function (err, decoded) {
        if (err) return res.status(401).json({ msg: "come to point" });
        req.email = decoded.email
        next();
      });
    })
    //  registation data
    app.post('/users', async (req, res) => {
      const { name, email, password, confirm_password } = req.body;
      const find = usersCollection.find();
      const users = await find.toArray();
      const filter = users.filter(item=>item.email===email);
      if(filter.length){
        return res.status(400).json({
          msg: 'email have already'
        });
      }
      if (password !== confirm_password) {
        return res.status(400).json({
          msg: 'password is mismatch'
        });
      };
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(password, salt);
      await profileCollection.insertOne({
        name: name,
        email: email,
      });
      await usersCollection.insertOne({
        email: email,
        password: hashPassword,
      });
      res.json({ msg: 'registration done ' });
    })
    app.post('/login', async (req, res) => {
      const user = await usersCollection.findOne({
        email: req.body.email
      });
      if(!user){
        return res.status(400).json({ msg: 'invalid email' })
      }
      const match = await bcrypt.compare(req.body.password, user.password);
      if (!match) {
        return res.status(400).json({ msg: 'password is not correct' })
      }

      const name = user.name;
      const email = user.email;
      const accessToken = jwt.sign({ name, email }, 'abdul', {
        expiresIn: '15s'
      });
      // console.log('access = ',accessToken);
      const refreshToken = jwt.sign({ name, email }, 'abdul', {
        expiresIn: '1d'
      });

      await usersCollection.updateOne({ refresh_token: refreshToken }, {
        $set: {
          email: email,
          name: name
        }
      })
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      })
      console.log('alll is ok');
      res.json({ accessToken, email: user.email });
    })

    // profile data get 
    app.get('/profile', async (req, res) => {
      const cursor = profileCollection.find();
      const result = await cursor.toArray();
      res.json(result)
    })
    app.get('/profile/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await profileCollection.findOne(query);
      // console.log(result);
      res.json(result);
  })

    // update profile 
  app.put('/profile',async(req,res)=>{
      //  console.log('put is coming',req.body);
      const pic = req.files.userPhoto;
      console.log(pic);
      const picData = pic.data;
      const encodedPic = picData.toString('base64');
      const bufferImage = Buffer.from(encodedPic, 'base64');
       const filter = { email:req.body.email };
       const updateDoc = {
        $set: {
          name:req.body.name,
          gender:req.body.gender,
         bufferImage : bufferImage
        },
      };

      const result = await profileCollection.updateOne(filter, updateDoc);
      console.log(result);
  })

    //  get doctor 
    app.get('/doctors', async (req, res) => {
      const cursor = doctorsCollection.find();
      const result = await cursor.toArray({});
      res.json(result);
    })
    // added doctor 
    app.post('/doctors', async (req, res) => {
      const { name, specialist, gender, education, work_in, experience, fee } = req.body;
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString('base64');
      const imageBuffer = Buffer.from(encodedPic, 'base64');
      await doctorsCollection.insertOne({
        name: name,
        education: education,
        specialist: specialist,
        work_in: work_in,
        experience: experience,
        fee: fee,
        gender: gender,
        imageBuffer: imageBuffer
      });

      res.json({ msg: "successfully added data" })
    })
    app.get('/appointment', async (req, res) => {
      const email = req.query.search;
      const time = new Date(req.query.date).toLocaleDateString();
      const filter = { email: email, time: time }
      const cursor = appointmentCollection.find(filter);
      const result = await cursor.toArray({});
      res.json(result);
    })
    // appointment post collection
    app.post('/appointment', async (req, res) => {
      const { email, name, specialist, gender, education, work_in, experience, fee, imageBuffer } = req.body;
      const getTime = new Date(req.body.time).toLocaleDateString();
      const result = await appointmentCollection.insertOne({
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
      res.json(result);
      console.log('all appointment ok')
    })

  }

  finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.json('this is name')
})
app.listen(port, () => {
  console.log('running port is gone')
})

