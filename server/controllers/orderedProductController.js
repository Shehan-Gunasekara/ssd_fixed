const mongoose = require("mongoose");

const orderedProducts = require("../models/orderedProduct");

const validator = require("validator"); // Ensure to install the validator package

const Create = async (req, res) => {
  // Sanitize inputs to prevent XSS
  const orderID = validator.escape(req.body.order_ID);
  const productID = validator.escape(req.body.product_id);
  const quantity = parseInt(req.body.quantity, 10); // Ensure quantity is an integer
  const productName = validator.escape(req.body.product_Name);

  // Validate quantity
  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  const orderedProduct = new orderedProducts({
    OrderID: orderID,
    ProductID: productID,
    Quantity: quantity,
    product_Name: productName,
  });

  try {
    await orderedProduct.save();
    res.status(201).json(orderedProduct); // Return a 201 status for created resource
  } catch (error) {
    res.status(400).json({ error: error.message }); // Handle errors on save
  }
};

//Get product by order ID

const getProductByOrderId = async (req, res) => {
  const orderedProduct = await orderedProducts.find({ OrderID: req.params.id });
  res.status(200).json(orderedProduct);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "No such order" });
  }
};

//Get number of orders for a product

const getNumberOfOrdersForProduct = async (req, res) => {
  await orderedProducts
    .aggregate()
    .group({
      _id: "$product_Name",
      Total: {
        $count: {},
      },
    })
    .then((productOrders) => res.json(productOrders))
    .catch((error) => res.json({ error: error.message }));
};

//Get products sold count in orders

const getProductsSoldCount = async (req, res) => {
  await orderedProducts
    .aggregate()
    .group({
      _id: "$product_Name",
      Total: {
        $sum: "$Quantity",
      },
    })
    .sort({
      _id: 1,
    })
    .then((productOrders) => res.json(productOrders))
    .catch((error) => res.json({ error: error.message }));
};

module.exports = {
  Create,
  getProductByOrderId,
  getNumberOfOrdersForProduct,
  getProductsSoldCount,
};
