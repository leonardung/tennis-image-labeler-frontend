import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coordinates, setCoordinates] = useState({});
  const [files, setFiles] = useState([]);
  const [folderPath, setFolderPath] = useState("");

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

  const handleSelectFolder = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.multiple = true;
    input.onchange = async (event) => {
      const selectedFiles = Array.from(event.target.files);
      const imageFiles = selectedFiles
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => URL.createObjectURL(file));
      setImages(imageFiles);
      setFiles(selectedFiles);
      setCurrentIndex(0);
      setCoordinates({});

      const path = selectedFiles[0]?.webkitRelativePath.split("/")[0];
      setFolderPath(path);

      // Load coordinates from backend
      try {
        const response = await axios.get(
          `http://localhost:8000/api/get-coordinates/?folder_path=${path}`
        );
        if (response.data) {
          setCoordinates(response.data.coordinates);
        }
      } catch (error) {
        console.error("Error loading coordinates: ", error);
      }
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
    const newCoordinates = {
      ...coordinates,
      [files[currentIndex].name]: { x, y },
    };
    setCoordinates(newCoordinates);
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

  const saveCoordinatesToBackend = async () => {
    const currentImage = files[currentIndex]?.name;
    if (coordinates[currentImage]) {
      const { x, y } = coordinates[currentImage];
      try {
        await axios.post("http://localhost:8000/api/save-coordinates/", {
          folder_path: folderPath,
          image_name: currentImage,
          x,
          y,
        });
      } catch (error) {
        console.error("Error saving coordinates: ", error);
      }
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
    for (let i = 0; i < files.length; i += 5) {
      const formData = new FormData();
      files.slice(i, i + 5).forEach((file) => {
        formData.append("images", file);
      });
      formData.append("folder_path", folderPath);

      try {
        const response = await axios.post(
          "http://localhost:8000/api/calculate-coordinates/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } catch (error) {
        console.error("Error uploading images: ", error);
      }
    }
  };

  // Main component rendering the application
  return (
    <div
      className="App"
      style={{ textAlign: "center", fontFamily: "Arial, sans-serif" }}
    >
      <header style={{ margin: "20px" }}>
        {/* Button to select a folder containing images */}
        <button
          onClick={handleSelectFolder}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
          }}
        >
          Select Folder
        </button>
      </header>

      {/* Check if there are images to display */}
      {images.length > 0 ? (
        <div>
          <div
            style={{
              border: "4px solid black",
              display: "inline-block",
              position: "relative",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              marginBottom: "20px",
              verticalAlign: "top",
            }}
          >
            {/* Display the current image */}
            <img
              id="image"
              src={images[currentIndex]}
              alt="Label"
              onClick={handleImageClick}
              style={{
                maxWidth: "100%",
                maxHeight: "72vh",
                cursor: "crosshair",
                display: "block",
              }}
            />

            {/* Display crosshairs at the labeled coordinate if available */}
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

          {/* Display the coordinates of the labeled point */}
          <p style={{ margin: "10px 0", fontSize: "18px" }}>
            Coordinates:{" "}
            {coordinates[files[currentIndex]?.name]
              ? `(${coordinates[files[currentIndex].name].x.toFixed(
                  2
                )}, ${coordinates[files[currentIndex].name].y.toFixed(2)})`
              : "None"}
          </p>

          {/* Buttons to navigate between images */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={handlePrevImage}
              disabled={currentIndex === 0}
              style={{
                padding: "10px 20px",
                marginRight: "10px",
                fontSize: "16px",
                borderRadius: "8px",
                cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                backgroundColor: currentIndex === 0 ? "#ccc" : "#2196F3",
                color: "white",
                border: "none",
              }}
            >
              Previous Image
            </button>
            <button
              onClick={handleNextImage}
              disabled={currentIndex === images.length - 1}
              style={{
                padding: "10px 20px",
                marginRight: "10px",
                fontSize: "16px",
                borderRadius: "8px",
                cursor:
                  currentIndex === images.length - 1
                    ? "not-allowed"
                    : "pointer",
                backgroundColor:
                  currentIndex === images.length - 1 ? "#ccc" : "#2196F3",
                color: "white",
                border: "none",
              }}
            >
              Next Image
            </button>
          </div>

          {/* Buttons to save labels or use a model for labeling */}
          <div>
            <button
              onClick={saveCoordinatesToBackend}
              style={{
                padding: "10px 20px",
                marginRight: "10px",
                fontSize: "16px",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: "#FF9800",
                color: "white",
                border: "none",
              }}
            >
              Save Labels to Database
            </button>
            <button
              onClick={handleSaveLabels}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                borderRadius: "8px",
                marginRight: "10px",
                cursor: "pointer",
                backgroundColor: "#FF9800",
                color: "white",
                border: "none",
              }}
            >
              Download Labels
            </button>
            <button
              onClick={handleUseModel}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: "#009688",
                color: "white",
                border: "none",
              }}
            >
              Use Model
            </button>
          </div>
        </div>
      ) : (
        // Message to display when no images are loaded
        <p style={{ fontSize: "18px", color: "#777" }}>
          No images loaded. Please select a folder.
        </p>
      )}
    </div>
  );
}

export default App;
