import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const port = 3000;
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const homePagePath = path.join(currentDirectory, "public", "index.html");

const cartItems = [
  { id: 1, productName: "Wireless Mouse", price: 799, quantity: 2 },
  { id: 2, productName: "Mechanical Keyboard", price: 2499, quantity: 1 },
  { id: 3, productName: "USB-C Hub", price: 1299, quantity: 1 }
];

const sendJson = (response, statusCode, data) => {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
};

const sendHtml = (response, statusCode, html) => {
  response.writeHead(statusCode, { "Content-Type": "text/html" });
  response.end(html);
};

const isValidProduct = (product) =>
  product &&
  typeof product.id === "number" &&
  typeof product.productName === "string" &&
  product.productName.trim().length > 0 &&
  typeof product.price === "number" &&
  product.price > 0 &&
  typeof product.quantity === "number" &&
  product.quantity > 0;

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/" && request.method === "GET") {
    sendHtml(response, 200, "<h1>Welcome to the Shopping Cart</h1>");
    return;
  }

  if (requestUrl.pathname === "/cart" && request.method === "GET") {
    sendJson(response, 200, cartItems);
    return;
  }

  if (requestUrl.pathname === "/about" && request.method === "GET") {
    sendJson(response, 200, {
      application: "Shopping Cart Management",
      description: "An in-memory shopping cart application"
    });
    return;
  }

  if (requestUrl.pathname === "/home" && request.method === "GET") {
    fs.readFile(homePagePath, "utf8", (error, html) => {
      if (error) {
        sendJson(response, 500, { error: "Unable to read the home page" });
        return;
      }

      sendHtml(response, 200, html);
    });
    return;
  }

  if (requestUrl.pathname === "/add-to-cart" && request.method === "POST") {
    let requestBody = "";

    request.on("data", (chunk) => {
      requestBody += chunk;
    });

    request.on("end", () => {
      let product;
      try {
        product = JSON.parse(requestBody);
      } catch {
        sendJson(response, 400, { error: "Malformed JSON body" });
        return;
      }

      if (!isValidProduct(product)) {
        sendJson(response, 400, { error: "Invalid or missing product fields" });
        return;
      }

      if (cartItems.some((item) => item.id === product.id)) {
        sendJson(response, 409, { error: "Product id already exists" });
        return;
      }

      cartItems.push(product);
      sendJson(response, 201, {
        message: "Product added successfully",
        product
      });
    });
    return;
  }

  const existingRoutes = ["/", "/cart", "/about", "/home", "/add-to-cart"];
  if (existingRoutes.includes(requestUrl.pathname)) {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  sendHtml(response, 404, "<h1>404 - Page Not Found</h1>");
});

server.listen(port, () => {
  console.log(`HTTP Server running at http://localhost:${port}`);
});
