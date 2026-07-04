import { v4 as uuidv4 } from 'uuid';
import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { addToCart, addToCartSilent, increaseQuantity, deleteFromCart, decreaseQuantity, deleteAllFromCart } from "../slices/cart-slice";
import { store } from "../store";
import { resolveImageAsArray } from "../../helpers/imageUrl";

/** Returns true when user is authenticated */
const isAuthed = () => !!store.getState().auth?.isAuthenticated;

// ─────────────────────────────────────────────────────────────────────────────
//  ADD TO CART
// ─────────────────────────────────────────────────────────────────────────────

const addToCartBaseService = async (dispatchOrProduct, optionalProduct, silent = false) => {
  let dispatch = store.dispatch;
  let product = dispatchOrProduct;

  if (typeof dispatchOrProduct === "function") {
    dispatch = dispatchOrProduct;
    product = optionalProduct;
  }

  // ── Guest path: add directly to Redux (localStorage via redux-persist) ──
  if (!isAuthed()) {
    const variants = product.Variants || product.variants || [];
    console.log("[DEBUG GUEST CART] variants found:", variants);
    console.log("[DEBUG GUEST CART] selectedVariantId:", product.selectedVariantId);
    const matchedVariant = variants.find(v => String(v.id) === String(product.selectedVariantId)) || product.selectedVariant;
    console.log("[DEBUG GUEST CART] matchedVariant:", matchedVariant);
    const resolvedStock = matchedVariant?.stock ?? product.stock ?? 999;
    const resolvedPrice = matchedVariant ? parseFloat(matchedVariant.salesPrice) : product.price;

    const localItem = {
      ...product,
      cartItemId: product.cartItemId || uuidv4(),
      quantity: product.quantity || 1,
      selectedVariant: matchedVariant || null,
      price: resolvedPrice,
      image: matchedVariant?.image
               ? resolveImageAsArray(matchedVariant.image)
               : (product.image ? resolveImageAsArray(product.image) : []),
      stock: resolvedStock,
    };
    console.log("[DEBUG GUEST CART] localItem image:", localItem.image);
    if (silent) {
      dispatch(addToCartSilent(localItem));
    } else {
      dispatch(addToCart(localItem));
    }
    return true;
  }

  // ── Authenticated path: call API then update Redux ───────────────────────
  try {
    const payload = {
      productId: product.productId || product.id,
      quantity: product.quantity || 1,
      selectedProductColor: product.selectedProductColor || null,
      selectedProductSize: product.selectedProductSize || null,
      selectedVariantId: product.selectedVariantId || null,
      selectedVariantName: product.selectedVariantName || null,
      customisationDetails: product.customisationDetails || null,
    };

    const res = await api.post("/cart/add", payload);
    const cartItem = res.data.cartItem;

    // Resolve variant stock — prefer matched variant, fall back to product stock
    const variants = cartItem.product?.Variants || cartItem.product?.variants || product.Variants || [];
    const matchedVariant = variants.find(v => String(v.id) === String(cartItem.selectedVariantId));
    const resolvedStock = matchedVariant?.stock ?? cartItem.product?.stock ?? product.stock ?? 999;
    const resolvedPrice = matchedVariant?.salesPrice ?? cartItem.productSnapshot?.price ?? cartItem.product?.price ?? product.price;
    const resolvedDiscount = cartItem.productSnapshot?.discount ?? cartItem.product?.discount ?? product.discount ?? 0;

    const formattedProduct = {
      id: cartItem.productId,
      cartItemId: cartItem.id,
      quantity: cartItem.quantity,
      selectedProductColor: cartItem.selectedProductColor,
      selectedProductSize: cartItem.selectedProductSize,
      selectedVariantId: cartItem.selectedVariantId != null ? Number(cartItem.selectedVariantId) : null,
      selectedVariantName: cartItem.productSnapshot?.selectedVariantName || product.selectedVariantName || null,
      selectedVariant: matchedVariant || null,
      name: cartItem.productSnapshot?.name || cartItem.product?.name || product.name,
      price: typeof resolvedPrice === "string" ? parseFloat(resolvedPrice) : resolvedPrice,
      discount: typeof resolvedDiscount === "string" ? parseFloat(resolvedDiscount) : resolvedDiscount,
      image: matchedVariant?.image
               ? resolveImageAsArray(matchedVariant.image)
               : (cartItem.productSnapshot?.image
                  ? resolveImageAsArray(cartItem.productSnapshot.image)
                  : (cartItem.product?.image
                     ? resolveImageAsArray(cartItem.product.image)
                     : (product.image ? resolveImageAsArray(product.image) : []))),
      variation: cartItem.product?.variation || product.variation || [],
      stock: resolvedStock,
      Variants: variants,
      isPartialCodAvailable: cartItem.product?.isPartialCodAvailable !== false,
      customisationDetails: cartItem.customisationDetails || null,
      customisationFields: cartItem.product?.customisationFields || null,
      shippingWeight: matchedVariant?.shippingWeight ?? cartItem.product?.shippingWeight ?? null,
      shippingDimensions: matchedVariant?.shippingDimensions ?? cartItem.product?.shippingDimensions ?? null,
    };

    if (silent) {
      dispatch(addToCartSilent(formattedProduct));
    } else {
      dispatch(addToCart(formattedProduct));
    }
    return true;
  } catch (err) {
    cogoToast.error("Could not add to cart", { position: "top-center" });
    console.log(err);
    return false;
  }
};

