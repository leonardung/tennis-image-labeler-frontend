// src/pages/ProjectsPage.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import {
  Button,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('point_coordinate');
  const { authTokens, logout } = useContext(AuthContext);
  const history = useHistory();
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    axios
      .get('http://localhost:8000/api/projects/', {
        headers: {
          Authorization: `Token ${authTokens.token}`,
        },
      })
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error('Error fetching projects:', error);
        if (error.response && error.response.status === 401) {
          logout();
          history.push('/login');
        }
      });
  }, [authTokens, logout, history]);

  const handleCreateProject = () => {
    axios
      .post(
        'http://localhost:8000/api/projects/',
        {
          name: newProjectName,
          type: newProjectType,
        },
        {
          headers: {
            Authorization: `Token ${authTokens.token}`,
          },
        }
      )
      .then((response) => {
        setProjects([...projects, response.data]);
        setNewProjectName('');
        setNewProjectType('point_coordinate');
        setNotification({
          open: true,
          message: 'Project created successfully',
          severity: 'success',
        });
      })
      .catch((error) => {
        console.error('Error creating project:', error);
        setNotification({
          open: true,
          message: 'Error creating project',
          severity: 'error',
        });
      });
  };

  const handleProjectClick = (projectId) => {
    history.push(`/projects/${projectId}`);
  };

  const handleNotificationClose = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box p={2}>
      <Typography variant="h4">Projects</Typography>
      <Box mt={2} display="flex" alignItems="center">
        <TextField
          label="Project Name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          required
        />
        <TextField
          label="Project Type"
          select
          value={newProjectType}
          onChange={(e) => setNewProjectType(e.target.value)}
          style={{ marginLeft: '1em' }}
        >
          <MenuItem value="point_coordinate">Point Coordinate</MenuItem>
          <MenuItem value="bounding_box">Bounding Box</MenuItem>
          <MenuItem value="segmentation">Segmentation</MenuItem>
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateProject}
          style={{ marginLeft: '1em' }}
        >
          Create Project
        </Button>
      </Box>
      <Box mt={4}>
        <List>
          {projects.map((project) => (
            <ListItem
              button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
            >
              <ListItemText primary={project.name} secondary={project.type} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectsPage;
