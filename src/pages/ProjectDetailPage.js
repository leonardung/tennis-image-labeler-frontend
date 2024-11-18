// src/pages/ProjectDetailPage.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';
import {
  Button,
  Typography,
  Box,
  CssBaseline,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';

import { AuthContext } from '../contexts/AuthContext';
import ImageDisplayCoordinate from '../components/ImageDisplayCoordinate';
import ImageDisplaySegmentation from '../components/ImageDisplaySegmentation';
import NavigationButtons from '../components/NavigationButtons';
import Controls from '../components/Controls';
import ProgressBar from '../components/ProgressBar';
import ThumbnailGrid from '../components/ThumbnailGrid';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const history = useHistory();
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coordinates, setCoordinates] = useState({});
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [masks, setMasks] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const { authTokens, logout } = useContext(AuthContext);

  useEffect(() => {
    // Fetch project details
    axios
      .get(`http://localhost:8000/api/projects/${projectId}/`, {
        headers: {
          Authorization: `Token ${authTokens.token}`,
        },
      })
      .then((response) => {
        setProject(response.data);
        setImages(response.data.images || []);
      })
      .catch((error) => {
        console.error('Error fetching project:', error);
        if (error.response && error.response.status === 401) {
          logout();
          history.push('/login');
        }
      });
  }, [projectId, authTokens, logout, history]);

  // ... (Rest of your state and functions, adjusted accordingly)

  // Handle image upload and associate with the project
  const handleSelectFolder = async () => {
    // ... (Your existing code to select files)
    // Adjust the upload code to include project_id and auth token
    // When uploading images, include the project_id
    const formData = new FormData();
    formData.append('project_id', projectId);
    // ... (Append images to formData)
    // Include the Authorization header
    try {
      const response = await axios.post('http://localhost:8000/api/images/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Token ${authTokens.token}`,
        },
      });
      // ... (Handle the response)
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  // ... (Adjust other functions to include auth token in headers)

  if (!project) {
    return (
      <Box p={2}>
        <Typography variant="h6">Loading project...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(135deg, rgb(220,220,255) 0%, rgb(210,210,255) 100%)',
        color: 'white',
      }}
    >
      <CssBaseline />
      <Box mb={1} pt={2} pl={2} display="flex" alignItems="center">
        <Typography variant="h5">{project.name}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSelectFolder}
          style={{ marginLeft: 'auto', marginRight: '1em' }}
        >
          Upload Images
        </Button>
        <Button variant="outlined" color="secondary" onClick={logout}>
          Logout
        </Button>
      </Box>
      {loading && <LinearProgress />}
      {images.length > 0 ? (
        <Box display="flex" flexGrow={1} p={2} height="100vh" overflow="auto">
          {/* ... (Rest of your original App.js UI code) */}
        </Box>
      ) : (
        <Typography variant="body1" color="textSecondary" align="center">
          No images loaded. Please upload images.
        </Typography>
      )}
      {/* ... (Notification Snackbar) */}
    </Box>
  );
};

export default ProjectDetailPage;