export const addToCartService = (dispatchOrProduct, optionalProduct) => {
  return addToCartBaseService(dispatchOrProduct, optionalProduct, false);
};

export const addToCartSilentService = (dispatchOrProduct, optionalProduct) => {
  return addToCartBaseService(dispatchOrProduct, optionalProduct, true);
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE FROM CART
// ─────────────────────────────────────────────────────────────────────────────

export const deleteFromCartService = async (cartItemId) => {
  const dispatch = store.dispatch;

  // Guest: just remove from Redux
  if (!isAuthed()) {
    dispatch(deleteFromCart(cartItemId));
    return;
  }

  try {
    await api.delete(`/cart/remove/${cartItemId}`);
    dispatch(deleteFromCart(cartItemId));
  } catch (err) {
    cogoToast.error("Could not remove item", { position: "top-center" });
    console.log(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  INCREASE QUANTITY
// ─────────────────────────────────────────────────────────────────────────────

export const increaseQuantityService = async (product) => {
  const dispatch = store.dispatch;

  // Guest: just update Redux
  if (!isAuthed()) {
    dispatch(increaseQuantity({ cartItemId: product.cartItemId }));
    return;
  }

  try {
    await api.patch(`/cart/increase/${product.cartItemId}`);
    dispatch(increaseQuantity({ cartItemId: product.cartItemId }));
  } catch (err) {
    cogoToast.error("Could not update quantity", { position: "top-center" });
    console.log(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DECREASE QUANTITY
// ─────────────────────────────────────────────────────────────────────────────

export const decreaseQuantityService = async (dispatchOrProduct, optionalProduct) => {
  let dispatch = store.dispatch;
  let product = dispatchOrProduct;

  if (typeof dispatchOrProduct === "function") {
    dispatch = dispatchOrProduct;
    product = optionalProduct;
  }

  // Guest: just update Redux
  if (!isAuthed()) {
    dispatch(decreaseQuantity(product));
    return;
  }

  try {
    await api.patch(`/cart/decrease/${product.cartItemId}`);
    dispatch(decreaseQuantity(product));
  } catch (err) {
    cogoToast.error("Could not update quantity", { position: "top-center" });
    console.log(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CLEAR CART
// ─────────────────────────────────────────────────────────────────────────────

export const deleteAllFromCartService = async (dispatch) => {
  let activeDispatch = typeof dispatch === "function" ? dispatch : store.dispatch;

  // Guest: just clear Redux
  if (!isAuthed()) {
    activeDispatch(deleteAllFromCart());
    return;
  }

  try {
    await api.delete("/cart/clear");
    activeDispatch(deleteAllFromCart());
  } catch (err) {
    cogoToast.error("Could not clear cart", { position: "top-center" });
    console.log(err);
  }
};