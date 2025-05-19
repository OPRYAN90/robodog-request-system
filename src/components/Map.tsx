import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  LinearProgress,
  Fab,
  Divider,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DirectionsIcon from '@mui/icons-material/Directions';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';
import { PathFormData, Path, PathLocation } from '../types';

// Canyon Crest Academy coordinates - exact center
const CANYON_CREST_ACADEMY = {
  lat: 32.9588,
  lng: -117.1897
};

// Get a position very close to the center (max 50 meters away)
const getInitialRobotLocation = () => {
  // Convert ~50 meters to degrees (approximately)
  const maxOffset = 0.0005;
  return {
    lat: CANYON_CREST_ACADEMY.lat + (Math.random() - 0.5) * maxOffset,
    lng: CANYON_CREST_ACADEMY.lng + (Math.random() - 0.5) * maxOffset
  };
};

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Animation settings
const ANIMATION_SPEED = 0.00002; // Speed of robot movement
const ANIMATION_INTERVAL = 100; // Update interval in ms
const ROBOT_SPEED_KM_H = 5; // Robot speed in km/h

// Path colors
const PATH_COLORS = {
  inactive: '#808080', // Gray
  active: '#4CAF50',   // Green
  completed: '#3F51B5', // Indigo
  creating: '#FF9800',  // Orange
};

// Marker icons
const PIN_ICONS = {
  inactive: {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#808080',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#000000',
    scale: 1.5,
    anchor: { x: 12, y: 22 },
  },
  active: {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#4CAF50',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#000000',
    scale: 1.5,
    anchor: { x: 12, y: 22 },
  },
  completed: {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#3F51B5',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#000000',
    scale: 1.5,
    anchor: { x: 12, y: 22 },
  },
  creating: {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#FF9800',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#000000',
    scale: 1.5,
    anchor: { x: 12, y: 22 },
  },
};

interface MapProps {
  onPathAdded?: (path: Path) => void;
  paths?: Path[];
  onPathUpdate?: (path: Path) => void;
  onPathActivate?: (pathId: string) => void;
  onPathDelete?: (pathId: string) => void;
}

