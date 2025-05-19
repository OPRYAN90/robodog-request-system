import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import RouteIcon from '@mui/icons-material/Route';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RouteIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RoboDog Path Navigation System
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          color="inherit" 
          onClick={onToggleSidebar}
        >
          My Paths
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 