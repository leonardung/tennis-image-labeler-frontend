import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coordinates, setCoordinates] = useState({});
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "a") {
        handlePrevImage();
      } else if (event.key === "d") {
        handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, images]);

  const handleSelectFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.multiple = true;
    input.onchange = (event) => {
      const selectedFiles = Array.from(event.target.files);
      const imageFiles = selectedFiles
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => URL.createObjectURL(file));
      setImages(imageFiles);
      setFiles(selectedFiles);
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
    setCoordinates((prev) => ({
      ...prev,
      [files[currentIndex].name]: { x, y },
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

  const handleUseModel = async () => {
    for (let i = 0; i < files.length; i += 10) {
      const formData = new FormData();
      files.slice(i, i + 10).forEach((file) => {
        formData.append("images", file);
      });

      try {
        const response = await axios.post(
          "http://localhost:8000/api/get-coordinates/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.data && response.data.coordinates) {
          setCoordinates((prev) => ({ ...prev, ...response.data.coordinates }));
        }
      } catch (error) {
        console.error("Error using model: ", error);
      }
    }
  };

  return (
    <div className="App">
      <button onClick={handleSelectFolder}>Select Folder</button>
      {images.length > 0 ? (
        <div>
          <div
            style={{
              border: "4px solid black",
              display: "inline-block",
              position: "relative",
            }}
          >
            <img
              id="image"
              src={images[currentIndex]}
              alt="Label"
              onClick={handleImageClick}
              style={{ maxWidth: "100%", maxHeight: "80vh" }}
            />
            {coordinates[files[currentIndex]?.name] && (
              <div
                style={{
                  position: "absolute",
                  pointerEvents: "none",
                  top: `${
                    (coordinates[files[currentIndex].name].y /
                      document.getElementById("image").naturalHeight) *
                    100
                  }%`,
                  left: `${
                    (coordinates[files[currentIndex].name].x /
                      document.getElementById("image").naturalWidth) *
                    100
                  }%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "2px",
                    backgroundColor: "red",
                    transform: "translate(-50%, -50%) rotate(0deg)",
                  }}
                ></div>
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
          <p>
            Coordinates:{" "}
            {coordinates[files[currentIndex]?.name]
              ? `(${coordinates[files[currentIndex].name].x.toFixed(
                  2
                )}, ${coordinates[files[currentIndex].name].y.toFixed(2)})`
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
          <button onClick={handleUseModel}>Use Model</button>
        </div>
      ) : (
        <p>No images loaded. Please select a folder.</p>
      )}
    </div>
  );
}

export default App;
