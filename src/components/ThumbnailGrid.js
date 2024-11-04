import React, { useRef, useEffect } from "react";
import { FixedSizeGrid } from "react-window";

function ThumbnailGrid({ images, onThumbnailClick, currentIndex }) {
  const gridRef = useRef(null);
  const columnCount = 3;
  const rowCount = Math.ceil(images.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= images.length) return null;

    const image = images[index];
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
        />
      </div>
    );
  };

  useEffect(() => {
    if (gridRef.current) {
      // Calculate the row and column of the current index
      const rowIndex = Math.floor(currentIndex / columnCount);
      const columnIndex = currentIndex % columnCount;

      // Scroll to the item if it's not visible
      gridRef.current.scrollToItem({
        rowIndex,
        columnIndex,
        align: "smart", // 'smart' aligns to the nearest edge only if out of view
      });
    }
  }, [currentIndex]);

  return (
    <FixedSizeGrid
      ref={gridRef}
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={66} // Adjust as needed
      rowHeight={66}
      height={600} // Adjust as needed
      width={200}
    >
      {Cell}
    </FixedSizeGrid>
  );
}

export default ThumbnailGrid;
