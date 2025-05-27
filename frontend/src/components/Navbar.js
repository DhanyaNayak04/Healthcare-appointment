import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
        Dashboard
      </MenuItem>
      {user?.role === 'patient' && (
        <MenuItem onClick={() => { handleMenuClose(); navigate('/my-appointments'); }}>
          My Appointments
        </MenuItem>
      )}
      {user?.role === 'doctor' && (
        <MenuItem onClick={() => { handleMenuClose(); navigate('/doctor/profile'); }}>
          My Profile
        </MenuItem>
      )}
      <Divider />
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchorEl}
      open={Boolean(mobileMenuAnchorEl)}
      onClose={handleMenuClose}
    >
      {isAuthenticated ? (
        <>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
            Dashboard
          </MenuItem>
          {user?.role === 'patient' && (
            <>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/search-doctors'); }}>
                Find Doctors
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/my-appointments'); }}>
                My Appointments
              </MenuItem>
            </>
          )}
          {user?.role === 'doctor' && (
            <>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/doctor/profile'); }}>
                My Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/doctor/appointments'); }}>
                Appointments
              </MenuItem>
            </>
          )}
          <Divider />
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </>
      ) : (
        <>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/login'); }}>
            Login
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/register'); }}>
            Register
          </MenuItem>
        </>
      )}
    </Menu>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          Healthcare App
        </Typography>
        
        {/* Desktop Menu */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {isAuthenticated ? (
            <>
              {user?.role === 'patient' && (
                <>
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to="/search-doctors"
                  >
                    Find Doctors
                  </Button>
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to="/my-appointments"
                  >
                    My Appointments
                  </Button>
                </>
              )}
              {user?.role === 'doctor' && (
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/doctor/appointments"
                >
                  Appointments
                </Button>
              )}
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleProfileMenuOpen}
              >
                {user?.name ? (
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.name.charAt(0)}
                  </Avatar>
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/register"
              >
                Register
              </Button>
            </>
          )}
        </Box>
        
        {/* Mobile Menu */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            color="inherit"
            onClick={handleMobileMenuOpen}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>
      {renderMenu}
      {renderMobileMenu}
    </AppBar>
  );
};

export default Navbar;
