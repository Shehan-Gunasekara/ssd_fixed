const { json } = require("express");
const SupplierPayment = require("../models/SupplierPayment");

//* Create new supplier payment
const validator = require("validator");

const newSupplierPayment = async (req, res) => {
  console.log(req.body.transactionDate);

  // Sanitize user inputs
  const sanitizedSupplierName = validator.escape(req.body.supplierName);
  const sanitizedSupplierID = validator.escape(req.body.supplierId);
  const sanitizedOrderID = validator.escape(req.body.order_ID);
  const sanitizedAmount = validator.escape(req.body.amount.toString());
  const sanitizedTransactionDate = validator.escape(req.body.transactionDate);
  const sanitizedPaymentReferenceNo = validator.escape(
    req.body.paymentReferenceNo
  );
  const sanitizedFileName = validator.escape(req.body.fileName);

  const newSupplierPayment = new SupplierPayment({
    supplierName: sanitizedSupplierName,
    supplierID: sanitizedSupplierID,
    orderID: sanitizedOrderID,
    amount: sanitizedAmount,
    transactionDate: sanitizedTransactionDate,
    paymentReferenceNo: sanitizedPaymentReferenceNo,
    fileName: sanitizedFileName,
  });

  await newSupplierPayment
    .save()
    .then(() => res.status(201).json(newSupplierPayment))
    .catch((err) =>
      res.status(400).json({
        error: "Failed to create supplier payment",
        details: err.message,
      })
    );
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

// one supplier payments
const oneSupplierPayments = async (req, res) => {
  const sanitizedID = validator.escape(req.params.ID);

  const sample = await SupplierPayment.findById(sanitizedID)
    .then((sample) => res.status(200).json(sample))
    .catch((err) =>
      res
        .status(404)
        .json({ error: "Supplier payment not found", details: err.message })
    );
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
  // Sanitize the supplier name to prevent malicious input
  const supplierName = validator.escape(req.params.name);

  // Limit the input length to a reasonable size
  if (supplierName.length > 100) {
    return res.status(400).json({ error: "Input is too long" });
  }

  // Validate that the supplierName contains only valid characters to avoid ReDoS
  const validSupplierNameRegex = /^[a-zA-Z0-9\s]+$/; // Allows only alphanumeric characters and spaces
  if (!validSupplierNameRegex.test(supplierName)) {
    return res.status(400).json({ error: "Invalid supplier name format" });
  }

  try {
    const paymentData = await SupplierPayment.aggregate().match({
      supplierName: supplierName,
    });

    return res.status(200).json(paymentData);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
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
