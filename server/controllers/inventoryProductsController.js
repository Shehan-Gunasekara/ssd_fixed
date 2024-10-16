const xss = require("xss");
const InventoryProducts = require("../models/InventoryProducts");
const mongoose = require("mongoose");

//CREATE a product
const createProduct = async (req, res) => {
  const {
    product_name,
    unit_price,
    reorder_level,
    weight_per_unit,
    units_in_stock,
    description,
    photo,
  } = req.body;

  //validations when creating a new product - checks if the product already exists
  if (await InventoryProducts.findOne({ product_name })) {
    return res.status(400).json({ error: "The product already exists" });
  }

  // add details to db
  try {
    const product = await InventoryProducts.create({
      product_name,
      unit_price,
      reorder_level,
      weight_per_unit,
      units_in_stock,
      description,
      photo,
    });
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Read details of all products
const getAllProducts = async (req, res) => {
  await InventoryProducts.find().then((allProducts) =>
    res.status(200).json(allProducts)
  );
};

//READ details of a single product by id
const getProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Product does not exist" });
  }

  const product = await InventoryProducts.findById(id);

  if (!product) {
    return res.status(404).json({ error: "Product does not exist" });
  }

  res.status(200).json(product);
};

// UPDATE details of a single product
const updateProduct = async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Product does not exist" });
  }

  // Input validation
  await check('name').optional().isString().run(req);
  await check('price').optional().isFloat({ gt: 0 }).run(req);
  await check('description').optional().isString().run(req);
  await check('stock').optional().isInt({ min: 0 }).run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Whitelist allowed fields
  const { name, price, description, stock } = req.body;
  const updateData = { name, price, description, stock };

  try {
    // Find and update product
    const product = await InventoryProducts.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true } // Return the updated product
    );

    if (!product) {
      return res.status(404).json({ error: "Product does not exist" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while updating the product" });
  }
};

//DELETE a single product
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Product does not exist" });
  }

  const product = await InventoryProducts.findOneAndDelete({ _id: id });

  if (!product) {
    return res.status(404).json({ error: "Product does not exist" });
  }

  res.status(200).json(product);
};

const updateQuantity = async (req, res) => {
  try {
    const product = await InventoryProducts.findByIdAndUpdate(
      req.params.id,
      {
        units_in_stock: xss(req.body.tempQuantity), // Sanitize quantity input
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getAllProducts,
  updateQuantity,
};
