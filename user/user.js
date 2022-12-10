const express = require('express');
const router = express.Router();
var cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { usersCollection ,profileCollection} = require('../databaseConnection/databaseConnection');

// authorisetion here 
router.get('/users',(req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.splite(' ')[1];
  if (token == null) return res.status(401).json({ msg: 'token fail' })
  jwt.verify(token, 'abdul', function (err, decoded) {
    if (err) return res.status(401).json({ msg: "come to point" });
    req.email = decoded.email
    next();
  });
})

// register data is here 
router.post('/users', async (req, res) => {
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
    const accessToken = jwt.sign({name,email},'abdul',{
      expiresIn:'15s'
    });
    const refresh_token = jwt.sign({name,email},'abdul',{
      expiresIn:'1d'
    })
    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    })
    res.json({ accessToken, email: email });
  })


//  user login field is here 
  router.post('/login' ,  async (req, res) => {
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
    res.json({ accessToken, email: user.email });
  })
  module.exports= router;