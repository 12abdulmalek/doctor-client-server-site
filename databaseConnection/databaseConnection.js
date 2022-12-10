const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv');
dotenv.config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nasnt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const database = client.db("doctorsPortal");
const usersCollection = database.collection('user');
const doctorsCollection = database.collection('doctorCollection');
const profileCollection = database.collection('userProfile');
const appointmentCollection = database.collection('appointment');
const paymentCollection =  database.collection('paymentCollect');
const uploads =  database.collection('uploads');
module.exports = {
    client,
    ObjectId,
    database,
    usersCollection,
    profileCollection,
    doctorsCollection,
    appointmentCollection,
    paymentCollection,
    uploads

}