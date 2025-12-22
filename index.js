//from mongodb 

const { MongoClient, ServerApiVersion } = require('mongodb');


//initial configuration
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const crypto = require('crypto');


const app = express();
app.use(cors());
app.use(express.json())
//end initial config


const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = require("./blood-donate.json");
const { info, log } = require('console');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



//jwt middleware
const verifyFBToken = async(req,res,next) =>{
  const token = req.headers.authorization;

  if(!token){
    return res.status(401).send({message: 'unauthorize access'})
  }

  try{
    const idToken = token.split(' ')[1]
    const decoded = await admin.auth().verifyIdToken(idToken)
    console.log("decoded info", decoded)
    req.decoded_email = decoded.email;
    next();
    
  }
  catch(error){
    return res.status(401).send({message: 'unauthorize access'})

  }

}


const uri = "mongodb+srv://missionscic11:JCs7DKooZkysSMFN@cluster0.e62g5zs.mongodb.net/?appName=Cluster0";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    //create API
    const database = client.db('missionscic11DB')
    const userCollections = database.collection('user')
    const requestsCollections = database.collection('request')
    const paymentsCollection = database.collection('payments')


    //save in database user info with post
    app.post('/users', async(req,res)=>{
        const userInfo = req.body;
        userInfo.createdAt = new Date();
        userInfo.role = userInfo?.role || 'donar'
        userInfo.status = 'active'
        const result = await userCollections.insertOne(userInfo);

        res.send(result)

    })

    app.get('/users', verifyFBToken, async (req ,res)=>{
      const result = await userCollections.find().toArray();
      res.status(200).send(result);
    })


    // get single user profile
      app.get('/users/:email', verifyFBToken, async (req, res) => {
        const email = req.params.email;

      
        if (email !== req.decoded_email) {
          return res.status(403).send({ message: 'Forbidden access' });
        }

        const query = { email };
        const result = await userCollections.findOne(query);
        res.send(result);
      });


      // update user profile
          app.put('/users/:email', verifyFBToken, async (req, res) => {
            const email = req.params.email;

            // security check
            if (email !== req.decoded_email) {
              return res.status(403).send({ message: 'Forbidden access' });
            }

            const updatedInfo = req.body;

            const updateDoc = {
              $set: {
                name: updatedInfo.name,
                blood: updatedInfo.blood,
                district: updatedInfo.district,
                upazila: updatedInfo.upazila,
                mainPhotoUrl: updatedInfo.mainPhotoUrl || null,
                updatedAt: new Date(),
              },
            };

            const result = await userCollections.updateOne(
              { email },
              updateDoc
            );

            res.send(result);
          });



              


    //create api
    app.get('/users/role/:email', async(req,res)=>{
        const {email} = req.params
        console.log(email);
        

        const query = {email:email}
        const result = await userCollections.findOne(query)
        console.log(result);
        
        res.send(result)
    })

    //create api for active block update
    app.patch('/update/user/status', verifyFBToken, async(req,res)=>{
      const {email, status} = req.query;
      const query = {email:email};

      const updateStatus = {
        $set:{
          status: status
        }
      }
      const result = await userCollections.updateOne(query, updateStatus)

      res.send(result)
    })


    //add request api(sent data frontend to backend) 
    app.post('/requests', verifyFBToken, async(req,res)=>{
      const data = req.body;
      data.createdAt = new Date();
      const result = await requestsCollections.insertOne(data)

      //sent data frontend to backend
      res.send(result)
     
    })

    // my requests
app.get('/my-request', verifyFBToken, async (req, res) => {

  const email = req.decoded_email;

  const page = Number(req.query.page) || 0;
  const size = Number(req.query.size) || 10;
  const status = req.query.status;

  let query = { requester_email: email };

  if (status) {
    query.donation_status = status;
  }

  const result = await requestsCollections
    .find(query)
    .sort({ createdAt: -1 })
    .skip(page * size)
    .limit(size)
    .toArray();

  const totalRequest = await requestsCollections.countDocuments(query);

  res.send({
    request: result,
    totalRequest
  });
});

//done cancel btn status update api
const { ObjectId } = require("mongodb");

app.patch("/request-status/:id", verifyFBToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // only allow valid status change
  if (!["done", "canceled"].includes(status)) {
    return res.status(400).send({ message: "Invalid status" });
  }

  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: { donation_status: status },
  };

  const result = await requestsCollections.updateOne(query, updateDoc);
  res.send(result);
});


//delete api
app.delete("/requests/:id", verifyFBToken, async (req, res) => {
  const { id } = req.params;

  const result = await requestsCollections.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});


//view details
app.get("/requests/:id", verifyFBToken, async (req, res) => {
  const { id } = req.params;

  const result = await requestsCollections.findOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});



//edit request
app.put("/requests/:id", verifyFBToken, async (req, res) => {
  const { id } = req.params;

  const updateDoc = {
    $set: req.body,
  };

  const result = await requestsCollections.updateOne(
    { _id: new ObjectId(id) },
    updateDoc
  );

  res.send(result);
});





    //Search
    app.get('/search-requests', async(req, res)=>{
      const {bloodGroup, district, upazila} = req.query;

      // console.log(req.query)

      const query = {};

      if(!query){
        return;
      }
      if(bloodGroup){
        const fixed = bloodGroup.replace(/ /g, "+").trim();
        query.blood_group = fixed;
      }
      if(district){
        query.recipient_district = district;
      }
      if(upazila){
        query.recipient_upazila = upazila;
      }

      console.log(query);
      

     const result = await requestsCollections.find(query).toArray();
     res.send(result)
      
    })




    //payments
    app.post('/create-payment-checkout', async(req, res)=>{
      const information = req.body;
      const amount = parseInt(information.donateAmount) * 100;

      const session = await stripe.checkout.sessions.create({
  
  line_items: [
    {
     price_data: {
      currency:'usd',
      unit_amount: amount,
      product_data:{
        name: 'please donate'
      }
     },
      quantity: 1,
    },
  ],
  mode: 'payment',
  metadata: {
    donarName: information?.donarName
  },
  customer_email: information.donarEmail,
  success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.SITE_DOMAIN}/payment-cancelled`,
});

res.send({url: session.url})
      
    })

    //payment success api full information in backend
    app.post('/success-payment', async(req, res)=>{

        const {session_id} = req.query;
       const session = await stripe.checkout.sessions.retrieve(

        session_id
  
        );

        // console.log(session);

        const transactionId = session.payment_intent;

        const isPaymentExist = await paymentsCollection.findOne({transactionId})

        if(isPaymentExist){
          return res.status(400).send('Already Exist')
        }

        if(session.payment_status == 'paid'){
          const paymentInfo = {
            amount: session.amount_total/100,
            currency:session.currency,
            donarEmail: session.customer_email,
            transactionId,
            payment_status: session.payment_status,
            paidAt: new Date()

          }
          const result = await paymentsCollection.insertOne(paymentInfo)
          return res.send(result)
        }

        
        
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get('/',(req,res)=>{
    res.send("Hello, Mission SCIC")
})

app.listen(port,()=>{
    console.log(`Server is running on ${port}`);
    
})