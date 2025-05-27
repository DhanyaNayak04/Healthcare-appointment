import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Grid, Typography, Box } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Healthcare Appointment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Making healthcare accessible for everyone
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/search-doctors">Find Doctors</Link>
              </li>
              <li>
                <Link to="/my-appointments">My Appointments</Link>
              </li>
              <li>
                <Link to="/profile">My Profile</Link>
              </li>
            </ul>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Specializations
            </Typography>
            <ul className="footer-links">
              <li>Cardiology</li>
              <li>Dermatology</li>
              <li>Neurology</li>
              <li>Orthopedics</li>
              <li>Pediatrics</li>
            </ul>
          </Grid>
        </Grid>
        <Box mt={3}>
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' Healthcare Appointment System. All rights reserved.'}
          </Typography>
        </Box>
      </Container>

      <style jsx>{`
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer-links li {
          margin-bottom: 8px;
        }
        .footer-links a {
          color: #666;
          text-decoration: none;
        }
        .footer-links a:hover {
          color: #3f51b5;
          text-decoration: underline;
        }
      `}</style>
    </Box>
  );
};

export default Footer;
