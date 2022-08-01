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
const port =process.env.PORT || 5000;
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
     
  //  authorization
      app.get('/users',async(req,res)=>{
        const authHeader = req.headers['authorization'];
          const token = authHeader && authHeader.splite(' ')[1];
          if(token==null)return res.status(401).json({msg:'token fail'})
          jwt.verify(token, 'abdul', function(err, decoded) {
             if(err) return res.status(401).json({msg:"come to point"});
             req.email=decoded.email
             next();
          });
       })
      //  registation data
app.post('/users',async(req,res)=>{
  const {name,email,password,confirm_password,number,gender} = req.body;
         const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
  if(password!==confirm_password){
    return res.status(400).json({
       msg:'password is mismatch'
    });
  }
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password,salt);
    await profileCollection.insertOne({
    name:name,
    email:email,
    gender:gender,
    number:number,
    image:imageBuffer
  });

  const result =   await usersCollection.insertOne({
       name:name,
       email:email,
       password:hashPassword,
       gender:gender,
       number:number,
       image:imageBuffer
     });
    
   res.json(result);
})
app.post('/login',async(req,res)=>{
  const user = await usersCollection.findOne({
      email:req.body.email
     })

      const match = await bcrypt.compare(req.body.password,user.password);
      if(!match){
          console.log('password is not matching');
          
          return res.status(400).json({msg:'password is mismatch'})
      }
     
      const name = user.name;
      const email= user.email;
      
     const accessToken = jwt.sign({ name, email} , 'abdul',{
      expiresIn: '15s'
     });
      // console.log('access = ',accessToken);
     const refreshToken = jwt.sign({name, email},'abdul',{
      expiresIn: '1d'
  });
   
await usersCollection.updateOne({refresh_token:refreshToken}, {
  $set:{
    email:email,
    name:name
  }
})
  // console.log('this is true');
   res.cookie('refreshToken',refreshToken,{
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
   })
   console.log('alll is ok');
   res.json({accessToken,email:user.email});
})
   
// profile data get 
app.get('/profile',async(req,res)=>{
    const cursor =  profileCollection.find();
    const result = await cursor.toArray();
    res.json(result)
})

//  get doctor 
app.get('/doctors',async(req,res)=>{
  const cursor = doctorsCollection.find();
  const result = await cursor.toArray({});
  res.json(result);
})
// added doctor 
app.post('/doctors', async (req,res)=>{
  const {name,specialist,gender,education,work_in,experience,fee} = req.body;
  const pic = req.files.image;
  const picData = pic.data;
  const encodedPic = picData.toString('base64');
  const imageBuffer = Buffer.from(encodedPic, 'base64');
  const result = await doctorsCollection.insertOne({
       name:name,   
       education:education,
       specialist:specialist,
       work_in:work_in,
       experience:experience,
       fee:fee,
       gender:gender,
       imageBuffer:imageBuffer
  });
  res.json({msg:"successfully added data"})
})




}

finally {
  // await client.close();
}
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.json('this is name')
})
app.listen(port,()=>{
    console.log('running port is gone')
})

