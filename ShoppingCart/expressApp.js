import express from "express";

const app = express();
const port = 4000;

const cart = [
  { id: 1, productName: "Wireless Mouse", price: 799, quantity: 2, category: "Electronics" },
  { id: 2, productName: "Mechanical Keyboard", price: 2499, quantity: 1, category: "Electronics" },
  { id: 3, productName: "Notebook", price: 199, quantity: 3, category: "Stationery" }
];

const isValidProductFields = (product) =>
  product &&
  typeof product.id === "number" &&
  typeof product.productName === "string" &&
  product.productName.trim().length > 0 &&
  typeof product.price === "number" &&
  product.price > 0 &&
  typeof product.quantity === "number" &&
  product.quantity > 0 &&
  typeof product.category === "string" &&
  product.category.trim().length > 0;

const withTotalPrice = (product) => ({
  ...product,
  totalPrice: product.price * product.quantity
});

app.use(express.json());

app.get("/cart", (request, response) => {
  response.json(cart.map(withTotalPrice));
});

app.get("/cart/:id", (request, response) => {
  const product = cart.find((item) => item.id === Number(request.params.id));
  if (!product) {
    response.status(404).json({ error: "Product not found" });
    return;
  }

  response.json(withTotalPrice(product));
});

app.post("/cart", (request, response) => {
  const product = request.body;
  if (!isValidProductFields(product)) {
    response.status(400).json({ error: "Invalid or missing product fields" });
    return;
  }

  if (cart.some((item) => item.id === product.id)) {
    response.status(409).json({ error: "Product id already exists" });
    return;
  }

  cart.push(product);
  response.status(201).json({
    message: "Product added successfully",
    product
  });
});

app.put("/cart/:id", (request, response) => {
  const productIndex = cart.findIndex((item) => item.id === Number(request.params.id));
  if (productIndex === -1) {
    response.status(404).json({ error: "Product not found" });
    return;
  }

  const updatedFields = request.body;
  const existingProduct = cart[productIndex];
  const updatedProduct = {
    id: existingProduct.id,
    productName: updatedFields && updatedFields.productName,
    price: updatedFields && updatedFields.price,
    quantity: updatedFields && updatedFields.quantity,
    category: updatedFields && updatedFields.category
  };

  if (!isValidProductFields(updatedProduct)) {
    response.status(400).json({ error: "Invalid or missing product fields" });
    return;
  }

  cart[productIndex] = updatedProduct;
  response.json({
    message: "Product updated successfully",
    product: updatedProduct
  });
});

app.delete("/cart/:id", (request, response) => {
  const productIndex = cart.findIndex((item) => item.id === Number(request.params.id));
  if (productIndex === -1) {
    response.status(404).json({ error: "Product not found" });
    return;
  }

  const [removedProduct] = cart.splice(productIndex, 1);
  response.json({
    message: "Product deleted successfully",
    product: removedProduct
  });
});

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    response.status(400).json({ error: "Malformed JSON body" });
    return;
  }

  next(error);
});

app.use((request, response) => {
  response.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`Express Server running at http://localhost:${port}`);
});
