// DO NOT

const { default: mongoose } = require("mongoose");
const Feedback = require("../models/Feedback");
const Order = require("../models/Order");
const xss = require("xss");

//*delete feedback
const deleteFeedback = async (req, res) => {
  await Feedback.deleteOne({ orderId: req.params.id })
    .then(() => res.json({ success: true }))
    .catch((err) => res.status(404).json({ success: false }));
};

//* Create new feedback
const newFeedback = async (req, res) => {
  const sanitizedFeedback = {
    orderId: xss(req.params.id),
    CustomerID: xss(req.body.CustomerID),
    name: xss(req.body.name),
    deliveryFeedback: xss(req.body.deliveryFeedback),
    rating: xss(req.body.rating),
  };

  await Feedback.findOneAndUpdate(
    { orderId: sanitizedFeedback.orderId },
    sanitizedFeedback,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  )
    .then((feedback) => {
      if (feedback) {
        // Only send back relevant information
        res.status(200).json({
          message: "Feedback submitted successfully",
          orderId: feedback.orderId, // Send only necessary fields
          rating: feedback.rating, // Include relevant fields without sensitive data
        });
      } else {
        res.status(404).json({ error: "Feedback not found" });
      }
    })
    .catch(() =>
      res
        .status(400)
        .json({ error: "An error occurred while submitting feedback." })
    );
};

// Update order as delivering
const updateasCompletedbyUser = async (req, res) => {
  const updateStatus = {
    DelevaryStatus: xss(req.body.DelevaryStatus),
  };

  await Order.findOneAndUpdate({ _id: xss(req.params.id) }, updateStatus, {
    new: true,
  })
    .then((order) => {
      if (order) {
        // Only send back relevant information
        res.status(200).json({
          message: "Order status updated successfully",
          orderId: order._id, // Send the order ID or any other necessary field
          DelevaryStatus: order.DelevaryStatus, // Include relevant fields without sensitive data
        });
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    })
    .catch(() =>
      res
        .status(400)
        .json({ error: "An error occurred while updating the order." })
    );
};

// //add new feedback
// var newFeedback = async (req, res) => {
//     newFeedback = {
//         deliveryFeedbacks: req.body.deliveryFeedbacks
//     };

//     await Delivery.findOneAndUpdate({ _id: req.params.id }, newFeedback, {
//         new: true,
//     })
//         .then((delivery) => res.status(200).json(delivery))
//         .catch((err) => res.status(400).send(err));
// };

//* find a delivery by id
const deliveryFeedbackById = async (req, res) => {
  Feedback.findOne({ orderId: req.params.id })
    .then((feedback) => {
      console.log(feedback);
      res.status(200).json(feedback);
    })
    .catch((error) => res.status(400).json({ error: error.message }));
};

// //* find a delivery by id
// const deliveryByName = async (req, res) => {
//     Feedback.find({ orderId: { $regex: req.params.orderId + ".*" } }).then(
//         (feedback) => {
//             res.json(feedback);
//         }
//     );
//! };

// update as Completed by User
// var updateasCompletedbyUser = async (req, res) => {
//     newFeedback = {
//         deliveryStatus: req.body.deliveryStatus
//     };

//     await Delivery.findOneAndUpdate({ _id: req.params.id }, newFeedback, {
//         new: true,
//     })
//         .then((delivery) => res.status(200).json(delivery))
//         .catch((err) => res.status(400).send(err));
// };

// get all feedbacks
const getAllFeedbacks = async (req, res) => {
  Feedback.find().then((feedback) => {
    res.status(200).json(feedback);
  });
};

// const getAllFeedbacks = async (req, res) => {
//     await Feedback.find()
//         .then((feedback) => res.status(200).json(feedback));
// };

//count
const countRating = async (req, res) => {
  await Feedback.aggregate()

    .group({
      _id: "$rating",

      count: {
        $count: {},
      },
    })

    .sort({
      _id: 1,
    })

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
