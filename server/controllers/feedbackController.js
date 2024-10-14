const { default: mongoose } = require("mongoose");
const Feedback = require("../models/Feedback");
const Order = require("../models/Order");

//*delete feedback
const deleteFeedback = async (req, res) => {
  await Feedback.deleteOne({ orderId: req.params.id })
    .then(() => res.json({ success: true }))
    .catch((err) => res.status(404).json({ success: false }));
};

//* create new feedback
const newFeedback = async (req, res) => {
  const feedbackData = {
    orderId: req.params.id,
    CustomerID: req.body.CustomerID,
    name: req.body.name,
    deliveryFeedback: req.body.deliveryFeedback,
    rating: req.body.rating,
  };

  await Feedback.findOneAndUpdate({ orderId: req.params.id }, feedbackData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  })
    .then((feedback) => res.status(200).json(feedback))
    .catch((err) => res.status(400).send({ error: "An error occurred" }));
};

// update as Completed by User
const updateasCompletedbyUser = async (req, res) => {
  const updateStatus = {
    DeliveryStatus: req.body.DeliveryStatus, // Fixed typo from "DelevaryStatus"
  };

  await Order.findOneAndUpdate({ _id: req.params.id }, updateStatus, {
    new: true,
  })
    .then((order) => res.status(200).json(order))
    .catch(() => res.status(400).send({ error: "An error occurred" }));
};

// find a delivery feedback by id
const deliveryFeedbackById = async (req, res) => {
  Feedback.findOne({ orderId: req.params.id })
    .then((feedback) => {
      console.log(feedback);
      res.status(200).json(feedback);
    })
    .catch((error) => res.status(400).json({ error: error.message }));
};

// get all feedbacks
const getAllFeedbacks = async (req, res) => {
  Feedback.find().then((feedback) => {
    res.status(200).json(feedback);
  });
};

// count ratings
const countRating = async (req, res) => {
  await Feedback.aggregate([
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 }, // Corrected to $sum: 1
      },
    },
    {
      $sort: { _id: 1 },
    },
  ])
    .then((data) => res.json(data))
    .catch((error) => res.json({ error: error.message }));
};

module.exports = {
  newFeedback,
  deleteFeedback,
  deliveryFeedbackById,
  updateasCompletedbyUser,
  getAllFeedbacks,
  countRating,
};
