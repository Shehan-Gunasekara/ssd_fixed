const { json } = require("express");
const SupplierPayment = require("../models/SupplierPayment");
const xss = require("xss");
const sanitize = require("mongo-sanitize");
const Joi = require('joi');

const paymentSchema = Joi.object({
  supplierName: Joi.string().required(),
  supplierID: Joi.string().required(),
  orderID: Joi.string().required(),
  amount: Joi.number().required(),
  transactionDate: Joi.date().required(),
  paymentReferenceNo: Joi.string().required(),
  fileName: Joi.string().optional().allow('')
});

const newSupplierPayment = async (req, res) => {
  try {
    // Validate input using Joi
    const { error } = paymentSchema.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    // Sanitize input to prevent NoSQL injection
    const sanitizedBody = sanitize(req.body);

    // Use XSS sanitization on the sanitized input
    const newSupplierPayment = new SupplierPayment({
      supplierName: xss(sanitizedBody.supplierName),
      supplierID: xss(sanitizedBody.supplierID),
      orderID: xss(sanitizedBody.orderID),
      amount: xss(sanitizedBody.amount),
      transactionDate: xss(sanitizedBody.transactionDate),
      paymentReferenceNo: xss(sanitizedBody.paymentReferenceNo),
      fileName: xss(sanitizedBody.fileName),
    });

    // Save to the database
    await newSupplierPayment.save();

    // Send a safe response (avoid sending raw database object directly)
    res.send({
      id: newSupplierPayment._id,
      supplierName: newSupplierPayment.supplierName,
      amount: newSupplierPayment.amount,
      transactionDate: newSupplierPayment.transactionDate,
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal Server Error', error: err.message });
  }
};

//* all supplier payments
const allSupplierPayments = async (req, res) => {
  const sample = await SupplierPayment.find().sort({ transactionDate: -1 });
  var array = [];
  for (i = 0; i < sample.length; i++) {
    var test = sample[i].transactionDate
      .toISOString()
      .split("T")[0]
      .slice(0, 10);

    array.push({
      _id: sample[i]._id,
      supplierName: sample[i].supplierName,
      supplierID: sample[i].supplierID,
      orderID: sample[i].orderID,
      amount: sample[i].amount,
      transactionDate: test,
      paymentReferenceNo: sample[i].paymentReferenceNo,
      fileName: sample[i].fileName,
    });
  }
  res.send(array);
};

//* one supplier payments
const oneSupplierPayments = async (req, res) => {
  const sanitizedId = xss(req.params.ID);
  const sample = await SupplierPayment.findById(sanitizedId);
  res.send(xss(sample));
};

//*
const getPaymentData = async (req, res) => {
  await SupplierPayment.aggregate()
    .group({
      _id: "$supplierName",
      Total: {
        $sum: "$amount",
      },
    })
    .sort({
      _id: "asc",
    })
    .then((paymentData) => res.json(paymentData))
    .catch((error) => res.json({ error: error.message }));
};

const getPaymentDataBySupplier = async (req, res) => {
  const supplierName = req.params.name;

  // Basic validation: check if supplierName is a valid string
  if (
    typeof supplierName !== "string" ||
    supplierName.length < 1 ||
    supplierName.length > 100
  ) {
    return res.status(400).json({ error: "Invalid supplier name" });
  }

  // Optionally, you can add a regex check to limit allowed characters
  const validSupplierName = /^[a-zA-Z0-9\s]+$/.test(supplierName);
  if (!validSupplierName) {
    return res
      .status(400)
      .json({ error: "Supplier name contains invalid characters" });
  }

  await SupplierPayment.aggregate()
    .match({ supplierName }) // Use the validated supplier name here
    .then((paymentData) => res.status(200).json(paymentData))
    .catch((error) => res.status(400).json({ error: error.message }));
};

//*Get recently added suppliers
const getRecentPayments = async (req, res) => {
  await SupplierPayment.find(
    {},
    { supplierName: 1, amount: 1, createdAt: 1, _id: 1, paymentReferenceNo: 1 }
  )
    .sort({ createdAt: "asc" })
    .limit(5)
    .then((payments) => res.status(200).json(payments))
    .catch((error) => res.status(400).json(error));
};

const getOutcomeOverview = async (req, res) => {
  var sendData = [];

  var currentYear = parseInt(new Date().getFullYear());

  var year = currentYear;
  var month = parseInt(new Date().getMonth() + 1);

  var tempYear;
  var tempMonth;
  var yrPasses = false;
  var Nmonth;
  while (currentYear - year < 2) {
    Nmonth = 12;
    if (yrPasses == false) {
      while (month >= 1) {
        var history = await SupplierPayment.find();
        var Tamount = 0;
        for (i = 0; i < history.length; i++) {
          tempYear = parseInt(history[i].transactionDate.getFullYear());
          tempMonth = parseInt(history[i].transactionDate.getMonth() + 1);

          if (year == tempYear && tempMonth == month) {
            Tamount += history[i].amount;
          }
        }

        sendData.push({ date: year + "-" + month, outcome: Tamount });
        month--;
      }
      yrPasses = true;
      year--;
    } else {
      while (Nmonth >= 1) {
        var history = await SupplierPayment.find();
        var Tamount = 0;
        for (i = 0; i < history.length; i++) {
          tempYear = parseInt(history[i].transactionDate.getFullYear());
          tempMonth = parseInt(history[i].transactionDate.getMonth() + 1);

          if (year == tempYear && tempMonth == Nmonth) {
            Tamount += history[i].amount;
          }
        }

        sendData.push({ date: year + "-" + Nmonth, outcome: Tamount });
        Nmonth--;
      }
      yrPasses = true;
      year--;
    }
  }
  res.send(sendData);
};

module.exports = {
  newSupplierPayment,
  allSupplierPayments,
  getPaymentData,
  getPaymentDataBySupplier,
  getRecentPayments,
  oneSupplierPayments,
  getOutcomeOverview,
};
