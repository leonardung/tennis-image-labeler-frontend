// ImageDisplay.js
import React from "react";

const ImageDisplay = ({ imageSrc, coordinates, fileName, onImageClick }) => {
  return (
    <div>
      {/* Display the current image */}
      <img
        id="image"
        src={imageSrc}
        alt="Label"
        onClick={(e) => {
          onImageClick(e);
        }}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'crosshair',
          display: 'block',
        }}
      />

      {/* Display crosshairs at the labeled coordinate if available */}
      {coordinates[fileName] && (
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            top: `${(coordinates[fileName].y / document.getElementById("image").naturalHeight) * 100}%`,
            left: `${(coordinates[fileName].x / document.getElementById("image").naturalWidth) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Horizontal part of the crosshair */}
          <div
            style={{
              position: "absolute",
              width: "20px",
              height: "2px",
              backgroundColor: "red",
              transform: "translate(-50%, -50%) rotate(0deg)",
            }}
          ></div>
          {/* Vertical part of the crosshair */}
          <div
            style={{
              position: "absolute",
              width: "20px",
              height: "2px",
              backgroundColor: "red",
              transform: "translate(-50%, -50%) rotate(90deg)",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
