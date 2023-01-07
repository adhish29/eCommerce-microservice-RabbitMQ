const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  products: [
    {
      product_id: {
        type: String,
      },
      _id: false,
    },
  ],
  user: { type: String, required: true },
  total_price: { type: Number, required: true },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = Order = mongoose.model("order", OrderSchema);
