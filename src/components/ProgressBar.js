// components/ProgressBar.js
import React from "react";

const ProgressBar = ({ progress }) => (
  <div className="progress-bar-container">
    <div className="progress-bar-background">
      <div
        className="progress-bar-foreground"
        style={{ width: `${progress}%` }}
      ></div>
      <div className="progress-bar-text">{`${Math.round(progress)}%`}</div>
    </div>
  </div>
);

export default ProgressBar;
