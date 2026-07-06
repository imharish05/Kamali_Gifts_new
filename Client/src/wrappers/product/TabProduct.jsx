import PropTypes from "prop-types";
import clsx from "clsx";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import ProductGrid from "./ProductGrid";
import { getProducts } from "../../helpers/product";

const SECTIONS = [
  { key: "customisable", label: "Customisable", emoji: "🎨", type: "customisable" },
  { key: "newArrival",   label: "New Arrivals",  emoji: "✨", type: "newArrival"   },
  { key: "hotDeals",     label: "Hot Deals",     emoji: "🔥", type: "hotDeals"     },
];

const TabProduct = ({ spaceTopClass, spaceBottomClass, bgColorClass, category }) => {
  const { products } = useSelector((state) => state.product);

  const sectionData = SECTIONS.map((s) => ({
    ...s,
    items: getProducts(products, category, s.type) || [],
  })).filter((s) => s.items.length > 0);

  if (sectionData.length === 0) return null;

  return (
    <div className={clsx("deals-area pb-30 pt-30", bgColorClass)}>
      <div className="container">
        <div className="section-title text-center mb-50">
          <h2 className="event-title pb-2">Daily Deals</h2>
          <div className="event-subtitle">Custom creations that speak louder than words</div>
        </div>

        <div className="deals-sections">
          {sectionData.map((section, idx) => (
            <DealSection
              key={section.key}
              section={section}
              isLast={idx === sectionData.length - 1}
              category={category}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const DealSection = ({ section, isLast, category }) => {
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine items per page based on window width
  let itemsPerPage = 5;
  if (windowWidth < 768) {
    itemsPerPage = 2;
  } else if (windowWidth < 992) {
    itemsPerPage = 3;
  } else if (windowWidth < 1200) {
    itemsPerPage = 4;
  } else {
    itemsPerPage = 5;
  }

  // Chunk section.items into pages
  const pages = [];
  const items = section.items || [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }
  const totalPages = pages.length;

  const scrollToPage = useCallback((idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    el.scrollTo({ left: idx * pageWidth, behavior: "smooth" });
  }, []);

  const goToPage = useCallback((idx) => {
    const target = Math.max(0, Math.min(idx, totalPages - 1));
    scrollToPage(target);
    setPage(target);
  }, [totalPages, scrollToPage]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPage(idx);
  }, []);

  useEffect(() => {
    setPage(0);
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = 0;
    }
  }, [section.items, totalPages]);

  return (
    <div className={clsx("deal-section", !isLast && "deal-section--divider")}>
      <div className="deal-section__header">
        <div className="deal-section__title text-center">
          <span className="deal-section__emoji">{section.emoji}</span>
          <h3 className="deal-section__name">{section.label}</h3>
        </div>
      </div>

      <div className="deal-scroll-wrapper">
        <button
          className={clsx("deal-arrow deal-arrow--left", page === 0 && "deal-arrow--hidden")}
          onClick={() => goToPage(page - 1)}
          aria-label="Scroll left"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="deal-page-scroll-track" ref={scrollRef} onScroll={onScroll}>
          {pages.map((pageProds, pIdx) => (
            <div className="deal-page-scroll-page" key={pIdx}>
              <div className="deal-page-scroll-grid">
                <ProductGrid
                  category={category}
                  type={section.type}
                  sectionType={section.type}
                  limit={itemsPerPage}
                  spaceBottomClass="mb-0"
                  productsList={pageProds}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className={clsx("deal-arrow deal-arrow--right", page >= totalPages - 1 && "deal-arrow--hidden")}
          onClick={() => goToPage(page + 1)}
          aria-label="Scroll right"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

TabProduct.propTypes = {
  bgColorClass: PropTypes.string,
  category: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
};

export default TabProduct;