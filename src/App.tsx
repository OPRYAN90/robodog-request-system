import React, { useState, useCallback, useMemo } from 'react';
import { LoadScript } from '@react-google-maps/api';
import Map from './components/Map';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Paper, useMediaQuery, Snackbar, Alert } from '@mui/material';
import { Path } from './types';

// Create a custom theme with RoboDog colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // Indigo blue
    },
    secondary: {
      main: '#ff9800', // Orange for accent
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Google Maps API key - replace with your actual key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBrCZ86Rr2_kAD4Udb_TaU4i-jnAd4Es2w';

// Custom event for updating paths
const dispatchPathsUpdatedEvent = () => {
  window.dispatchEvent(new Event('pathsUpdated'));
};

function App() {
  // Libraries needed for Google Maps - moved inside component
  const mapLibraries = useMemo(() => ['places', 'geometry'], []);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const [statusAlert, setStatusAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handlePathAdded = useCallback((newPath: Path) => {
    setPaths(prev => [newPath, ...prev]);
    
    setStatusAlert({
      open: true,
      message: `New path "${newPath.name}" created successfully`,
      severity: 'success'
    });
    
    // Auto-open sidebar when first path is added
    if (paths.length === 0) {
      setSidebarOpen(true);
    }
    
    // Notify the Map component that paths have been updated
    dispatchPathsUpdatedEvent();
  }, [paths.length]);
  
  const handlePathUpdate = useCallback((updatedPath: Path) => {
    setPaths(prevPaths => 
      prevPaths.map(path => 
        path.id === updatedPath.id ? updatedPath : path
      )
    );
    
    // Notify the Map component that paths have been updated
    dispatchPathsUpdatedEvent();
  }, []);
  
  const handlePathActivate = useCallback((pathId: string) => {
    // Only one path can be active at a time
    setPaths(prevPaths => 
      prevPaths.map(path => ({
        ...path,
        isActive: path.id === pathId,
        status: path.id === pathId ? 'in-progress' : path.status
      }))
    );
    
    // Show status update notification
    setStatusAlert({
      open: true,
      message: 'RoboDog is now following the path!',
      severity: 'info'
    });
    
    // Notify the Map component that paths have been updated
    dispatchPathsUpdatedEvent();
  }, []);
  
  const handlePathDelete = useCallback((pathId: string) => {
    // Find the path to show the name in the alert
    const pathToDelete = paths.find(path => path.id === pathId);
    
    // Remove the path from state
    setPaths(prevPaths => prevPaths.filter(path => path.id !== pathId));
    
    // Show deletion notification
    setStatusAlert({
      open: true,
      message: pathToDelete ? `Path "${pathToDelete.name}" has been deleted` : 'Path has been deleted',
      severity: 'info'
    });
    
    // Notify the Map component that paths have been updated
    dispatchPathsUpdatedEvent();
  }, [paths]);
  
  const handleCloseAlert = useCallback(() => {
    setStatusAlert(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header onToggleSidebar={handleToggleSidebar} />
        <Container 
          maxWidth={false} 
          sx={{ 
            flexGrow: 1, 
            p: isSmallScreen ? 1 : 2,
            display: 'flex',
            overflow: 'hidden'
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              width: '100%', 
              height: '100%', 
              overflow: 'hidden',
              display: 'flex',
              position: 'relative'
            }}
          >
            <LoadScript 
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
              libraries={mapLibraries}
            >
              <Map 
                onPathAdded={handlePathAdded} 
                paths={paths}
                onPathUpdate={handlePathUpdate}
                onPathActivate={handlePathActivate}
                onPathDelete={handlePathDelete}
              />
            </LoadScript>
          </Paper>
        </Container>
        <Sidebar 
          open={sidebarOpen} 
          onClose={handleToggleSidebar} 
          paths={paths} 
          onPathUpdate={handlePathUpdate}
          onPathActivate={handlePathActivate}
          onPathDelete={handlePathDelete}
        />
        
        <Snackbar
          open={statusAlert.open}
          autoHideDuration={4000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity={statusAlert.severity}
            variant="filled"
          >
            {statusAlert.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App; 