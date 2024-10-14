const User = require("../models/User");
const mongoose = require("mongoose");
const Payment = require("../models/payment");
const sendEmail = require("../utils/sendEmail");
const validator = require("validator"); // Importing validator for sanitization and validation

// Function to sanitize input
const sanitizeInput = (input) => {
  return validator.escape(input); // Escapes special characters like <, >, &, ', and "
};

const createPayment = async (req, res) => {
  try {
    // Sanitize and validate inputs
    const customer_id = sanitizeInput(req.body.customer_id);
    const cardNumber = sanitizeInput(req.body.number);
    const cardHolderName = sanitizeInput(req.body.name);
    const cardExpiryDate = sanitizeInput(req.body.expiry);
    const cardCVC = sanitizeInput(req.body.cvc);
    const email = validator.isEmail(req.body.email) ? req.body.email : null;

    if (!email) {
      return res.status(400).send({ error: "Invalid email address." });
    }

    const payment = new Payment({
      Customer_id: customer_id,
      Card_Number: cardNumber,
      Card_holder_name: cardHolderName,
      Card_expiry_date: cardExpiryDate,
      Card_CVC: cardCVC,
    });

    await payment.save();
    sendEmail(
      email,
      "Payment successful",
      "Your payment was completed successfully."
    );
    res.send(payment);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while creating payment." });
  }
};

const getPayment = async (req, res) => {
  try {
    const cusID = sanitizeInput(req.params.cusID); // Sanitize input
    const payment = await Payment.findOne({ Customer_id: cusID });

    if (!payment) {
      return res.status(404).send({ error: "Payment not found." });
    }

    res.send(payment);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while retrieving payment." });
  }
};

const updatePayment = async (req, res) => {
  try {
    // Sanitize and validate inputs
    const customer_id = sanitizeInput(req.body.customer_id);
    const cardNumber = sanitizeInput(req.body.number);
    const cardHolderName = sanitizeInput(req.body.Hname);
    const cardExpiryDate = sanitizeInput(req.body.expiry);
    const cardCVC = sanitizeInput(req.body.cvc);
    const email = validator.isEmail(req.body.email) ? req.body.email : null;

    if (!email) {
      return res.status(400).send({ error: "Invalid email address." });
    }

    const payment = await Payment.findOneAndUpdate(
      { Customer_id: sanitizeInput(req.params.cusID) },
      {
        Customer_id: customer_id,
        Card_Number: cardNumber,
        Card_holder_name: cardHolderName,
        Card_expiry_date: cardExpiryDate,
        Card_CVC: cardCVC,
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).send({ error: "Payment not found." });
    }

    sendEmail(
      email,
      "Payment updated successfully",
      "Your payment details have been updated successfully."
    );
    res.send(payment);
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while updating payment." });
  }
};

const removePayment = async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({
      Customer_id: sanitizeInput(req.params.cusID),
    });

    if (!payment) {
      return res.status(404).send({ error: "Payment not found." });
    }

    res.send({ message: "Payment removed successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while deleting payment." });
  }
};

module.exports = {
  createPayment,
  getPayment,
  updatePayment,
  removePayment,
};
