import PropTypes from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { getDiscountPrice } from "../../helpers/product";
import ProductImageGallery from "../../components/product/ProductImageGallery";
import ProductDescriptionInfo from "../../components/product/ProductDescriptionInfo";
import ProductImageGallerySideThumb from "../../components/product/ProductImageGallerySideThumb";
import ProductImageFixed from "../../components/product/ProductImageFixed";

const ProductImageDescription = ({ spaceTopClass, spaceBottomClass, galleryType, product }) => {
  const currency = useSelector((state) => state.currency || { currencyName: "INR", currencyRate: 1, currencySymbol: "₹" });
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { compareItems } = useSelector((state) => state.compare);
  // Pass full list — ProductDescriptionInfo matches by productId+variantId
  const wishlistItemsForProduct = wishlistItems.filter(item => item.id === product.id);
  const compareItem = compareItems.find(item => item.id === product.id);

  const discountedPrice = getDiscountPrice(product.price, product.discount);
  const currencyRate = currency?.currencyRate || 1;
  const finalProductPrice = +(product.price * currencyRate).toFixed(2);
  const finalDiscountedPrice = +(discountedPrice * currencyRate).toFixed(2);

  const getVariantImages = (v) => {
    if (!v || !v.image) return [];
    if (Array.isArray(v.image)) return v.image;
    if (typeof v.image === 'string' && v.image.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(v.image);
        return Array.isArray(parsed) ? parsed : [v.image];
      } catch {
        return [v.image];
      }
    }
    return [v.image];
  };

  const getFirstImage = (imageField) => {
    if (!imageField) return null;
    if (Array.isArray(imageField)) return imageField[0];
    if (typeof imageField === 'string' && imageField.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(imageField);
        return Array.isArray(parsed) ? parsed[0] : imageField;
      } catch {
        return imageField;
      }
    }
    return imageField;
  };

  // Variant image override — set when customer picks a colour/variant that has its own image.
  // Initialise with the first variant's image so the gallery shows the variant (not product default) on load.
  const firstVariant = Array.isArray(product.Variants)
    ? product.Variants.find(v => {
        const imgs = getVariantImages(v);
        return imgs.length > 0;
      })
    : null;
  const firstVariantImage = firstVariant ? getVariantImages(firstVariant) : null;
  const [variantImage, setVariantImage] = useState(firstVariantImage);

  const mainSelectedImage = getFirstImage(variantImage);

  // Build gallery: selected variant image FIRST, then all OTHER variant images, then product-level images.
  // This populates the thumb strip even when product.image is empty (each variant has its own image).
  const allVariantImgs = Array.isArray(product.Variants)
    ? product.Variants.flatMap(v => getVariantImages(v)).filter(Boolean)
    : [];
  const productImgs = Array.isArray(product.image)
    ? product.image.filter(Boolean)
    : typeof product.image === "string"
      ? (() => { try { const p = JSON.parse(product.image); return Array.isArray(p) ? p.filter(Boolean) : [product.image]; } catch { return [product.image]; } })()
      : [];

  const buildGallery = () => {
    const selectedVariantImgs = variantImage ? getVariantImages({ image: variantImage }) : [];
    if (!selectedVariantImgs.length) {
      const extra = allVariantImgs.filter(img => !productImgs.includes(img));
      return [...productImgs, ...extra];
    }
    return selectedVariantImgs;
  };

  const galleryProduct = { ...product, image: buildGallery() };

  return (
    <div className={clsx("shop-area", spaceTopClass, spaceBottomClass)}>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-md-6">
            {galleryType === "leftThumb" ? (
              <ProductImageGallerySideThumb key={`${product.id}-${mainSelectedImage || "default"}`} product={galleryProduct} thumbPosition="left" />
            ) : galleryType === "rightThumb" ? (
              <ProductImageGallerySideThumb key={`${product.id}-${mainSelectedImage || "default"}`} product={galleryProduct} />
            ) : galleryType === "fixedImage" ? (
              <ProductImageFixed product={galleryProduct} />
            ) : (
              <ProductImageGallery product={galleryProduct} />
            )}
          </div>
          <div className="col-lg-6 col-md-6">
            <ProductDescriptionInfo
              product={product}
              discountedPrice={discountedPrice}
              currency={currency}
              finalDiscountedPrice={finalDiscountedPrice}
              finalProductPrice={finalProductPrice}
              cartItems={cartItems}
              wishlistItems={wishlistItemsForProduct}
              compareItem={compareItem}
              onVariantImageChange={setVariantImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ProductImageDescription.propTypes = {
  galleryType: PropTypes.string,
  product: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
};

export default ProductImageDescription;