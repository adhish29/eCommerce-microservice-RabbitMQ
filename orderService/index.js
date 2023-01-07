const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const Order = require("./order");
const isAuthenticated = require("../inAuthenticated");

const app = express();
const PORT = process.env.PORT || 7090;

let channel, connection;

app.use(express.json());

async function connect() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      "mongodb+srv://adhishAdmin:adhish@surveycollect.s98mq.mongodb.net/order-service?retryWrites=true&w=majority"
    );
    console.log("connected to order-service DB");
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
    await channel.assertQueue("ORDER");
    console.log(
      `RabbitMQ Service is running on amqp://127.0.0.1:7000 and RabbitMQ Management service is running on http://localhost:15672/`
    );
  } catch (e) {
    console.log(e);
  }
}

async function createOrder(products, userEmail) {
  const total_price = products.reduce((prev, cur) => prev + cur.price, 0);
  const newOrder = new Order({
    products: products.map((item) => {
      return {
        product_id: item._id,
      };
    }),
    user: userEmail,
    total_price,
  });
  await newOrder.save();
  return newOrder;
}

connectToQueue()
  .then(() => {
    channel.consume("ORDER", async (data) => {
      const { products, userEmail } = JSON.parse(data.content);
      console.log("Consuming ORDER queue");
      // console.log(products);
      // console.log(userEmail);
      const newOrder = await createOrder(products, userEmail);
      channel.ack(data);
      channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })));
    });
  })
  .catch((e) => console.log(e));

app.listen(PORT, () =>
  console.log(`Order Service id running at http://localhost:${PORT}`)
);
