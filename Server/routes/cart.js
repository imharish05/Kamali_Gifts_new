const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  revalidateCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

// Public revalidation route (can be called by guests)
router.post("/revalidate", revalidateCart);

router.use(protect); // remaining cart routes require auth

router.get("/", getCart);
router.post("/add", addToCart);
router.delete("/remove/:cartItemId", removeFromCart);
router.patch("/increase/:cartItemId", increaseQuantity);
router.patch("/decrease/:cartItemId", decreaseQuantity);
router.delete("/clear", clearCart);

module.exports = router;