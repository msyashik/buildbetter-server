const express = require("express");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const bodyParser = require("body-parser");
var admin = require("firebase-admin");
var serviceAccount = require("./.configs/buildbetter-c96ba-firebase-adminsdk-5e3pp-6cecbe06ad.json");
require("dotenv").config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ddki.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

client.connect((err) => {
  const servicesCollection = client.db("BuildBetter").collection("services");
  const adminsCollection = client.db("BuildBetter").collection("admins");
  const reviewsCollection = client.db("BuildBetter").collection("reviews");
  const ordersCollection = client.db("BuildBetter").collection("orders");

  console.log("database connected");

  app.get("/services", (req, res) => {
    servicesCollection.find().toArray((err, items) => {
      res.send(items);
    });
  });

  app.get("/allUsersOrders", (req, res) => {
    ordersCollection.find().toArray((err, items) => {
      res.send(items);
    });
  });

  app.get("/reviews", (req, res) => {
    reviewsCollection.find().toArray((err, items) => {
      res.send(items);
    });
  });

  app.get("/showUserOrderList", (req, res) => {
    console.log("show User again", req.query.email);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer")) {
      const idToken = bearer.split(" ")[1]; //extracting second part
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          console.log("verified");
          let tokenEmail = decodedToken.email;
          let queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            ordersCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                console.log(documents);
                res.send(documents);
              });
          } else {
            res.send("unauthorized access");
          }
        })
        .catch((error) => {});
    }
  });

  // app.get("/showUserOrderList", (req, res) => {
  //   console.log(req.query.email);
  //   ordersCollection.find({ email: req.query.email }).toArray((err, items) => {
  //     res.send(items);
  //   });
  // });
  //showUserOrderList

  app.get("/adminCheck/:email", (req, res) => {
    console.log(req.params.email);
    adminsCollection.find({ email: req.params.email }).toArray((err, items) => {
      res.send(items.length > 0);
    });
  });

  // app.get("/adminCheck/:email", (req, res) => {
  //   console.log(req.params.email);
  // //   ordersCollection.find({ email: req.query.email }).toArray((err, items) => {
  // //     res.send(items);
  // //   });
  // // });

  app.post("/adminCheck", (req, res) => {
    const newEmail = req.body;
    //console.log("adding new event ", newEvent);
    adminsCollection.find({ email: newEmail }).then((result) => {
      console.log(result);
    });
  });

  app.post("/addReview", (req, res) => {
    const newReview = req.body;
    console.log("adding new event ", newReview);
    reviewsCollection.insertOne(newReview).then((result) => {
      console.log("inserted count ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/userOrder", (req, res) => {
    const newOrder = req.body;
    console.log("adding new order ", newOrder);
    ordersCollection.insertOne(newOrder).then((result) => {
      console.log("inserted count ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/addService", (req, res) => {
    const newService = req.body;
    console.log("adding new order ", newService);
    servicesCollection.insertOne(newService).then((result) => {
      console.log("inserted count ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/makeAdmin", (req, res) => {
    const newAdmin = req.body;
    console.log("adding new event ", newAdmin);
    adminsCollection.insertOne(newAdmin).then((result) => {
      console.log("inserted count ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  app.delete("/deleteService/:id", (req, res) => {
    servicesCollection
      .deleteOne({ _id: ObjectID(req.params.id) })
      .then((result) => {
        res.send(result.deletedCount > 0);
      });
  });

  app.get("/singleService/:id", (req, res) => {
    servicesCollection
      .find({ _id: ObjectID(req.params.id) })
      .toArray((err, items) => {
        res.send(items);
      });
  });

  app.patch("/update/:id", (req, res) => {
    ordersCollection
      .updateOne(
        { _id: ObjectID(req.params.id) },
        {
          $set: { currentStatus: req.body.status },
        }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
        console.log(result);
      });
  });
});

app.listen(process.env.PORT || 5000);
