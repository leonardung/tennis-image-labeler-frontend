// Thumbnail.js
import React, { useRef, useEffect } from "react";
import { FixedSizeGrid } from "react-window";

function ThumbnailGrid({ images, onThumbnailClick, currentIndex, coordinates, files }) {
  const gridRef = useRef(null);
  const columnCount = 4;
  const rowCount = Math.ceil(images.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= images.length) return null;

    const image = images[index];
    const hasCoordinates = coordinates[files[index].name]; // Assume image has a `name` property for identification

    return (
      <div
        style={style}
        className={`thumbnail-item ${index === currentIndex ? "selected" : ""}`}
        onClick={() => onThumbnailClick(index)}
      >
        <img
          src={image.thumbnailUrl || image.url}
          alt={`Thumbnail ${index}`}
          loading="lazy"
          className={!hasCoordinates ? "no-labels" : ""}
        />
        {/* Overlay with "No labels" text if coordinates are missing */}
        {!hasCoordinates && (
          <div className="no-labels-overlay">
            <span>No labels</span>
          </div>
        )}
      </div>
    );
  };


  useEffect(() => {
    if (gridRef.current) {
      const rowIndex = Math.floor(currentIndex / columnCount);
      const columnIndex = currentIndex % columnCount;

      gridRef.current.scrollToItem({
        rowIndex,
        columnIndex,
        align: "smart",
      });
    }
  }, [currentIndex]);

  return (
    <FixedSizeGrid
      ref={gridRef}
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={80}
      rowHeight={50}
      height={800}
      width={350}
    >
      {Cell}
    </FixedSizeGrid>
  );
}

export default ThumbnailGrid;
