import PropTypes from "prop-types";
import React, { Fragment } from "react";

const ProductRating = ({ ratingValue }) => {
  const stars = [];
  const filled = Math.floor(ratingValue || 0);
  const hasHalf = (ratingValue || 0) - filled >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < filled) {
      // Fully filled star
      stars.push(<i className="fa fa-star" key={i} style={{ color: "#f5a623" }} />);
    } else if (i === filled && hasHalf) {
      // Half-filled star
      stars.push(<i className="fa fa-star-half-o" key={i} style={{ color: "#f5a623" }} />);
    } else {
      // Empty star
      stars.push(<i className="fa fa-star-o" key={i} style={{ color: "#ccc" }} />);
    }
  }

  return <Fragment>{stars}</Fragment>;
};

ProductRating.propTypes = {
  ratingValue: PropTypes.number
};

export default ProductRating;
