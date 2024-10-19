import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coordinates, setCoordinates] = useState({});

  const handleSelectFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files);
      const imageFiles = files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => URL.createObjectURL(file));
      setImages(imageFiles);
      setCurrentIndex(0);
      setCoordinates({});
    };
    input.click();
  };

  const handleImageClick = (event) => {
    const img = event.target;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    setCoordinates((prev) => ({ ...prev, [images[currentIndex]]: { x, y } }));
  };

  const handleNextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSaveLabels = () => {
    const csvContent = [
      ["image_name", "x", "y"],
      ...Object.entries(coordinates).map(([image, { x, y }]) => [image, x, y]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "labels.csv";
    a.click();
  };

  return (
    <div className="App">
      <button onClick={handleSelectFolder}>Select Folder</button>
      {images.length > 0 ? (
        <div>
          <img
            src={images[currentIndex]}
            alt="Label"
            onClick={handleImageClick}
            style={{ maxWidth: "100%", maxHeight: "80vh" }}
          />
          <p>
            Coordinates:{" "}
            {coordinates[images[currentIndex]]
              ? `(${coordinates[images[currentIndex]].x.toFixed(
                  2
                )}, ${coordinates[images[currentIndex]].y.toFixed(2)})`
              : "None"}
          </p>
          <button onClick={handlePrevImage} disabled={currentIndex === 0}>
            Previous Image
          </button>
          <button
            onClick={handleNextImage}
            disabled={currentIndex === images.length - 1}
          >
            Next Image
          </button>
          <button onClick={handleSaveLabels}>Save Labels</button>
        </div>
      ) : (
        <p>No images loaded. Please select a folder.</p>
      )}
    </div>
  );
}

export default App;
