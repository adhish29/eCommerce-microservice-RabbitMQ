const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const Product = require("./Product");
const isAuthenticated = require("../inAuthenticated");

const app = express();
const PORT = process.env.PORT || 7080;
const saltRounds = 10;

let channel, connection, order;

app.use(express.json());

async function connect() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      "mongodb+srv://adhishAdmin:adhish@surveycollect.s98mq.mongodb.net/product-service?retryWrites=true&w=majority"
    );
    console.log("connected to product-service DB");
  } catch (e) {
    console.log(e);
  }
}

connect();

async function connectToQueue() {
  try {
    const amqpServer = "amqp://127.0.0.1:7000";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
    console.log(
      `RabbitMQ Service is running on amqp://127.0.0.1:7000 and RabbitMQ Management service is running on http://localhost:15672/`
    );
  } catch (e) {
    console.log(e);
  }
}

connectToQueue();

//create a new Product
app.post("/product/create", isAuthenticated, async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const newProduct = new Product({
      name,
      description,
      price,
    });
    await newProduct.save();
    res.json(newProduct);
  } catch (e) {
    console.log(e);
  }
});

//buy product
app.post("/product/buy", isAuthenticated, async (req, res) => {
  try {
    const { ids } = req.body;

    const products = await Product.find({
      _id: {
        $in: ids,
      },
    });
    channel.sendToQueue(
      "ORDER",
      Buffer.from(
        JSON.stringify({
          products,
          userEmail: req.user.email,
        })
      )
    );
    // console.log(channel);
    channel.consume("PRODUCT", (data) => {
      console.log("Consuming PRODUCT queue");
      order = JSON.parse(data.content);
      // console.log(JSON.stringify(order));
      channel.ack(data);
    });
  } catch (error) {
    console.log(error);
  }
  res.json({
    message: "Order created Successfully",
  });
});

app.listen(PORT, () =>
  console.log(`Product Service id running at http://localhost:${PORT}`)
);
