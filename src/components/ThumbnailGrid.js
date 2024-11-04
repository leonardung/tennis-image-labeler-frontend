import React, { useRef, useEffect } from "react";
import { FixedSizeGrid } from "react-window";
import { Box, Typography } from "@mui/material";

function ThumbnailGrid({ images, onThumbnailClick, currentIndex, coordinates, files }) {
  const gridRef = useRef(null);
  const columnCount = 4;
  const rowCount = Math.ceil(images.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= images.length) return null;

    const image = images[index];
    const hasCoordinates = coordinates[files[index].name];

    return (
      <Box
        style={style}
        onClick={() => onThumbnailClick(index)}
        border={index === currentIndex ? 2 : 0}
        borderColor="primary.main"
        sx={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <img
          src={image.thumbnailUrl || image.url}
          alt={`Thumbnail ${index}`}
          loading="lazy"
          style={{ width: "100%", height: "100%", opacity: hasCoordinates ? 1 : 0.7 }}
        />
        {!hasCoordinates && (
          <Box position="absolute" top={0} left={0} width="100%" height="100%" display="flex" justifyContent="center" alignItems="center" bgcolor="rgba(0,0,0,0.5)">
            <Typography variant="caption" color="white">No labels</Typography>
          </Box>
        )}
      </Box>
    );
  };

  useEffect(() => {
    if (gridRef.current) {
      const rowIndex = Math.floor(currentIndex / columnCount);
      const columnIndex = currentIndex % columnCount;
      gridRef.current.scrollToItem({ rowIndex, columnIndex, align: "smart" });
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
