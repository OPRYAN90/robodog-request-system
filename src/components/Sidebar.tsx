import React, { useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Avatar,
  LinearProgress,
  ListItemAvatar,
  Stack,
  Badge,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RouteIcon from '@mui/icons-material/Route';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StraightenIcon from '@mui/icons-material/Straighten';
import { Path } from '../types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  paths: Path[];
  onPathUpdate: (path: Path) => void;
  onPathActivate: (pathId: string) => void;
  onPathDelete: (pathId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  paths,
  onPathUpdate,
  onPathActivate,
  onPathDelete,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pathToDelete, setPathToDelete] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pathToActivate, setPathToActivate] = useState<string | null>(null);

  const handleDeleteClick = useCallback((pathId: string) => {
    setPathToDelete(pathId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (pathToDelete) {
      onPathDelete(pathToDelete);
      setPathToDelete(null);
    }
    setDeleteDialogOpen(false);
  }, [pathToDelete, onPathDelete]);

  const handleActivateClick = useCallback((pathId: string) => {
    // If there's already an active path, show confirmation
    if (paths.some(path => path.isActive)) {
      setPathToActivate(pathId);
      setConfirmDialogOpen(true);
    } else {
      onPathActivate(pathId);
    }
  }, [paths, onPathActivate]);

  const handleActivateConfirm = useCallback(() => {
    if (pathToActivate) {
      onPathActivate(pathToActivate);
      setPathToActivate(null);
    }
    setConfirmDialogOpen(false);
  }, [pathToActivate, onPathActivate]);

  // Format time to display in a friendly way (e.g., "5 min 30 sec")
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

  // Calculate progress percentage for a path
  const calculateProgress = (path: Path): number => {
    if (path.status === 'completed') return 100;
    if (path.status === 'pending' || !path.isActive) return 0;
    
    // Count completed locations
    const completedLocations = path.locations.filter(loc => loc.completed).length;
    // Total segments is locations - 1
    const totalSegments = path.locations.length - 1;
    
    if (totalSegments <= 0) return 0;
    return Math.round((completedLocations / totalSegments) * 100);
  };

  // Generate color based on path status
  const getStatusColor = (status: 'pending' | 'in-progress' | 'completed'): string => {
    switch (status) {
      case 'pending': return '#9e9e9e'; // Gray
      case 'in-progress': return '#4caf50'; // Green
      case 'completed': return '#3f51b5'; // Indigo
      default: return '#9e9e9e';
    }
  };

  // Generate label based on path status
  const getStatusLabel = (status: 'pending' | 'in-progress' | 'completed'): string => {
    switch (status) {
      case 'pending': return 'Ready';
      case 'in-progress': return 'Active';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  // Generate priority color
  const getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
    switch (priority) {
      case 'low': return '#8bc34a'; // Light green
      case 'medium': return '#ff9800'; // Orange
      case 'high': return '#f44336'; // Red
      default: return '#9e9e9e';
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 400 },
            boxSizing: 'border-box',
            borderRadius: '8px 0 0 8px',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" component="div">
            RoboDog Paths
          </Typography>
          <IconButton onClick={onClose} aria-label="close sidebar">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        
        {paths.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <RouteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No paths have been created yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click on the map to create a new path for RoboDog to follow.
            </Typography>
          </Box>
        ) : (
          <List sx={{ overflow: 'auto', flexGrow: 1, p: 2 }}>
            {paths.map((path) => {
              const progress = calculateProgress(path);
              return (
                <Card 
                  key={path.id} 
                  sx={{ 
                    mb: 2, 
                    position: 'relative',
                    border: path.isActive ? '2px solid #4caf50' : 'none',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {path.name}
                        </Typography>
                        <Chip 
                          label={getStatusLabel(path.status)}
                          size="small"
                          sx={{ 
                            bgcolor: getStatusColor(path.status),
                            color: 'white',
                          }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {path.description || "No description provided"}
                      </Typography>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StraightenIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {path.estimatedDistance.toFixed(2)} km
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatTime(path.estimatedTime)}
                          </Typography>
                        </Stack>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon fontSize="small" color="action" />
                        <Chip 
                          label={path.priority} 
                          size="small"
                          sx={{ 
                            bgcolor: getPriorityColor(path.priority),
                            color: 'white',
                            height: 20,
                          }}
                        />
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        Created: {path.createdAt}
                      </Typography>
                      
                      {(path.status === 'in-progress' || path.isActive) && (
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ height: 8, borderRadius: 4 }} 
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {progress}%
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    {path.status !== 'completed' && (
                      <Button
                        size="small"
                        color={path.isActive ? "warning" : "primary"}
                        startIcon={path.isActive ? <StopIcon /> : <PlayArrowIcon />}
                        onClick={() => handleActivateClick(path.id)}
                        disabled={path.isActive}
                      >
                        {path.isActive ? "Active" : "Start"}
                      </Button>
                    )}
                    
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(path.id)}
                      disabled={path.isActive}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </List>
        )}
      </Drawer>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Path</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this path? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate Path Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Activate New Path</DialogTitle>
        <DialogContent>
          <DialogContentText>
            There is already an active path. Activating a new path will deactivate the current one.
            Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleActivateConfirm} color="primary" autoFocus>
            Activate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar; 