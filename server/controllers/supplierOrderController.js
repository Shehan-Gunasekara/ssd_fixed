const SupplierOrder = require("../models/supplierOrderModel");
const mongoose = require("mongoose");
var sendEmail = require("../utils/sendEmail");

//Create new order
const createSupplierOrder = async (req, res) => {
  const { supplierId, rawMaterial, quantity, unit } = req.body;

  //adding to the db
  try {
    const order = await SupplierOrder.create({
      supplierId,
      rawMaterial,
      quantity,
      unit,
    });
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Get all orders
const getAllSupplierOrders = async (req, res) => {
  const orders = await SupplierOrder.find({}).sort({ createdAt: -1 });

  res.status(200).json(orders);
};

//Get unpaid orders
const getUnpaidSupplierOrders = async (req, res) => {
  const orders = await SupplierOrder.find({ orderStatus: "Pending" }).sort({
    createdAt: -1,
  });

  res.status(200).json(orders);
};

const validator = require("validator");
// Get one order
const getOneSupplierOrder = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "Invalid order ID" });
  }

  const order = await SupplierOrder.findById(req.params.id);

  if (order) {
    order.supplierId = validator.escape(order.supplierId);
    order.rawMaterial = validator.escape(order.rawMaterial);
    order.quantity = validator.escape(order.quantity);
    order.unit = validator.escape(order.unit);
    order.orderStatus = validator.escape(order.orderStatus);
  }

  res.status(200).json(order);
};

//Delete an order
const deleteSupplierOrder = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such order" });
  }

  const order = await SupplierOrder.findOneAndDelete({ _id: id });

  if (!order) {
    return res.status(400).json({ error: "No such order" });
  }

  res.status(200).json(order);
};

//Update an order
const updateSupplierOrder = async (req, res) => {
  const order = await SupplierOrder.findById(req.params.id);

  if (order) {
    //order.deliveredAt = Date.now();
    order.orderStatus = "Received";
    order.Date = Date.now();

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
};

// Update supplier order payment
const updateSupplierOrderPayment = async (req, res) => {
  const sanitizedSupplierId = validator.escape(req.body.supplierId);
  const sanitizedRawMaterial = validator.escape(req.body.rawMaterial);
  const sanitizedQuantity = validator.escape(req.body.quantity);
  const sanitizedUnit = validator.escape(req.body.unit);
  const sanitizedOrderStatus = validator.escape(req.body.orderStatus);
  const sanitizedEmail = validator.escape(req.body.email);

  const payment = await SupplierOrder.findByIdAndUpdate(
    req.params.id,
    {
      supplierId: sanitizedSupplierId,
      rawMaterial: sanitizedRawMaterial,
      quantity: sanitizedQuantity,
      unit: sanitizedUnit,
      orderStatus: sanitizedOrderStatus,
    },
    { new: true }
  );

  // Send an email notification using sanitized email
  sendEmail(
    sanitizedEmail,
    "Payment completed",
    `We have paid for your ${sanitizedRawMaterial}`
  );

  res.json({
    supplierId: validator.escape(payment.supplierId),
    rawMaterial: validator.escape(payment.rawMaterial),
    quantity: validator.escape(payment.quantity),
    unit: validator.escape(payment.unit),
    orderStatus: validator.escape(payment.orderStatus),
  });
};

module.exports = {
  createSupplierOrder,
  getAllSupplierOrders,
  getOneSupplierOrder,
  deleteSupplierOrder,
  updateSupplierOrder,
  updateSupplierOrderPayment,
  getUnpaidSupplierOrders,
};
