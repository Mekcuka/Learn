import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth, useIsAuthor } from "../auth/AuthContext";

type PortalTopbarProps = {
  active?: "home" | "lessons" | "wiki" | "author";
};

type NavItem = {
  key: "lessons" | "wiki";
  label: string;
  path: string;
};

const MAIN_NAV: NavItem[] = [
  { key: "lessons", label: "Уроки", path: "/dashboard" },
  { key: "wiki", label: "Wiki", path: "/wiki" },
];

const MOBILE_NAV_QUERY = "(max-width:720px)";

function roleLabel(role?: string): string {
  if (role === "author") return "Методист";
  return "Ученик";
}

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const [first, second] = parts;
    // «Ученик 1» — буквы из имени, не цифра в аватаре
    if (/^\d+$/.test(second!)) {
      return first!.slice(0, 2).toUpperCase();
    }
    return `${first![0] ?? ""}${second![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function PortalTopbar({ active }: PortalTopbarProps) {
  const { user } = useAuth();
  const isAuthor = useIsAuthor();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabValue = active === "lessons" || active === "wiki" ? active : false;

  function closeDrawerAndNavigate(path: string) {
    setDrawerOpen(false);
    navigate(path);
  }

  const userBlock = (
    <Box
      className="portal-user-block"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: 0,
        maxWidth: { xs: "8rem", sm: "12rem" },
      }}
      aria-label={`${user.display_name}, ${roleLabel(user.role)}`}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: "primary.light",
          color: "primary.main",
          fontSize: "0.8rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {userInitials(user.display_name)}
      </Avatar>
      <Box sx={{ minWidth: 0, display: { xs: "none", sm: "block" } }}>
        <Typography variant="body2" fontWeight={600} noWrap title={user.display_name}>
          {user.display_name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="span" display="block">
          {roleLabel(user.role)}
        </Typography>
      </Box>
    </Box>
  );

  const authorButton = isAuthor ? (
    <Button
      size="small"
      variant={active === "author" ? "contained" : "outlined"}
      color="secondary"
      startIcon={<EditOutlinedIcon fontSize="small" />}
      onClick={() => navigate("/author")}
      aria-current={active === "author" ? "page" : undefined}
      sx={{ flexShrink: 0, display: { xs: "none", sm: "inline-flex" } }}
    >
      Редактор
    </Button>
  ) : null;

  const desktopNav = (
    <Tabs
      className="portal-nav"
      value={tabValue}
      onChange={(_, value: NavItem["key"]) => {
        const item = MAIN_NAV.find((nav) => nav.key === value);
        if (item) navigate(item.path);
      }}
      aria-label="Основная навигация"
      sx={{
        flex: 1,
        justifyContent: "center",
        minHeight: 48,
        "& .MuiTabs-flexContainer": { justifyContent: "center" },
      }}
    >
      {MAIN_NAV.map((item) => (
        <Tab
          key={item.key}
          value={item.key}
          label={item.label}
          component={Link}
          to={item.path}
          aria-current={active === item.key ? "page" : undefined}
        />
      ))}
    </Tabs>
  );

  const mobileDrawer = (
    <Drawer
      id="portal-nav-drawer"
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      ModalProps={{ keepMounted: true }}
      PaperProps={{ sx: { width: 280 } }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        {userBlock}
      </Box>
      <Divider />
      <List aria-label="Меню навигации">
        {MAIN_NAV.map((item) => (
          <ListItemButton
            key={item.key}
            selected={active === item.key}
            onClick={() => closeDrawerAndNavigate(item.path)}
            aria-current={active === item.key ? "page" : undefined}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        {isAuthor && (
          <ListItemButton
            selected={active === "author"}
            onClick={() => closeDrawerAndNavigate("/author")}
            aria-current={active === "author" ? "page" : undefined}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <EditOutlinedIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText primary="Редактор" />
          </ListItemButton>
        )}
      </List>
    </Drawer>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      component="header"
      className="catalog-topbar portal-topbar"
    >
      <Toolbar
        disableGutters
        className="portal-toolbar"
        sx={{
          minHeight: 64,
          height: 64,
          px: "max(var(--page-padding), env(safe-area-inset-left, 0px))",
          pr: "max(var(--page-padding), env(safe-area-inset-right, 0px))",
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box
          component={Link}
          to="/"
          className="portal-brand-link"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            flexShrink: 0,
            mr: { sm: 1 },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
              borderRadius: 1,
            },
          }}
        >
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" component="span">
            Learn
          </Typography>
        </Box>

        {!isMobile && desktopNav}

        {isMobile && <Box sx={{ flex: 1 }} />}

        <Box className="portal-topbar-end" sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {!isMobile && userBlock}
          {authorButton}
          {isMobile && (
            <IconButton
              edge="end"
              aria-label="Открыть меню навигации"
              aria-expanded={drawerOpen}
              aria-controls="portal-nav-drawer"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>
      {isMobile && mobileDrawer}
    </AppBar>
  );
}
