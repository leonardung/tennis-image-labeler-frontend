// components/ImageDisplay.js
import React, { useRef, useEffect, useState } from "react";

const ImageDisplay = ({ imageSrc, coordinates, onImageClick, imageName }) => {
  const imageRef = useRef(null);
  const [crosshairPosition, setCrosshairPosition] = useState(null);

  // Update crosshair position when image or coordinates change
  useEffect(() => {
    const updateCrosshairPosition = () => {
      if (imageRef.current && coordinates[imageName]) {
        const img = imageRef.current;
        const xPercent = (coordinates[imageName].x / img.naturalWidth) * 100;
        const yPercent = (coordinates[imageName].y / img.naturalHeight) * 100;
        setCrosshairPosition({ xPercent, yPercent });
      } else {
        setCrosshairPosition(null);
      }
    };

    updateCrosshairPosition();
  }, [coordinates, imageName]);

  return (
    <div className="image-container">
      <img
        ref={imageRef}
        src={imageSrc}
        alt="Label"
        onClick={onImageClick}
        className="label-image"
      />
      {crosshairPosition && (
        <div
          className="crosshair"
          style={{
            top: `${crosshairPosition.yPercent}%`,
            left: `${crosshairPosition.xPercent}%`,
          }}
        >
          {/* Horizontal line */}
          <div className="horizontal-line"></div>
          {/* Vertical line */}
          <div className="vertical-line"></div>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
