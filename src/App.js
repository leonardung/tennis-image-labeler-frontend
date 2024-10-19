import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coordinates, setCoordinates] = useState({});
  const [imageFiles, setImageFiles] = useState([]);

  const handleSelectFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const imageURLs = imageFiles.map((file) => URL.createObjectURL(file));
      setImages(imageURLs);
      setImageFiles(imageFiles);
      setCurrentIndex(0);
      setCoordinates({});
    };
    input.click();
  };

  const handleImageClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setCoordinates((prev) => ({
      ...prev,
      [imageFiles[currentIndex].name]: { x, y },
    }));
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
            {coordinates[imageFiles[currentIndex]?.name]
              ? `(${coordinates[imageFiles[currentIndex].name].x}, ${
                  coordinates[imageFiles[currentIndex].name].y
                })`
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