const Map: React.FC<MapProps> = ({ 
  onPathAdded, 
  paths = [], 
  onPathUpdate,
  onPathActivate,
  onPathDelete
}) => {
  // Map state
  const [robotLocation, setRobotLocation] = useState(getInitialRobotLocation());
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [currentPathLocations, setCurrentPathLocations] = useState<PathLocation[]>([]);
  const [pathSaveDialogOpen, setPathSaveDialogOpen] = useState(false);
  const [newPathForm, setNewPathForm] = useState<PathFormData>({
    name: '',
    description: '',
    priority: 'medium'
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState('');
  
  // Refs for animation and map interaction
  const mapRef = useRef<google.maps.Map | null>(null);
  const pathsRef = useRef<Path[]>(paths);
  const robotLocationRef = useRef(robotLocation);
  const activePath = useMemo(() => paths.find(p => p.isActive), [paths]);
  const polylineRefs = useRef<{[key: string]: google.maps.Polyline}>({});
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);
  
  useEffect(() => {
    robotLocationRef.current = robotLocation;
  }, [robotLocation]);
  
  // Listen for paths update events
  useEffect(() => {
    const handlePathsUpdated = () => {
      // Clear any active animation if the active path was removed
      if (activePath && !paths.some(p => p.id === activePath.id)) {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
        setIsAnimating(false);
      }
    };
    
    window.addEventListener('pathsUpdated', handlePathsUpdated);
    return () => window.removeEventListener('pathsUpdated', handlePathsUpdated);
  }, [activePath, paths]);
  
  // Save map instance on load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;
  }, []);
  
  // Handle map click - add point to current path
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!isCreatingPath || !event.latLng) return;
    
    // Add a new point to the current path
    const newLocation: PathLocation = {
      id: uuidv4(),
      position: {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
      completed: false
    };
    
    setCurrentPathLocations(prev => [...prev, newLocation]);
  };
  
  // Calculate distance between two points in km
  const calculateDistance = useCallback((point1: google.maps.LatLngLiteral, point2: google.maps.LatLngLiteral) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * 
      Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }, []);
  
  // Calculate total distance of a path
  const calculatePathDistance = useCallback((locations: PathLocation[]) => {
    if (locations.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      totalDistance += calculateDistance(
        locations[i].position,
        locations[i + 1].position
      );
    }
    
    return totalDistance;
  }, [calculateDistance]);
  
  // Start creating a new path
  const handleStartPathCreation = () => {
    setIsCreatingPath(true);
    setCurrentPathLocations([]);
    
    setAlertMessage('Click on the map to place pins and create your path');
    setAlertSeverity('info');
    setShowAlert(true);
  };
  
  // Cancel the current path creation
  const handleCancelPathCreation = () => {
    setIsCreatingPath(false);
    setCurrentPathLocations([]);
  };
  
  // Complete the current path and open save dialog
  const handleCompletePathCreation = () => {
    if (currentPathLocations.length < 2) {
      setAlertMessage('A path must have at least 2 points');
      setAlertSeverity('warning');
      setShowAlert(true);
      return;
    }
    
    setPathSaveDialogOpen(true);
  };
  
  // Save the current path
  const handleSavePath = () => {
    if (!newPathForm.name) {
      setAlertMessage('Please provide a name for the path');
      setAlertSeverity('warning');
      setShowAlert(true);
      return;
    }
    
    // Calculate path metrics
    const pathDistance = calculatePathDistance(currentPathLocations);
    const estimatedTime = pathDistance / ROBOT_SPEED_KM_H; // hours
    
    // Create new path object
    const newPath: Path = {
      id: uuidv4(),
      name: newPathForm.name,
      description: newPathForm.description || '',
      locations: currentPathLocations,
      isActive: false,
      createdAt: new Date().toLocaleString(),
      estimatedDistance: pathDistance,
      estimatedTime: estimatedTime,
      priority: newPathForm.priority,
      status: 'pending'
    };
    
    // Add path to parent component
    if (onPathAdded) {
      onPathAdded(newPath);
    }
    
    // Reset state
    setPathSaveDialogOpen(false);
    setIsCreatingPath(false);
    setCurrentPathLocations([]);
    setNewPathForm({
      name: '',
      description: '',
      priority: 'medium'
    });
    
    // Show success message
    setAlertMessage('Path created successfully!');
    setAlertSeverity('success');
    setShowAlert(true);
  };
  
  // Activate a path and start the robot moving
  const handleActivatePath = useCallback((pathId: string) => {
    // Find the path
    const path = paths.find(p => p.id === pathId);
    if (!path || path.locations.length < 2) return;
    
    // Update path status
    if (onPathActivate) {
      onPathActivate(pathId);
    }
    
    // Start animation
    startPathAnimation(path);
    
  }, [paths, onPathActivate]);
  
  // Start animating the robot along a path
  const startPathAnimation = useCallback((path: Path) => {
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    
    // Initialize animation state
    setIsAnimating(true);
    setCurrentSegment(0);
    setAnimationProgress(0);
    setOverallProgress(0); // Reset overall progress
    
    // Calculate path metrics
    const totalDistance = calculatePathDistance(path.locations);
    
    // Set initial robot position to the START of the path
    const initialPathPosition = path.locations[0].position;
    setRobotLocation(initialPathPosition);
    robotLocationRef.current = initialPathPosition;

    // Update path status
    const updatedPath: Path = {
      ...path,
      status: 'in-progress',
      isActive: true
    };
    
    if (onPathUpdate) {
      onPathUpdate(updatedPath);
    }
    
    // Calculate estimated arrival time
    const estimatedTimeMinutes = (totalDistance / ROBOT_SPEED_KM_H) * 60;
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + estimatedTimeMinutes * 60000);
    setEstimatedArrival(arrivalTime.toLocaleTimeString());
    
    // Start animation loop
    let currentSegmentIndex = 0;
    let segmentProgress = 0;
    let totalSegments = path.locations.length - 1;
    
    animationRef.current = setInterval(() => {
      if (currentSegmentIndex >= totalSegments) {
        // Path complete
        clearInterval(animationRef.current!);
        animationRef.current = null;
        
        // Update path status
        const completedPath: Path = {
          ...updatedPath,
          status: 'completed',
          isActive: false,
          locations: updatedPath.locations.map(loc => ({ ...loc, completed: true }))
        };
        
        if (onPathUpdate) {
          onPathUpdate(completedPath);
        }
        
        // Reset animation state
        setIsAnimating(false);
        setCurrentSegment(0);
        setAnimationProgress(0);
        setOverallProgress(100);
        
        // Ensure robot is at the final destination
        setRobotLocation(completedPath.locations[completedPath.locations.length - 1].position);

        // Show success message
        setAlertMessage('Path completed successfully!');
        setAlertSeverity('success');
        setShowAlert(true);
        
        return;
      }
      
      // Get current segment points
      const startPoint = path.locations[currentSegmentIndex].position;
      const endPoint = path.locations[currentSegmentIndex + 1].position;
      
      // Increment progress
      segmentProgress += ANIMATION_SPEED;
      
      // Calculate new position
      const newLat = startPoint.lat + (endPoint.lat - startPoint.lat) * segmentProgress;
      const newLng = startPoint.lng + (endPoint.lng - startPoint.lng) * segmentProgress;
      const newPosition = { lat: newLat, lng: newLng };
      
      // Update robot position
      setRobotLocation(newPosition);
      
      // Update segment progress display
      setAnimationProgress(segmentProgress * 100);
      
      // Calculate overall progress
      const completedDistance = calculatePathDistance(
        path.locations.slice(0, currentSegmentIndex + 1)
      );
      const currentSegmentDistance = calculateDistance(startPoint, endPoint);
      const currentSegmentTraveled = currentSegmentDistance * segmentProgress;
      const totalTraveled = completedDistance + currentSegmentTraveled;
      
      // Update remaining distance and overall progress
      setRemainingDistance(totalDistance - totalTraveled);
      setOverallProgress((totalTraveled / totalDistance) * 100);
      
      // If segment complete, move to next one
      if (segmentProgress >= 1) {
        // Mark current location as completed
        const updatedLocations = [...path.locations];
        updatedLocations[currentSegmentIndex].completed = true;
        
        const updatedActivePath = {
          ...path,
          locations: updatedLocations
        };
        
        if (onPathUpdate) {
          onPathUpdate(updatedActivePath);
        }
        
        // Move to next segment
        currentSegmentIndex++;
        segmentProgress = 0;
        setCurrentSegment(currentSegmentIndex);
        setAnimationProgress(0);
      }
      
    }, ANIMATION_INTERVAL);
    
  }, [calculateDistance, calculatePathDistance, onPathUpdate]);
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPathForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle priority selection change
  const handlePriorityChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setNewPathForm(prev => ({
      ...prev,
      priority: e.target.value as 'low' | 'medium' | 'high'
    }));
  };
  
  // Get marker icon based on status
  const getMarkerIcon = (status: 'pending' | 'in-progress' | 'completed' | 'creating') => {
    switch (status) {
      case 'pending': return PIN_ICONS.inactive;
      case 'in-progress': return PIN_ICONS.active;
      case 'completed': return PIN_ICONS.completed;
      case 'creating': return PIN_ICONS.creating;
      default: return PIN_ICONS.inactive;
    }
  };
  
  // Get polyline color based on path status
  const getPolylineColor = (status: 'pending' | 'in-progress' | 'completed' | 'creating') => {
    switch (status) {
      case 'pending': return PATH_COLORS.inactive;
      case 'in-progress': return PATH_COLORS.active;
      case 'completed': return PATH_COLORS.completed;
      case 'creating': return PATH_COLORS.creating;
      default: return PATH_COLORS.inactive;
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={CANYON_CREST_ACADEMY}
        zoom={17}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
          clickableIcons: false,
        }}
        onClick={handleMapClick}
        onLoad={onMapLoad}
      >
        {/* Render all paths */}
        {paths.map((path) => (
          <React.Fragment key={path.id}>
            {/* Path Polyline */}
            <Polyline
              map={mapRef.current}
              path={path.locations.map(loc => loc.position)}
              options={{
                strokeColor: getPolylineColor(path.status),
                strokeWeight: 4,
                strokeOpacity: path.isActive ? 1 : 0.7,
                zIndex: path.isActive ? 2 : 1,
              }}
            />
            
            {/* Path Location Markers */}
            {path.locations.map((location, index) => (
              <Marker
                key={location.id}
                position={location.position}
                icon={getMarkerIcon(location.completed ? 'completed' : path.status)}
                title={`${path.name} - Point ${index + 1}`}
                zIndex={path.isActive ? 2 : 1}
              />
            ))}
          </React.Fragment>
        ))}
        
        {/* Current path being created */}
        {isCreatingPath && currentPathLocations.length > 0 && (
          <>
            <Polyline
              map={mapRef.current}
              path={currentPathLocations.map(loc => loc.position)}
              options={{
                strokeColor: getPolylineColor('creating'),
                strokeWeight: 4,
                strokeOpacity: 0.8,
                zIndex: 3,
              }}
            />
            
            {currentPathLocations.map((location, index) => (
              <Marker
                key={location.id}
                position={location.position}
                icon={getMarkerIcon('creating')}
                title={`New Path - Point ${index + 1}`}
                zIndex={3}
              />
            ))}
          </>
        )}
        
        {/* Robot Marker */}
        <Marker
          position={robotLocation}
          icon={{
            path: 'M7 5H17V7H19V10H16V14H19V17H17V19H7V17H5V14H8V10H5V7H7V5M15 7H9V17H15V7Z',
            fillColor: '#FF0000',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 1.5,
            anchor: { x: 12, y: 12 },
          }}
          title="RoboDog"
          zIndex={10}
        />
      </GoogleMap>

      {/* Path creation buttons */}
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 5 }}>
        {!isCreatingPath ? (
          <Fab
            color="primary"
            onClick={handleStartPathCreation}
            aria-label="create path"
          >
            <AddIcon />
          </Fab>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Fab
              color="success"
              onClick={handleCompletePathCreation}
              aria-label="complete path"
              disabled={currentPathLocations.length < 2}
            >
              <CheckIcon />
            </Fab>
            <Fab
              color="error"
              onClick={handleCancelPathCreation}
              aria-label="cancel path"
            >
              <ClearIcon />
            </Fab>
          </Box>
        )}
      </Box>
      
      {/* Active Path Info */}
      {isAnimating && activePath && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            p: 2,
            width: 280,
            borderRadius: 2,
            zIndex: 5,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {activePath.name}
          </Typography>
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Overall Progress
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={overallProgress} 
              sx={{ height: 8, borderRadius: 4, mb: 1 }} 
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {Math.round(overallProgress)}% Complete
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ETA: {estimatedArrival}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Segment: {currentSegment + 1} of {activePath.locations.length - 1}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={animationProgress} 
              color="secondary"
              sx={{ height: 6, borderRadius: 4, mb: 1 }} 
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Distance remaining: {remainingDistance.toFixed(2)} km
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Path Creation Dialog */}
      <Dialog open={pathSaveDialogOpen} onClose={() => setPathSaveDialogOpen(false)}>
        <DialogTitle>Save Path</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, width: 400, maxWidth: '100%' }}>
              <TextField
              margin="dense"
              label="Path Name"
              type="text"
              fullWidth
              variant="outlined"
              name="name"
              value={newPathForm.name}
              onChange={handleInputChange}
                required
              sx={{ mb: 2 }}
              />
            
              <TextField
              margin="dense"
              label="Description (Optional)"
              type="text"
                fullWidth
              variant="outlined"
              name="description"
              value={newPathForm.description}
              onChange={handleInputChange}
                multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 1 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newPathForm.priority}
                onChange={handlePriorityChange as any}
                label="Priority"
                name="priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Path Details:
              </Typography>
              <Typography variant="body2">
                • Points: {currentPathLocations.length}
              </Typography>
              <Typography variant="body2">
                • Estimated Distance: {calculatePathDistance(currentPathLocations).toFixed(2)} km
              </Typography>
              <Typography variant="body2">
                • Estimated Time: {formatTime(calculatePathDistance(currentPathLocations) / ROBOT_SPEED_KM_H)}
              </Typography>
            </Box>
            </Box>
          </DialogContent>
          <DialogActions>
          <Button onClick={() => setPathSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePath} color="primary" variant="contained">
            Save Path
            </Button>
          </DialogActions>
      </Dialog>

      {/* Alert Message */}
      <Snackbar
        open={showAlert}
        autoHideDuration={4000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity={alertSeverity}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper function to format time
const formatTime = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);
  
  if (minutes > 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''} ${seconds > 0 ? `${seconds} sec` : ''}`;
  } else {
    return `${seconds} sec`;
  }
};

// Custom Polyline component
interface PolylineProps {
  path: google.maps.LatLngLiteral[];
  options: google.maps.PolylineOptions;
  map: google.maps.Map | null; // Pass the map instance
}

const Polyline: React.FC<PolylineProps> = ({ path, options, map }) => {
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (map) {
      polylineRef.current = new google.maps.Polyline({
        path,
        ...options,
        map,
      });
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [path, options, map]);

  // Update polyline if path or options change
  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setPath(path);
      polylineRef.current.setOptions(options);
    }
  }, [path, options]);

  return null; // The Polyline is drawn directly on the map
};

export default Map; 