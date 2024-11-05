import React, { useRef, useState, useEffect } from "react";
import { Checkbox, FormControlLabel, Box, Typography} from "@mui/material";

const ImageDisplay = ({
  imageSrc,
  coordinates,
  fileName,
  onCoordinatesChange,
}) => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // State variables
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // State to track if the Shift key is pressed
  const [ShiftKeyPress, setShiftKeyPress] = useState(false);

  // State for the toggle to keep or reset zoom and pan
  const [keepZoomPan, setKeepZoomPan] = useState(true);

  const calculateDisplayParams = () => {
    if (!imageRef.current || !containerRef.current) {
      return;
    }

    const img = imageRef.current;

    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    setImgDimensions({ width: imgNaturalWidth, height: imgNaturalHeight });
  };

  // Function to initialize zoomLevel and panOffset
  const initializeZoomPan = () => {
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

    const scaleX = containerWidth / imgNaturalWidth;
    const scaleY = containerHeight / imgNaturalHeight;

    // Initial zoom level to fit the image into the container
    const initialZoomLevel = Math.min(scaleX, scaleY);

    // Center the image in the container
    const initialPanOffsetX =
      (containerWidth - imgNaturalWidth * initialZoomLevel) / 2;
    const initialPanOffsetY =
      (containerHeight - imgNaturalHeight * initialZoomLevel) / 2;

    setZoomLevel(initialZoomLevel);
    setPanOffset({ x: initialPanOffsetX, y: initialPanOffsetY });
  };

  // useEffect to initialize zoomLevel and panOffset when the component mounts or when imageSrc changes
  useEffect(() => {
    if (!keepZoomPan) {
      initializeZoomPan();
    }
  }, [imageSrc, keepZoomPan]);

  useEffect(() => {
    // Recalculate image dimensions when the image source changes
    calculateDisplayParams();

    window.addEventListener("resize", calculateDisplayParams);

    // Event listeners to track Shift key state
    const handleKeyDown = (event) => {
      if (event.key === "Shift") {
        setShiftKeyPress(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Shift") {
        setShiftKeyPress(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("resize", calculateDisplayParams);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [imageSrc]);

  const handleWheel = (event) => {
    event.preventDefault(); // Prevent default browser zoom behavior

    if (!containerRef.current) return;

    const { clientX, clientY } = event;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = clientX - containerRect.left;
    const y = clientY - containerRect.top;

    // Determine the new zoom level
    const delta = event.deltaY;
    let newZoomLevel = zoomLevel * (delta > 0 ? 0.85 : 1.15);
    newZoomLevel = Math.max(0.25, Math.min(newZoomLevel, 5)); // Limit zoom level

    const zoomFactor = newZoomLevel / zoomLevel;

    // Adjust pan offset to keep the image centered on the cursor
    const newPanOffsetX = x - (x - panOffset.x) * zoomFactor;
    const newPanOffsetY = y - (y - panOffset.y) * zoomFactor;

    setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
    setZoomLevel(newZoomLevel);
  };

  const handleMouseDown = (event) => {
    if (!event.shiftKey) return; // Only initiate panning when Shift key is pressed
    event.preventDefault();

    setIsPanning(true);
    setPanStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    if (!isPanning) return;

    const deltaX = event.clientX - panStart.x;
    const deltaY = event.clientY - panStart.y;

    setPanStart({ x: event.clientX, y: event.clientY });

    setPanOffset((prevPanOffset) => ({
      x: prevPanOffset.x + deltaX,
      y: prevPanOffset.y + deltaY,
    }));
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleImageClick = (event) => {
    // Prevent click handling when panning or Shift key is pressed
    if (isPanning || ShiftKeyPress) return;

    if (!containerRef.current || !imageRef.current) {
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const clickX = event.clientX - containerRect.left;
    const clickY = event.clientY - containerRect.top;

    // Convert click position to image coordinates
    const imgX = (clickX - panOffset.x) / zoomLevel;
    const imgY = (clickY - panOffset.y) / zoomLevel;

    // Check if click is within the image bounds
    if (
      imgX < 0 ||
      imgX > imgDimensions.width ||
      imgY < 0 ||
      imgY > imgDimensions.height
    ) {
      return;
    }

    // Update coordinates
    const newCoordinates = {
      ...coordinates,
      [fileName]: { x: imgX, y: imgY },
    };
    onCoordinatesChange(newCoordinates);
  };

  const getCrosshairPosition = () => {
    if (!coordinates[fileName]) {
      return { top: 0, left: 0 };
    }

    const x = coordinates[fileName].x * zoomLevel + panOffset.x;
    const y = coordinates[fileName].y * zoomLevel + panOffset.y;

    return {
      top: y,
      left: x,
    };
  };

  const crosshairPosition = getCrosshairPosition();

  // Handler for the toggle
  const handleToggleChange = () => {
    setKeepZoomPan((prevValue) => !prevValue);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Toggle for keeping zoom and pan */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1,
          backgroundColor: "rgba(250,250,250, 0.4)", // half-transparent gray
          paddingLeft: 1,
          borderRadius: 1,
          color: "black"
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={keepZoomPan}
              onChange={handleToggleChange}
              color="primary"
            />
          }
          label={<Typography sx={{ fontWeight: "bold" }}>Keep Zoom and Pan</Typography>}
        />
      </Box>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          cursor: ShiftKeyPress ? (isPanning ? "grabbing" : "grab") : "crosshair",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleImageClick}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Label"
          onLoad={calculateDisplayParams}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${imgDimensions.width}px`,
            height: `${imgDimensions.height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            userSelect: "none",
            pointerEvents: "none", // Ensure mouse events pass through the image
          }}
        />

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
    </div>
  );
};

export default ImageDisplay;
