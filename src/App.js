// App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import "./components/NavigationButtons.css";
import "./components/ImageDisplay.css";
import "./components/Controls.css";
import "./components/ProgressBar.css";
import axios from "axios";

import ImageDisplay from "./components/ImageDisplay";
import NavigationButtons from "./components/NavigationButtons";
import Controls from "./components/Controls";
import ProgressBar from "./components/ProgressBar";

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coordinates, setCoordinates] = useState({});
  const [files, setFiles] = useState([]);
  const [folderPath, setFolderPath] = useState("");
  const [progress, setProgress] = useState(0);

  // Handle keyboard navigation
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

  // Function to select a folder and load images
  const handleSelectFolder = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true; // Note: This is a non-standard attribute
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

  // Function to handle image click and record coordinates
  const handleImageClick = (event) => {
    const img = event.target;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const imageName = files[currentIndex].name;
    const newCoordinates = {
      ...coordinates,
      [imageName]: { x, y },
    };
    setCoordinates(newCoordinates);
  };

  // Navigation functions
  const handleNextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  // Function to save coordinates to backend
  const saveCoordinatesToBackend = async () => {
    const coordinatesArray = Object.keys(coordinates).map((imageName) => {
      const { x, y } = coordinates[imageName];
      return {
        folder_path: folderPath,
        image_name: imageName,
        x,
        y,
      };
    });

    try {
      await axios.post("http://localhost:8000/api/save-coordinates/", {
        coordinates: coordinatesArray,
      });
    } catch (error) {
      console.error("Error saving coordinates: ", error);
    }
  };

  // Function to download labels as CSV
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

  // Function to use the model for labeling
  const handleUseModel = () => {
    const batchSize = 200;
    const stepSize = 197;
    const totalBatches = Math.ceil((files.length - batchSize) / stepSize) + 1;
    let batchesProcessed = 0;
    let currentBatchIndex = 0;

    // Establish WebSocket connection
    const socket = new WebSocket("ws://localhost:8000/ws/process-images/");

    socket.onopen = () => {
      sendNextBatch();
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "success") {
        batchesProcessed += 1;
        // Update progress
        const newProgress = (batchesProcessed / totalBatches) * 100;
        setProgress(newProgress);

        // Handle received coordinates
        const newCoordinates = data.coordinates;

        // Update the coordinates state
        setCoordinates((prevCoordinates) => {
          return { ...prevCoordinates, ...newCoordinates };
        });

        // Send next batch
        sendNextBatch();
      } else {
        console.error("Error from server:", data.message);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    function sendNextBatch() {
      if (currentBatchIndex <= files.length) {
        const batchFiles = files.slice(
          currentBatchIndex,
          currentBatchIndex + batchSize
        );

        const imagesDataPromises = batchFiles.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64Content = event.target.result.split(",")[1];
              resolve({
                name: file.name,
                content: base64Content,
              });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
        });

        Promise.all(imagesDataPromises)
          .then((images) => {
            // Send data via WebSocket
            socket.send(
              JSON.stringify({
                images: images,
                folder_path: folderPath,
              })
            );
          })
          .catch((error) => {
            console.error("Error reading files:", error);
          });

        currentBatchIndex += stepSize;
      } else {
        // All batches have been processed
        socket.close();
      }
    }
  };

  // Function to clear labels
  const handleClearLabels = () => {
    setCoordinates({});
  };

  // Function to reload labels from the database
  const handleReloadFromDatabase = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/get-coordinates/?folder_path=${folderPath}`
      );
      if (response.data) {
        setCoordinates(response.data.coordinates);
      }
    } catch (error) {
      console.error("Error reloading coordinates: ", error);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <button className="select-folder-button" onClick={handleSelectFolder}>
          Select Folder
        </button>
      </header>
      {images.length > 0 ? (
        <div>
          <ImageDisplay
            imageSrc={images[currentIndex]}
            coordinates={coordinates}
            fileName={files[currentIndex]?.name}
            onImageClick={handleImageClick}
          />

          <p className="coordinates-text">
            Coordinates:{" "}
            {coordinates[files[currentIndex]?.name]
              ? `(${coordinates[files[currentIndex].name].x.toFixed(
                  2
                )}, ${coordinates[files[currentIndex].name].y.toFixed(2)})`
              : "None"}
          </p>
          <NavigationButtons
            onPrev={handlePrevImage}
            onNext={handleNextImage}
            disablePrev={currentIndex === 0}
            disableNext={currentIndex === images.length - 1}
          />
          <Controls
            onSaveToDatabase={saveCoordinatesToBackend}
            onDownloadLabels={handleSaveLabels}
            onUseModel={handleUseModel}
            onClearLabels={handleClearLabels}
            onReloadFromDatabase={handleReloadFromDatabase}
          />
          <ProgressBar progress={progress} />
        </div>
      ) : (
        <p className="no-images-text">
          No images loaded. Please select a folder.
        </p>
      )}
    </div>
  );
}

export default App;
