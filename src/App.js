// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Typography,
  Box,
  CssBaseline,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";

import ImageDisplayCoordinate from "./components/ImageDisplayCoordinate";
import ImageDisplaySegmentation from "./components/ImageDisplaySegmentation";
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
  const [isSegmentationMode, setIsSegmentationMode] = useState(true);
  const [masks, setMasks] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

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
      setLoading(true);
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
            "http://localhost:8000/api/images/",
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
          setNotification({
            open: true,
            message: "Error uploading batch",
            severity: "error",
          });
        } finally {
          setLoading(false);
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
    const allCoords = images.reduce((acc, image) => {
      const imageCoords = coordinates[image.id];
      if (imageCoords) {
        acc.push({ image_id: image.id, coordinates: [imageCoords] });
      }
      return acc;
    }, []);

    if (allCoords.length === 0) {
      setNotification({
        open: true,
        message: "No coordinates to save.",
        severity: "warning",
      });
      return;
    }

    try {
      await axios.post(
        `http://localhost:8000/api/images/save_all_coordinates/`,
        { all_coordinates: allCoords },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setNotification({
        open: true,
        message: "Coordinates saved successfully for all images.",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving coordinates: ", error);
      setNotification({
        open: true,
        message: "Error saving coordinates.",
        severity: "error",
      });
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

  const handleUseModel = () => {
    if (!folderPath) {
      setNotification({
        open: true,
        message: "Please select a folder first.",
        severity: "warning",
      });
      return;
    }

    setProgress(0);

    const socket = new WebSocket("ws://localhost:8000/ws/process-images/"); // Update the URL if necessary

    socket.onopen = () => {
      console.log("WebSocket connection established.");
      socket.send(
        JSON.stringify({
          folder_path: folderPath,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "success") {
        const { image_id, x, y } = data.coordinates || {};
        const progress = data.progress || 0;
        setProgress(progress);

        if (image_id && x != null && y != null) {
          setCoordinates((prevCoordinates) => ({
            ...prevCoordinates,
            [image_id]: { x, y },
          }));
        }
      } else if (data.status === "complete") {
        setNotification({
          open: true,
          message: "Coordinate labeling completed.",
          severity: "success",
        });
        socket.close();
      } else if (data.status === "error") {
        console.error("Error from server:", data.message);
        setNotification({
          open: true,
          message: `Error: ${data.message}`,
          severity: "error",
        });
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setNotification({
        open: true,
        message: "WebSocket error occurred.",
        severity: "error",
      });
      socket.close();
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed.");
      setTimeout(() => {
        setProgress(0);
      }, 3000);
    };
  };


  // Function to clear labels
  const handleClearLabels = () => {
    setCoordinates({});
    setNotification({
      open: true,
      message: "Labels cleared.",
      severity: "info",
    });
  };

  // Function to reload labels from the database
  const handleReloadFromDatabase = async () => {
    if (!folderPath) return;

    try {
      const response = await axios.get(
        `http://localhost:8000/api/images/folder_coordinates/`,
        { params: { folder_path: folderPath } }
      );
      if (response.data) {
        const newCoordinates = {};
        response.data.forEach((coord) => {
          newCoordinates[coord.image_id] = { x: coord.x, y: coord.y };
        });
        setCoordinates(newCoordinates);
        setNotification({
          open: true,
          message: "Coordinates reloaded from database.",
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Error reloading coordinates: ", error);
      setNotification({
        open: true,
        message: "Error reloading coordinates.",
        severity: "error",
      });
    }
  };


  // Handle notification close
  const handleNotificationClose = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, rgb(220,220,255) 0%, rgb(210,210,255) 100%)",
        color: "white",
      }}
    >
      <CssBaseline />
      <Box mb={1} pt={2} pl={2}>
        <Button variant="contained" color="primary" onClick={handleSelectFolder}>
          Select Folder
        </Button>
      </Box>
      {loading && <LinearProgress />}
      {images.length > 0 ? (
        <Box
          display="flex"
          flexGrow={1}
          p={2}
          height="100vh"
          overflow="auto"
        >
          <Box width="350px" overflow="auto">
            <ThumbnailGrid
              images={images}
              onThumbnailClick={handleThumbnailClick}
              currentIndex={currentIndex}
              coordinates={coordinates}
              files={files}
            />
          </Box>
          <Box
            flexGrow={1}
            ml={2}
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Box
              display="flex"
              flexDirection="row"
              flexGrow={1}
              overflow="auto"
            >
              <Box
                display="flex"
                flexDirection="column"
                flexGrow={1}
                overflow="auto"
              >
                <Box flexGrow={1} display="flex" overflow="hidden">
                  {isSegmentationMode ? (
                    <ImageDisplaySegmentation
                      image={images[currentIndex]}
                      previousMask={masks[images[currentIndex].id]}
                      onMaskChange={(newMask) => {
                        setMasks((prevMasks) => ({
                          ...prevMasks,
                          [images[currentIndex].id]: newMask,
                        }));
                      }}
                    />
                  ) : (
                    <ImageDisplayCoordinate
                      image={images[currentIndex]}
                      coordinates={coordinates}
                      onCoordinatesChange={(newCoordinates) =>
                        setCoordinates((prev) => ({
                          ...prev,
                          [images[currentIndex].id]: newCoordinates,
                        }))
                      }
                    />
                  )}
                </Box>
                <Box mr={1}>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    fontWeight="bold"
                  >
                    {coordinates[images[currentIndex].id] ? (
                      <>
                        x : {coordinates[images[currentIndex].id].x.toFixed(0)} |
                        y : {coordinates[images[currentIndex].id].y.toFixed(0)}
                      </>
                    ) : (
                      "No coordinates available"
                    )}
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
      )}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
