// src/App.js
import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <PrivateRoute exact path="/" component={ProjectsPage} />
        <PrivateRoute path="/projects/:projectId" component={ProjectDetailPage} />
        <Redirect to="/" />
      </Switch>
    </AuthProvider>
  );
}

export default App;
