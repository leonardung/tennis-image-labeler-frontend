import React, { useRef, useState, useEffect } from "react";

const ImageDisplay = ({ imageSrc, coordinates, fileName, onCoordinatesChange }) => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const [displayParams, setDisplayParams] = useState(null);

  const calculateDisplayParams = () => {
    if (!imageRef.current || !containerRef.current) {
      return;
    }

    const img = imageRef.current;
    const container = containerRef.current;

    const containerRect = container.getBoundingClientRect();

    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const imgAspectRatio = imgNaturalWidth / imgNaturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayedWidth, displayedHeight, offsetX, offsetY;

    if (containerAspectRatio > imgAspectRatio) {
      // Image fills container's height, letterboxed horizontally
      displayedHeight = containerHeight;
      displayedWidth = containerHeight * imgAspectRatio;
      offsetX = (containerWidth - displayedWidth) / 2;
      offsetY = 0;
    } else {
      // Image fills container's width, letterboxed vertically
      displayedWidth = containerWidth;
      displayedHeight = containerWidth / imgAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayedHeight) / 2;
    }

    setDisplayParams({
      displayedWidth,
      displayedHeight,
      offsetX,
      offsetY,
    });
  };

  useEffect(() => {
    calculateDisplayParams();

    window.addEventListener("resize", calculateDisplayParams);
    return () => {
      window.removeEventListener("resize", calculateDisplayParams);
    };
  }, [imageSrc]);

  const handleImageClick = (event) => {
    if (!displayParams || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const { displayedWidth, displayedHeight, offsetX, offsetY } = displayParams;
    const imgNaturalWidth = imageRef.current.naturalWidth;
    const imgNaturalHeight = imageRef.current.naturalHeight;

    // Get click position relative to the container
    const clickX = event.clientX - containerRect.left;
    const clickY = event.clientY - containerRect.top;

    // Check if click is within the displayed image area
    if (
      clickX < offsetX ||
      clickX > offsetX + displayedWidth ||
      clickY < offsetY ||
      clickY > offsetY + displayedHeight
    ) {
      // Click is outside the image
      return;
    }

    // Calculate click position relative to the image
    const xInImage = clickX - offsetX;
    const yInImage = clickY - offsetY;

    // Scale coordinates to natural image size
    const scaleX = imgNaturalWidth / displayedWidth;
    const scaleY = imgNaturalHeight / displayedHeight;

    const x = xInImage * scaleX;
    const y = yInImage * scaleY;

    // Update coordinates
    const newCoordinates = {
      ...coordinates,
      [fileName]: { x, y },
    };
    onCoordinatesChange(newCoordinates);
  };

  const getCrosshairPosition = () => {
    if (!coordinates[fileName] || !displayParams) {
      return { top: 0, left: 0 };
    }

    const { displayedWidth, displayedHeight, offsetX, offsetY } = displayParams;
    const imgNaturalWidth = imageRef.current.naturalWidth;
    const imgNaturalHeight = imageRef.current.naturalHeight;

    // Scale coordinates from natural image size to displayed size
    const scaleX = displayedWidth / imgNaturalWidth;
    const scaleY = displayedHeight / imgNaturalHeight;

    const x = coordinates[fileName].x * scaleX + offsetX;
    const y = coordinates[fileName].y * scaleY + offsetY;

    return {
      top: y,
      left: x,
    };
  };

  const crosshairPosition = getCrosshairPosition();

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* Display the current image */}
      <img
        ref={imageRef}
        src={imageSrc}
        alt="Label"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />

      {/* Overlay for cursor and click handling */}
      {displayParams && (
        <div
          onClick={handleImageClick}
          style={{
            position: "absolute",
            top: `${displayParams.offsetY}px`,
            left: `${displayParams.offsetX}px`,
            width: `${displayParams.displayedWidth}px`,
            height: `${displayParams.displayedHeight}px`,
            cursor: "crosshair",
          }}
        ></div>
      )}

      {/* Display crosshairs at the labeled coordinate if available */}
      {coordinates[fileName] && (
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            top: `${crosshairPosition.top}px`,
            left: `${crosshairPosition.left}px`,
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
