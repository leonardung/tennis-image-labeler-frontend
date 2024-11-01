// components/NavigationButtons.js
import React from "react";

const NavigationButtons = ({ onPrev, onNext, disablePrev, disableNext }) => (
  <div className="navigation-buttons">
    <button
      onClick={onPrev}
      disabled={disablePrev}
      className={`nav-button ${disablePrev ? "disabled" : ""}`}
    >
      Previous Image
    </button>
    <button
      onClick={onNext}
      disabled={disableNext}
      className={`nav-button ${disableNext ? "disabled" : ""}`}
    >
      Next Image
    </button>
  </div>
);

export default NavigationButtons;
