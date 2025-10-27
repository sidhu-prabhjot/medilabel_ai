"use client";
import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";

import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar
      className={styles.appBar}
      sx={{ backgroundColor: "#191919", boxShadow: "0" }}
    >
      <Toolbar>
        {/* Mobile Menu Button */}
        <Box
          className={styles.mobileMenuBox}
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          <IconButton
            size="large"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            <MenuItem onClick={handleCloseNavMenu}>
              <HomeIcon className={styles.menuIconSpacing} /> Home
            </MenuItem>
            <MenuItem onClick={handleCloseNavMenu}>
              <SearchIcon className={styles.menuIconSpacing} /> Analyze
            </MenuItem>
            <MenuItem onClick={handleCloseNavMenu}>
              <InfoIcon className={styles.menuIconSpacing} /> About
            </MenuItem>
          </Menu>
        </Box>

        {/* Logo / Title */}
        <Typography
          variant="h6"
          noWrap
          component="a"
          href="/"
          className={styles.logoTitle}
        >
          MediLabel AI
        </Typography>

        {/* Desktop Menu */}
        <Box
          className={styles.desktopMenuBox}
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          <Button color="inherit" startIcon={<HomeIcon />} href="/">
            Home
          </Button>
          <Button color="inherit" startIcon={<SearchIcon />} href="/">
            Analyze
          </Button>
          <Button color="inherit" startIcon={<InfoIcon />} href="/">
            About
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
