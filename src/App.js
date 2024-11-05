// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Container, Typography, Box, CssBaseline } from "@mui/material";

import ImageDisplay from "./components/ImageDisplay";
import NavigationButtons from "./components/NavigationButtons";
import Controls from "./components/Controls";
import ProgressBar from "./components/ProgressBar";
import ThumbnailGrid from "./components/ThumbnailGrid";

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
      const imageFiles = selectedFiles.filter((file) =>
        file.type.startsWith("image/")
      );
      setFiles(imageFiles);
      setCurrentIndex(0);
      setCoordinates({});

      const path = selectedFiles[0]?.webkitRelativePath.split("/")[0].split("\\")[0];
      setFolderPath(path);

      // Batch upload files
      const batchSize = 50; // Adjust based on your needs and server capacity
      for (let i = 0; i < imageFiles.length; i += batchSize) {
        const batchFiles = imageFiles.slice(i, i + batchSize);

        // Create FormData for the batch
        const formData = new FormData();
        formData.append("folder_path", path);
        batchFiles.forEach((file) => {
          formData.append("images", file);
        });

        // Upload the batch
        try {
          const response = await axios.post(
            "http://localhost:8000/api/upload-images/",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.data && response.data.images) {
            setImages((prevImages) => {
              const prevImagesMap = {};
              prevImages.forEach((img) => {
                prevImagesMap[img.id] = img;
              });

              // Merge existing images with new images, keeping existing coordinates
              const updatedImages = [
                ...prevImages, // keep previously loaded images
                ...response.data.images.map((newImage) => {
                  const existingImage = prevImagesMap[newImage.id];
                  if (existingImage) {
                    // Keep existing coordinates if they exist
                    return {
                      ...newImage,
                      coordinates:
                        existingImage.coordinates || newImage.coordinates,
                    };
                  } else {
                    // New image, add as is
                    return newImage;
                  }
                }),
              ];

              return updatedImages;
            });
          }
        } catch (error) {
          console.error("Error uploading batch: ", error);
          // Optionally handle the error, e.g., retry logic or user notification
        }
      }
    };
    input.click();
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

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
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
      await axios.post(
        "http://localhost:8000/api/save-coordinates/",
        {
          coordinates: coordinatesArray,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
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

  const handleUseModel = async () => {
    const totalImages = images.length;
    let processedImages = 0;
    setProgress(0);

    const socket = new WebSocket("ws://localhost:8000/ws/process-images/");

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          command: "process_images",
          folder_path: folderPath,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "success") {
        processedImages += 1;
        const newProgress = (processedImages / totalImages) * 100;
        setProgress(newProgress);
        const { image_name, x, y } = data.coordinates || {};

        if (image_name && x != null && y != null) {

          setCoordinates((prevCoordinates) => {
            return {
              ...prevCoordinates,
              [image_name]: { x, y },
            };
          });
        }
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
      if (response.data && response.data.coordinates) {
        // Transform the received data to match your application's state structure
        const newCoordinates = {};
        for (const [imageName, coords] of Object.entries(
          response.data.coordinates
        )) {
          // If multiple coordinates, you can decide how to store them
          // For this example, we'll store the first coordinate
          if (coords.length > 0) {
            newCoordinates[imageName] = coords[0]; // Or handle multiple coordinates as needed
          }
        }
        setCoordinates(newCoordinates);
      }
    } catch (error) {
      console.error("Error reloading coordinates: ", error);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, rgb(220,220,255) 0%, rgb(210,210,255) 100%)', // Gradient background
        color: 'white',
      }}
    >
      <CssBaseline />
      <Box mb={0} pt={2} pl={2}>
        <Button variant="contained" color="primary" onClick={handleSelectFolder}>
          Select Folder
        </Button>
      </Box>
      {images.length > 0 ? (
        <Box display="flex" flexGrow={1} p={2} height="100vh" overflow="auto">
          <Box width="350px" overflow="auto">
            <ThumbnailGrid
              images={images}
              onThumbnailClick={handleThumbnailClick}
              currentIndex={currentIndex}
              coordinates={coordinates}
              files={files}
            />
          </Box>
          <Box flexGrow={1} ml={2} display="flex" flexDirection="column" overflow="hidden">
            <Box display="flex" flexDirection="row" flexGrow={1} overflow="auto">
              <Box display="flex" flexDirection="column" flexGrow={1} overflow="auto">
                <Box flexGrow={1} display="flex" overflow="hidden">
                  <ImageDisplay
                    imageSrc={images[currentIndex].url}
                    coordinates={coordinates}
                    fileName={files[currentIndex]?.name}
                    onCoordinatesChange={(newCoordinates) => setCoordinates(newCoordinates)}
                  />
                </Box>
                <Box mr={1}>
                  <Typography variant="body1" color="textSecondary" fontWeight="bold">
                    {coordinates[files[currentIndex]?.name]
                      ? (
                        <>
                          x : {coordinates[files[currentIndex].name].x.toFixed(0)} |
                          y : {coordinates[files[currentIndex].name].y.toFixed(0)} 
                        </>
                      )
                      : 'No coordinates available'}
                  </Typography>
                  <ProgressBar progress={progress} />
                </Box>
              </Box>
              <Box
                width={60}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="flex-start"
              >
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
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          No images loaded. Please select a folder.
        </Typography>
      )
      }
    </Box >
  );

}

export default App;