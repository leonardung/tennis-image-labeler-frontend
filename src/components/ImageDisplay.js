import React, { useRef, useEffect, useState } from "react";

const ImageDisplay = ({ imageSrc, coordinates, fileName, onImageClick }) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const updateImageDimensions = () => {
    if (imageRef.current && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;

      const containerAspectRatio = containerWidth / containerHeight;
      const imageAspectRatio = naturalWidth / naturalHeight;

      let displayWidth, displayHeight;

      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
      } else {
        // Image is taller than container
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
      }

      setImageDimensions({ width: displayWidth, height: displayHeight });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateImageDimensions);
    return () => window.removeEventListener('resize', updateImageDimensions);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: '100%',
        height: '80vh', // Adjust as needed
        overflow: 'hidden',
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        marginBottom: "10px",
      }}
    >
      {/* Display the current image */}
      <img
        ref={imageRef}
        src={imageSrc}
        alt="Label"
        onClick={(e) => {
          onImageClick(e);
          updateImageDimensions(); // Ensure dimensions are updated after click
        }}
        onLoad={updateImageDimensions}
        style={{
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
            top: `${
              ((coordinates[fileName].y / imageRef.current.naturalHeight) * imageDimensions.height) +
              (containerRef.current.clientHeight - imageDimensions.height) / 2
            }px`,
            left: `${
              ((coordinates[fileName].x / imageRef.current.naturalWidth) * imageDimensions.width) +
              (containerRef.current.clientWidth - imageDimensions.width) / 2
            }px`,
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
