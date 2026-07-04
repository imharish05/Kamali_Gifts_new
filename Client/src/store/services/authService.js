import api from "../../api/axios";
import { loginStart, loginSuccess, loginFailure, logoutAction } from "../slices/authSlice";
import { replaceCart } from "../slices/cart-slice";
import { createCheckoutFromCart } from "../slices/checkout-slice";
import { store } from "../store";
import cogoToast from "cogo-toast";
import { resolveImageAsArray } from "../../helpers/imageUrl";

const getRedirectPath = () => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect ? decodeURIComponent(redirect) : process.env.PUBLIC_URL + "/";
};

// ── Format a server cart item into Redux structure ────────────────────────────
const formatServerCartItem = (cartItem) => {
  const safeParseSnap = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
    return raw;
  };
  const snap = safeParseSnap(cartItem.productSnapshot);
  const variants = cartItem.product?.Variants || cartItem.product?.variants || [];
  const matchedVariant = variants.find(v => String(v.id) === String(cartItem.selectedVariantId));
  const resolvedPrice = matchedVariant?.salesPrice ?? snap.price ?? cartItem.product?.price ?? 0;
  const resolvedDiscount = snap.discount ?? cartItem.product?.discount ?? 0;
  return {
    id: cartItem.productId,
    cartItemId: cartItem.id,
    quantity: cartItem.quantity,
    selectedVariantId: cartItem.selectedVariantId || null,
    selectedVariantName: snap.selectedVariantName || null,
    selectedProductColor: cartItem.selectedProductColor || null,
    selectedProductSize: cartItem.selectedProductSize || null,
    name: snap.name || cartItem.product?.name,
    price: typeof resolvedPrice === 'string' ? parseFloat(resolvedPrice) : resolvedPrice,
    discount: typeof resolvedDiscount === 'string' ? parseFloat(resolvedDiscount) : resolvedDiscount,
    image: matchedVariant?.image
             ? resolveImageAsArray(matchedVariant.image)
             : (cartItem.product?.image
                ? resolveImageAsArray(cartItem.product.image)
                : resolveImageAsArray(snap.image)),
    variation: cartItem.product?.variation || [],
    Variants: variants,
    selectedVariant: matchedVariant || null,
    isCombo: snap.isCombo || false,
    rootComboId: snap.rootComboId || null,
    childComboId: snap.childComboId || null,
    selectedProducts: snap.products || null,
    comboType: snap.comboType || null,
    isPartialCodAvailable: cartItem.product?.isPartialCodAvailable !== false,
    customisationDetails: cartItem.customisationDetails || null,
    customisationFields: cartItem.product?.customisationFields || null,
  };
};

/**
 * After login, merge guest cart items to the server, then fetch the merged cart.
 * Guest items are those that were added locally (no server cartItemId shape, or just all of them).
 */
const mergeGuestCartThenSync = async (dispatch) => {
  const guestCartItems = store.getState().cart?.cartItems || [];

  // Push each guest item to server (errors are silently ignored per item)
  if (guestCartItems.length > 0) {
    const mergePromises = guestCartItems.map(item =>
      api.post('/cart/add', {
        productId: item.id,
        quantity: item.quantity || 1,
        selectedProductColor: item.selectedProductColor || null,
        selectedProductSize: item.selectedProductSize || null,
        selectedVariantId: item.selectedVariantId || null,
        selectedVariantName: item.selectedVariantName || null,
        customisationDetails: item.customisationDetails || null,
      }).catch(err => console.warn('[CartMerge] Could not merge item:', item.name, err.message))
    );
    await Promise.all(mergePromises);
  }

  // Fetch merged server cart and replace Redux state
  try {
    const res = await api.get('/cart');
    const cartItems = res.data || [];
    dispatch(replaceCart(cartItems.map(formatServerCartItem)));
  } catch (err) {
    console.error('Failed to sync cart from server:', err);
  }
};


// --- REGISTER ---
export const registerFunction = async (dispatch, navigate, userData) => {
  dispatch(loginStart());
  const loader = cogoToast.loading("Creating your account...", { hideAfter: 0 });

  try {
    const res = await api.post("/auth/register", userData);
    if (loader?.hide) loader.hide();

    dispatch(loginSuccess(res.data));
    setTimeout(() => {
      cogoToast.success(`Welcome to Kamali Gifts, ${res.data.name}!`);
    }, 100);

    navigate(getRedirectPath());
  } catch (err) {
    if (loader?.hide) loader.hide(); // Hide first
    const msg = err.response?.data?.message || "Registration failed";
    
    dispatch(loginFailure(msg));
    setTimeout(() => { cogoToast.error(msg); }, 50); // Delay error
  }
};

// --- LOGIN ---
export const loginFunction = async (dispatch, navigate, credentials) => {
  dispatch(loginStart());
  const loader = cogoToast.loading("Logging in...", { hideAfter: 0 });

  try {
    const res = await api.post("/auth/login", credentials);
    if (loader?.hide) loader.hide();

    dispatch(loginSuccess(res.data));
    
    // Merge guest cart into server, then sync full server cart
    await mergeGuestCartThenSync(dispatch);

    // If redirecting to checkout, build the checkout session from the merged cart
    // so Checkout.jsx's session guard doesn't bounce the user back to /cart
    const redirectPath = getRedirectPath();
    if (redirectPath.includes('/checkout')) {
      const mergedCartItems = store.getState().cart?.cartItems || [];
      if (mergedCartItems.length > 0) {
        dispatch(createCheckoutFromCart(mergedCartItems));
      }
    }
    
    setTimeout(() => {
      cogoToast.success(`Welcome back, ${res.data.name}!`);
    }, 100);

    navigate(redirectPath);
  } catch (err) {
    if (loader?.hide) loader.hide(); 
    const msg = err.response?.data?.message || "Invalid credentials";
    
    dispatch(loginFailure(msg));
    setTimeout(() => { cogoToast.error(msg); }, 50);
  }
};

// --- UPDATE PROFILE ---
export const updateProfileFunction = async (dispatch, userData) => {
  dispatch(loginStart());
  const loader = cogoToast.loading("Updating profile...", { hideAfter: 0 });

  try {
    const res = await api.put("/auth/me", userData);
    if (loader?.hide) loader.hide();

    dispatch(loginSuccess(res.data));
    setTimeout(() => {
      cogoToast.success("Profile updated successfully!");
    }, 100);

    return true;
  } catch (err) {
    if (loader?.hide) loader.hide();
    const msg = err.response?.data?.message || "Update failed";
    
    dispatch(loginFailure(msg));
    setTimeout(() => { cogoToast.error(msg); }, 50);
    return false;
  }
};

// --- UPDATE PASSWORD ---
export const updatePasswordService = async (passwordData) => {
  const loader = cogoToast.loading("Updating password...", { hideAfter: 0 });
  
  try {
    await api.put("/auth/update-password", {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });

    if (loader?.hide) loader.hide();

    setTimeout(() => {
      cogoToast.success("Password updated successfully");
    }, 100);
    
    return true;
  } catch (err) {
    if (loader?.hide) loader.hide();
    const msg = err.response?.data?.message || "Update failed";
    
    setTimeout(() => { cogoToast.error(msg); }, 50);
    return false;
  }
};

// --- LOGOUT ---
export const logoutFunction = (dispatch, navigate) => {
  dispatch(logoutAction());
  cogoToast.success("Logged out successfully", { position: "top-center" });
  navigate(process.env.PUBLIC_URL + "/");
};