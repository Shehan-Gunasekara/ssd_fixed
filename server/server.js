require("dotenv").config();
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const helmet = require('helmet'); // Import helmet

const passport = require("passport"); // Added for passport
const session = require("express-session"); // Added for session management
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Added for Google OAuth

const userRoutes = require("./routes/userRoutes");
const siteFeedbacks = require("./routes/SiteFeedbackRoutes");

const User = require("./models/User"); // Assuming you have a User model

const E_billRoutes = require("./routes/E_billRoutes");
const Payments = require("./routes/Payment");
const orderedProductRoutes = require("./routes/orderedProductRoutes");
const orderRoutes = require("./routes/orderRoutes");
const Delivary = require("./routes/DelivaryRoutes");
const incomeHistory = require("./routes/incomeHistoryRoutes.js");
const supplierOrder = require("./routes/supplierOrderRoutes");
const Cart = require("./routes/Cart.js");

const inventoryProductRoutes = require("./routes/inventoryProductRoutes");
const inventoryRawMaterialRoutes = require("./routes/inventoryRawMaterialRoutes");
//inventory related routes for product orders from the inventory
const inventoryProductOrderRoutes = require("./routes/InventoryProductOrderRoutes");

const supplierRoutes = require("./routes/supplierRoutes");
const supplierPaymentRoutes = require("./routes/supplierPaymentRoutes");

const deliveryRoutes = require("./routes/deliveryRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

const factoryRoutes = require("./routes/factoryRoutes");
const machineRoutes = require("./routes/machineRoutes");
const machineStatsRoutes = require("./routes/machineStatsRoutes");
const rawDataRoutes = require("./routes/rawDataRoutes");

const mongoose = require("mongoose");
const cors = require("cors");
// express app
const app = express();

// Helmet to secure Express apps by setting various HTTP headers
app.use(helmet());

// Set up rate limiter: maximum of 5 requests per minute
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});

const corsOptions = {
  origin: [process.env.CLIENT_DOMAIN],
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware for parsing cookies
app.use(cookieParser());
app.use(express.json());
// Set up CSRF protection middleware but apply it conditionally
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
// Set up express session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Set true if using HTTPS in production
    },
  })
);

// Apply CSRF protection to all routes except /api/csrf-token
app.use((req, res, next) => {
  if (req.path === "/api/csrf-token") {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

// Middleware to set CSRF token in response locals
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  next();
});

// Example route where you pass the CSRF token to the client
app.get("/api/csrf-token", (req, res) => {
  // console.log("CSRF token generated and sent to client", {
  //   csrfToken: req.csrfToken ? req.csrfToken() : null,
  // });
  res.json({ csrfToken: req.csrfToken ? req.csrfToken() : null });
});

// middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://trusted-cdn.com; img-src 'self' https://trusted-cdn.com; style-src 'self' https://trusted-cdn.com"
  );
  console.log(req.url);

  //Custom security headers to prevent clivkjacking
  res.setHeader('X-Frame-Options', 'DENY'); // Prevents embedding the page in any frame
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
});

// Google OAuth Routes with Rate Limiting
app.get(
  "/api/users/auth/google",
  authLimiter, // Apply rate limiting
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/api/users/auth/google/callback",
  authLimiter, // Apply rate limiting
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = createToken(req.user._id); // Assuming you have a token generation logic
    res.redirect(`/account?token=${token}`); // Redirect with token
  }
);

// routes
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/site-feedbacks", siteFeedbacks);
app.use("/api/v3/payment", Payments);

app.use("/api/v6/orders", orderRoutes);
app.use("/api/v7/orderedProduct", orderedProductRoutes);
app.use("/api/v8/incomeHistory", incomeHistory);
app.use("/api/v9/supplierOrder", supplierOrder);
app.use("/api/v1/eBill", E_billRoutes);
app.use("/api/v4/Delevery", Delivary);
app.use("/api/v5/Cart", Cart);

app.use("/api/suppliers", supplierRoutes);

app.use("/api/inventoryProducts", inventoryProductRoutes);
app.use("/api/inventoryRawMaterials", inventoryRawMaterialRoutes);

app.use("/api/users/feedbacks", feedbackRoutes);

app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);

app.use("/api/factory", factoryRoutes);
app.use("/api/machine", machineRoutes);
app.use("/api/machineStats", machineStatsRoutes);
app.use("/api/rawData", rawDataRoutes);

//inventory related routes
app.use("/api/inventoryProducts", inventoryProductRoutes);
app.use("/api/inventoryRawMaterials", inventoryRawMaterialRoutes);
//inventory related routes for product orders from the inventory
app.use("/api/inventoryProductOrder", inventoryProductOrderRoutes);

/***************************For image uploading ***************************************/

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(
      null,
      "../client/src/components/dashboard/inventoryManagement/uploadedImages"
    );
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: fileStorageEngine });

app.post("/single", upload.single("image"), (req, res) => {
  console.log(req.file);
  res.send("Single file upload success");
});
/***************************For image uploading ***************************************/

//sheahn

app.use("/api/v6/orders", orderRoutes);
app.use("/api/v7/orderedProduct", orderedProductRoutes);
app.use("/api/v8/incomeHistory", incomeHistory);
app.use("/api/v9/supplierOrder", supplierOrder);
app.use("/api/v1/eBill", E_billRoutes);

app.use("/api/v4/Delevery", Delivary);
app.use("/api/v5/Cart", Cart);

app.use("/api/suppliers", supplierRoutes);
app.use("/api/inventoryProducts", inventoryProductRoutes);
app.use("/api/inventoryRawMaterials", inventoryRawMaterialRoutes);
app.use("/api/supplier-payment", supplierPaymentRoutes);

app.use("/api/v9/supplierOrder", supplierOrder);
//payment recipt upload

const fileStorageRecipt = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(
      null,
      "../client/src/components/dashboard/transactionManagement/uploadedRecipt"
    );
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploadRecipt = multer({ storage: fileStorageRecipt });

app.post("/singleRecipt", uploadRecipt.single("imageRecipt"), (req, res) => {
  console.log(req.file);
  res.send("Single file upload success");
});

// connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // listen for request
    app.listen(process.env.PORT, () => {
      console.log(
        "connected to the db and listening on port",
        process.env.PORT
      );
    });
  })
  .catch((error) => {
    console.log(error);
  });
