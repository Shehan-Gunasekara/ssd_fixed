const User = require("../models/User");
const mongoose = require("mongoose");
const Payment = require("../models/payment");
var sendEmail = require("../utils/sendEmail");
const xss = require("xss");

const createPayment = async (req, res) => {
  const payment = new Payment({
    Customer_id: xss(req.body.customer_id),
    Card_Number: xss(req.body.number),
    Card_holder_name: xss(req.body.name),
    Card_expiry_date: xss(req.body.expiry),
    Card_CVC: xss(req.body.cvc),
  });

  await payment.save();
  sendEmail(
    xss(req.body.email),
    "Payment successful",
    "Your payment was completed successfully."
  );
  res.send(xss(payment));
};

const getPayment = async (req, res) => {
  const payment = await Payment.findOne({ Customer_id: xss(req.params.cusID) });
  res.send(xss(payment));
};

const updatePayment = async (req, res) => {
  const payment = await Payment.findOneAndUpdate(
    { Customer_id: xss(req.params.cusID) },
    {
      Customer_id: xss(req.body.customer_id),
      Card_Number: xss(req.body.number),
      Card_holder_name: xss(req.body.Hname),
      Card_expiry_date: xss(req.body.expiry),
      Card_CVC: xss(req.body.cvc),
    },
    { new: true }
  );

  sendEmail(
    xss(req.body.email),
    "Payment successful",
    "Your payment was completed successfully."
  );
  res.send(xss(payment));
};

const removePayment = async (req, res) => {
  const payment = await Payment.findOneAndDelete({
    Customer_id: xss(req.params.cusID),
  });
  res.send(xss(payment));
};

module.exports = {
  createPayment,
  getPayment,
  updatePayment,
  removePayment,
};
