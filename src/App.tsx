import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";

import {
  Home, Image as ImageIcon, Map, Folder, Settings,
  Search, Heart, Tag, Users, UploadCloud, BarChart,
  Trash2, User, Camera, Bell, ChevronRight,
  LogIn, UserPlus, HardDrive
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { api } from "./api";

// Page Imports
import HomePage         from "./pages/HomePage";
import TimelinePage     from "./pages/TimelinePage";
import AlbumsPage       from "./pages/AlbumsPage";
import CreateAlbumPage  from "./pages/CreateAlbumPage";
import MapPage          from "./pages/MapPage";
import SettingsPage     from "./pages/SettingsPage";
import AboutPage        from "./pages/AboutPage";
import FavoritesPage    from "./pages/FavoritesPage";
import LoginPage        from "./pages/LoginPage";
import PhotoPage        from "./pages/PhotoPage";
import ProfilePage      from "./pages/ProfilePage";
import SearchPage       from "./pages/SearchPage";
import SharedPage       from "./pages/SharedPage";
import PublicSharedPage from "./pages/PublicSharedPage";
import SharedAlbumsPage from "./pages/SharedAlbumsPage";
import SharedStoryPage  from "./pages/SharedStoryPage";
import SignupPage       from "./pages/SignupPage";
import StatsPage        from "./pages/StatsPage";
import TagsPage         from "./pages/TagsPage";
import TrashPage        from "./pages/TrashPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import UploadPage       from "./pages/UploadPage";
import LocalPhotosPage  from "./pages/LocalPhotosPage";

// Context & Components
import { UploadProvider } from "./context/UploadContext";
import { SelectionProvider } from "./context/SelectionContext";
import { NotificationProvider, useNotifications } from "./context/NotificationContext";
import UploadStatusBar from "./components/UploadStatusBar";
import Titlebar from "./components/Titlebar";
import OfflineIndicator from "./components/OfflineIndicator";
import BulkActionBar from "./components/BulkActionBar";
import { useAutoBackup } from "./hooks/useAutoBackup";

// ── Route meta ──────────────────────────────────────────────
const routeMeta: Record<string, string> = {
  "/":              "Trang chủ",
  "/timeline":      "Dòng thời gian",
  "/albums":        "Bộ sưu tập",
  "/map":           "Bản đồ",
  "/favorites":     "Yêu thích",
  "/tags":          "Nhãn",
  "/shared":        "Đã chia sẻ",
  "/upload":        "Tải lên",
  "/stats":         "Thống kê",
  "/trash":         "Thùng rác",
  "/profile":       "Hồ sơ",
  "/settings":      "Cài đặt",
  "/about":         "Giới thiệu",
  "/search":        "Tìm kiếm",
  "/login":         "Đăng nhập",
  "/signup":        "Đăng ký",
  "/unauthorized":  "Không có quyền truy cập",
  "/offline":       "Ngoại tuyến",
};

function NavLink({
  to, icon, label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`vintage-nav-link${active ? " active" : ""}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-text">{label}</span>
    </Link>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('auth_token');
  const googleAvatar = localStorage.getItem('google_avatar');

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            <Camera size={18} />
          </div>
          <h1 className="app-title">Memories</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-group-title">Chính</div>
          <NavLink to="/"          icon={<Home size={17} />}        label="Trang chủ" />
          <NavLink to="/timeline"  icon={<ImageIcon size={17} />}   label="Dòng thời gian" />
          <NavLink to="/albums"    icon={<Folder size={17} />}      label="Bộ sưu tập" />
          <NavLink to="/map"       icon={<Map size={17} />}         label="Bản đồ" />
        </div>

        <div className="nav-section">
          <div className="nav-group-title">Thư viện</div>
          <NavLink to="/favorites" icon={<Heart size={17} />}       label="Yêu thích" />
          <NavLink to="/tags"      icon={<Tag size={17} />}         label="Nhãn" />
          <NavLink to="/shared"    icon={<Users size={17} />}       label="Đã chia sẻ" />
          <NavLink to="/local"     icon={<HardDrive size={17} />}   label="Ảnh trên máy" />
        </div>

        <div className="nav-section">
          <div className="nav-group-title">Công cụ</div>
          <NavLink to="/upload"    icon={<UploadCloud size={17} />} label="Tải lên" />
          <NavLink to="/stats"     icon={<BarChart size={17} />}   label="Thống kê" />
          <NavLink to="/trash"     icon={<Trash2 size={17} />}      label="Thùng rác" />
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {isLoggedIn && (
          <div className="user-profile-card" onClick={() => navigate('/profile')}>
            <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {googleAvatar ? (
                <img src={googleAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
              ) : (
                <User size={18} style={{ margin: 'auto' }} />
              )}
            </div>
            <div className="user-info">
              <span className="user-name">Tài khoản của tôi</span>
              <span className="user-status">Xem hồ sơ</span>
            </div>
          </div>
        )}
        <NavLink to="/settings" icon={<Settings size={17} />} label="Cài đặt" />
        {!isLoggedIn && <NavLink to="/login"    icon={<LogIn size={17} />}    label="Đăng nhập" />}
        {!isLoggedIn && <NavLink to="/signup"   icon={<UserPlus size={17} />} label="Đăng ký" />}
      </div>
    </aside>
  );
}

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = routeMeta[location.pathname] ?? "Memories";
  const isLoggedIn = !!localStorage.getItem('auth_token');
  const googleAvatar = localStorage.getItem('google_avatar');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();

  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('google_avatar');
    navigate('/login');
  };

  return (
    <header className="app-topbar" style={{ zIndex: 50 }}>
      {/* Breadcrumb */}
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span className="breadcrumb-root">Memories</span>
          <span className="breadcrumb-sep">
            <ChevronRight size={14} />
          </span>
          <span className="breadcrumb-current">{pageName}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="topbar-right">
        {/* Search */}
        <div className="search-container">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm kỷ niệm…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {/* Notification */}
        {isLoggedIn && (
          <div style={{ position: 'relative' }}>
            <button 
              className="topbar-icon-btn notif-btn" 
              aria-label="Notifications"
              onClick={() => {
                setShowProfile(false);
                setShowNotifs(!showNotifs);
                if (!showNotifs) markAllAsRead();
              }}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            {showNotifs && (
              <div className="notif-dropdown" style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                width: '320px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)', border: 'var(--border-delicate)', zIndex: 1000,
                maxHeight: '400px', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: 'var(--border-delicate)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', margin: 0 }}>Thông báo</h3>
                  <button onClick={clearAll} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '12px' }}>Xóa tất cả</button>
                </div>
                <div style={{ overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>Không có thông báo mới</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: 'var(--border-delicate)', display: 'flex', flexDirection: 'column', gap: '4px', opacity: n.read ? 0.7 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{n.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{n.body}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avatar */}
        {isLoggedIn && (
          <div style={{ position: 'relative' }}>
            <div 
              className="topbar-avatar" 
              role="button" 
              aria-label="User profile" 
              style={{ overflow: 'hidden', padding: 0, cursor: 'pointer' }}
              onClick={() => {
                setShowNotifs(false);
                setShowProfile(!showProfile);
              }}
            >
              {googleAvatar ? (
                <img src={googleAvatar} alt="TÔI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
              ) : (
                <span style={{ margin: 'auto', background: 'var(--accent-1)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)' }}>TÔI</span>
              )}
            </div>
            
            {showProfile && (
              <div className="profile-dropdown" style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
                width: '200px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)', border: 'var(--border-delicate)', zIndex: 1000,
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}>
                <button 
                  onClick={() => { setShowProfile(false); navigate('/profile'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)', borderBottom: 'var(--border-delicate)' }}
                >
                  <User size={16} /> Hồ sơ
                </button>
                <button 
                  onClick={() => { setShowProfile(false); navigate('/settings'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)', borderBottom: 'var(--border-delicate)' }}
                >
                  <Settings size={16} /> Cài đặt
                </button>
                <button 
                  onClick={() => { setShowProfile(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: 'var(--danger)', fontWeight: 500 }}
                >
                  <LogIn size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  useAutoBackup();
  useEffect(() => {
    // Check for updates silently on startup
    const checkForUpdates = async () => {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (!isTauri) return;
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const { ask, message } = await import('@tauri-apps/plugin-dialog');
        const update = await check();
        if (update) {
          const yes = await ask(`New version available: v${update.version}!\n\n${update.body || 'Would you like to update now?'}`, {
            title: 'Memories Update',
            kind: 'info',
            okLabel: 'Update',
            cancelLabel: 'Later'
          });
          if (yes) {
            await update.downloadAndInstall();
            await message('Update completed successfully! Please restart the application.', { title: 'Success', kind: 'info' });
          }
        }
      } catch (err) {
        console.error('Error checking for updates:', err);
      }
    };
    checkForUpdates();
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    const token = localStorage.getItem('auth_token');
    const isPublicRoute = currentPath === '/' || currentPath === '/login' || currentPath === '/signup' || currentPath.startsWith('/shared/') || currentPath.startsWith('/photo/') || currentPath === '/local';
    
    if (!token) {
      if (!isPublicRoute) {
        navigate('/login');
      }
    } else if (token) {
      // Verify token still valid
      api.getMe().catch((_error) => {
        // Genuine authentication error (e.g., token expired)
        localStorage.removeItem('auth_token');
        localStorage.removeItem('google_avatar');
        if (!isPublicRoute) {
          navigate('/login');
        }
      });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F for Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        navigate('/search');
      }
      // Alt-based navigation shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'h': e.preventDefault(); navigate('/'); break;
          case 't': e.preventDefault(); navigate('/timeline'); break;
          case 'a': e.preventDefault(); navigate('/albums'); break;
          case 'u': e.preventDefault(); navigate('/upload'); break;
          case 'f': e.preventDefault(); navigate('/favorites'); break;
          case 'm': e.preventDefault(); navigate('/map'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      // For each file, upload using the API
      // In a real app we'd dispatch this to the UploadContext, 
      // but for simplicity we'll just alert or log it, or redirect to upload page.
      navigate('/upload', { state: { files: files } });
    }
  };

  return (
    <NotificationProvider>
      <UploadProvider>
        <SelectionProvider>
          <Titlebar />
          <OfflineIndicator />
          <BulkActionBar />
          <div 
            className="app-drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}
          >
            {isDragging && (
            <div className="drag-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem' }}>
              Drop photos to upload
            </div>
          )}
          <div className="paper-texture"></div>
          <div className="app-layout">
          <Sidebar />
          <main className="app-main">
            <TopBar />
            <div className="content-area">
              <Routes>
                <Route path="/"               element={<HomePage />} />
                <Route path="/timeline"       element={<TimelinePage />} />
                <Route path="/albums"         element={<AlbumsPage />} />
                <Route path="/albums/create"  element={<CreateAlbumPage />} />
                <Route path="/albums/edit/:id" element={<CreateAlbumPage />} />
                <Route path="/map"            element={<MapPage />} />
                <Route path="/settings"       element={<SettingsPage />} />
                <Route path="/about"          element={<AboutPage />} />
                <Route path="/favorites"      element={<FavoritesPage />} />
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/photo/:id"      element={<PhotoPage />} />
                <Route path="/profile"        element={<ProfilePage />} />
                <Route path="/search"         element={<SearchPage />} />
                <Route path="/shared"         element={<SharedPage />} />
                <Route path="/shared/:token"  element={<PublicSharedPage />} />
                <Route path="/shared-albums"  element={<SharedAlbumsPage />} />
                <Route path="/shared-story"   element={<SharedStoryPage />} />
                <Route path="/signup"         element={<SignupPage />} />
                <Route path="/stats"          element={<StatsPage />} />
                <Route path="/tags"           element={<TagsPage />} />
                <Route path="/trash"          element={<TrashPage />} />
                <Route path="/unauthorized"   element={<UnauthorizedPage />} />
                <Route path="/upload"         element={<UploadPage />} />
                <Route path="/local"          element={<LocalPhotosPage />} />
              </Routes>
            </div>
          </main>
          <UploadStatusBar />
        </div>
        </div>
        </SelectionProvider>
      </UploadProvider>
    </NotificationProvider>
  );
}

export default App;
