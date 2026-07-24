import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { openUrl } from '@tauri-apps/plugin-opener';
import { Plus, ChevronRight, Folder, CheckCircle, MoreVertical, Edit2, Trash2, X, FolderOpen, UploadCloud, Share2, Copy, Globe, Link, Mail, Lock, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, API_BASE_URL, Album, Photo } from '../api';
import { extractFilesFromDataTransfer, extractFilesFromEntry } from '../lib/fileDrop';
import { useUpload } from '../context/UploadContext';
import PhotoCard from '../components/PhotoCard';
import ShareModal from '../components/ShareModal';
import SlideshowModal from '../components/SlideshowModal';
import { useSelection } from '../context/SelectionContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AlbumsPage() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPath, setCurrentPath] = useState<Album[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { addJobs, isUploading } = useUpload();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [albumNameInput, setAlbumNameInput] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalAlbum, setShareModalAlbum] = useState<Album | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  const handleScanAlbum = async () => {
    if (!currentFolderId) return;
    const untaggedPhotos = currentAlbumPhotos.filter(p => !p.tags || p.tags.length === 0);
    
    if (untaggedPhotos.length === 0) {
      alert("Tất cả các ảnh trong album đã có thẻ!");
      return;
    }

    setIsScanning(true);
    let successCount = 0;

    for (let i = 0; i < untaggedPhotos.length; i++) {
      const photo = untaggedPhotos[i];
      setScanProgress(`Đang quét ${i + 1}/${untaggedPhotos.length}...`);
      try {
        await api.autoTagPhoto(photo.id);
        successCount++;
      } catch (err) {
        console.error("Auto-tag failed for photo", photo.id, err);
      }
    }

    setIsScanning(false);
    setScanProgress("");
    alert(`Đã tự động gắn thẻ thành công ${successCount}/${untaggedPhotos.length} ảnh.`);
    fetchAll(); // Refresh photos to show tags
  };

  const handleDownloadAlbum = (albumId: string) => {
    const token = localStorage.getItem('auth_token');
    const apiUrl = API_BASE_URL.replace('/v1', '');
    const downloadUrl = `${apiUrl}/download/album/${albumId}${token ? `?token=${token}` : ''}`;
    
    // In Tauri/Browser, setting window.location.href to a download endpoint
    // will trigger a save prompt or download without replacing the page.
    window.location.href = downloadUrl;
  };

  const openShareModal = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setShareModalAlbum(album);
    setIsShareModalOpen(true);
  };

  const handleGenerateShareLink = async () => {
    if (!shareModalAlbum) return;
    try {
      const updatedAlbum = await api.shareAlbum(shareModalAlbum.id);
      setAlbums(prev => prev.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
      setShareModalAlbum(updatedAlbum);
    } catch (err) {
      console.error(err);
      alert('Tạo liên kết chia sẻ thất bại.');
    }
  };

  const handleUnshareAlbum = async () => {
    if (!shareModalAlbum) return;
    try {
      const updatedAlbum = await api.unshareAlbum(shareModalAlbum.id);
      setAlbums(prev => prev.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
      setShareModalAlbum(updatedAlbum);
    } catch (err) {
      console.error(err);
      alert('Ngừng chia sẻ thất bại.');
    }
  };

  const fetchAll = () => {
    api.getAlbums().then(setAlbums).catch(console.error);
    api.getPhotos().then(setPhotos).catch(console.error);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!isUploading) {
      fetchAll();
    }
  }, [isUploading]);

  // Infer parentId if not provided by backend
  const processedAlbums = albums.map(a => {
    if (a.parentId) return a;
    const possibleParents = albums.filter(p => 
      a.id !== p.id && a.name.toLowerCase().startsWith(p.name.toLowerCase() + ' ')
    );
    if (possibleParents.length > 0) {
      possibleParents.sort((x, y) => y.name.length - x.name.length);
      return { ...a, parentId: possibleParents[0].id };
    }
    return a;
  });

  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

  // Helper to recursively collect a folder ID and all descendant subfolder IDs
  const getFolderAndSubfolderIds = (folderId: string): string[] => {
    const directChildren = processedAlbums.filter(a => a.parentId === folderId);
    let ids: string[] = [folderId];
    for (const child of directChildren) {
      ids = ids.concat(getFolderAndSubfolderIds(child.id));
    }
    return ids;
  };

  const currentFolderAndSubfolderIds = currentFolderId ? getFolderAndSubfolderIds(currentFolderId) : [];
  const currentAlbumPhotos = currentFolderId
    ? photos.filter(p => p.albumId && currentFolderAndSubfolderIds.includes(p.albumId))
    : [];

  const currentAlbums = processedAlbums.filter(a => 
    currentFolderId ? a.parentId === currentFolderId : !a.parentId
  );
  
  const { selectedIds, clearSelection } = useSelection();

  const handleBreadcrumbDrop = async (targetAlbumId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedIds.length === 0) return;

    try {
      await api.movePhotosToAlbum(selectedIds, targetAlbumId);
      clearSelection();
      alert(`Đã chuyển ${selectedIds.length} ảnh sang ${targetAlbumId ? 'album' : 'Bộ sưu tập chính'} thành công!`);
      fetchAll();
    } catch (err: any) {
      console.error(err);
      alert(`Chuyển ảnh thất bại: ${err?.message || err}`);
    }
  };

  const handleNavigate = async (folder: Album) => {
    if (folder.isLocked) {
      const passcode = prompt("Album này đã bị khóa. Vui lòng nhập mật khẩu:");
      if (passcode === null) return;
      try {
        const lockedPhotos = await api.getPhotos(folder.id, passcode);
        setPhotos(prev => {
          const others = prev.filter(p => p.albumId !== folder.id);
          return [...others, ...lockedPhotos];
        });
      } catch (err) {
        alert("Mật khẩu không chính xác hoặc có lỗi xảy ra.");
        return;
      }
    }
    setCurrentPath(prev => [...prev, folder]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(prev => prev.slice(0, index + 1));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    try {
      if (!e.dataTransfer.items) return;

      const items = Array.from(e.dataTransfer.items);
      let localAlbums = [...albums];
      let hasValidFiles = false;

      for (const item of items) {
        if (item.kind !== 'file') continue;
        const entry = item.webkitGetAsEntry();
        if (!entry) continue;

        let targetAlbumId = currentFolderId;

        if (entry.isDirectory) {
          const folderName = entry.name;
          const finalAlbumName = folderName; // We no longer prefix with parent's name!

          const existingAlbum = localAlbums.find(a => a.name.toLowerCase() === finalAlbumName.toLowerCase() && a.parentId === currentFolderId);
          
          if (existingAlbum) {
            targetAlbumId = existingAlbum.id;
          } else {
            try {
              const newAlbum = await api.createAlbum(finalAlbumName, currentFolderId);
              targetAlbumId = newAlbum.id;
              localAlbums.push(newAlbum);
            } catch (err) {
              console.error("Tạo album thất bại", err);
              const refreshedAlbums = await api.getAlbums();
              localAlbums = refreshedAlbums;
              const found = localAlbums.find(a => a.name.toLowerCase() === finalAlbumName.toLowerCase() && a.parentId === currentFolderId);
              if (found) targetAlbumId = found.id;
            }
          }
        }

        const files = await extractFilesFromEntry(entry);
        const validFiles = files.filter(f => {
          if (f.type?.startsWith('image/') || f.type?.startsWith('video/')) return true;
          const ext = f.name.split('.').pop()?.toLowerCase();
          return ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'mp4', 'mov', 'webm'].includes(ext);
        });

        if (validFiles.length > 0) {
          addJobs(validFiles, targetAlbumId || undefined);
          hasValidFiles = true;
        }
      }

      if (hasValidFiles) {
        api.getAlbums().then(setAlbums).catch(console.error);
      } else {
        console.warn("Không tìm thấy ảnh hoặc video hợp lệ trong các tệp đã thả.");
      }
    } catch (error) {
      console.error("Tải lên thất bại", error);
      alert("Đưa tệp vào hàng đợi tải lên thất bại");
    }
  };

  const openCreateModal = () => {
    navigate('/albums/create' + (currentFolderId ? `?parentId=${currentFolderId}` : ''));
  };

  const openEditModal = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    navigate(`/albums/edit/${album.id}`);
  };

  // No longer needed as saving is handled by CreateAlbumPage
  const handleSaveAlbum = async () => {};

  const handleDeleteAlbum = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (confirm('Bạn có chắc chắn muốn xóa album này không?')) {
      try {
        const deleteRecursively = async (albumId: string) => {
          const subs = processedAlbums.filter(sub => sub.parentId === albumId);
          for (const sub of subs) {
            await deleteRecursively(sub.id);
          }
          
          const albumPhotos = photos.filter(p => p.albumId === albumId);
          await Promise.all(
            albumPhotos.map(p => 
              api.updatePhotoAlbum(p.id, null).catch(err => console.warn("Gỡ ảnh thất bại", err))
            )
          );
          
          await api.deleteAlbum(albumId);
        };

        await deleteRecursively(id);
        fetchAll();
      } catch (err: any) {
        console.error(err);
        alert(`Xóa album thất bại: ${err.message || 'Lỗi không xác định'}`);
      }
    }
  };

  return (
    <motion.div 
      className="page-content" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.3 }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        border: dragActive ? '2px dashed var(--accent-primary)' : '2px solid transparent',
        backgroundColor: dragActive ? 'rgba(var(--accent-primary-rgb), 0.02)' : 'transparent',
        borderRadius: '12px',
        minHeight: '100%',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="breadcrumb-nav">
              <span 
                className={`breadcrumb-item ${currentPath.length === 0 ? 'active' : ''}`}
                onClick={() => handleBreadcrumbClick(-1)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleBreadcrumbDrop(null, e)}
                title="Kéo thả ảnh được chọn vào đây để chuyển ra Bộ sưu tập chính"
              >
                Bộ sưu tập
              </span>
              {currentPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight size={18} className="breadcrumb-sep" />
                  <span 
                    className={`breadcrumb-item ${index === currentPath.length - 1 ? 'active' : ''}`}
                    onClick={() => handleBreadcrumbClick(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleBreadcrumbDrop(folder.id, e)}
                    title={`Kéo thả ảnh được chọn vào đây để chuyển sang album ${folder.name}`}
                  >
                    {folder.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <p className="page-subtitle" style={{ marginTop: '0.5rem' }}>
              Nhóm các bức ảnh của bạn theo sự kiện, chuyến đi, hoặc chủ đề.
            </p>
          </div>
          <motion.button onClick={openCreateModal} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary">
            <Plus size={16} /> Album mới
          </motion.button>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
        {currentAlbums.map(a => {
          const subAlbums = processedAlbums.filter(sub => sub.parentId === a.id);
          const hasSubfolders = subAlbums.length > 0;
          
          let displayCover = a.coverImage;
          if (!displayCover) {
            const albumPhotos = photos.filter(p => p.albumId === a.id);
            if (albumPhotos.length > 0) {
              displayCover = albumPhotos[0].url || albumPhotos[0].cloudUrl || null;
            } else if (hasSubfolders) {
              for (const sub of subAlbums) {
                const subPhotos = photos.filter(p => p.albumId === sub.id);
                if (subPhotos.length > 0) {
                   displayCover = subPhotos[0].url || subPhotos[0].cloudUrl || null;
                   break;
                }
              }
            }
          }

          return (
            <motion.div 
              variants={itemVariants}
              className="polaroid-card" 
              key={a.id} 
              style={{ zIndex: activeMenuId === a.id ? 20 : 1 }}
              onClick={() => {
                handleNavigate(a);
              }}
            >
              <div className="polaroid-image-wrapper">
                  {displayCover ? (
                    <img src={displayCover} alt={a.name} />
                  ) : (
                    <div style={{ background: 'var(--bg-secondary)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {hasSubfolders ? <Folder size={36} color="var(--text-muted)" /> : <Folder size={36} color="var(--text-tertiary)" />}
                    </div>
                  )}
              </div>
              <div className="polaroid-caption" style={{ padding: '0 0.25rem', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
                <div className="album-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1.05rem' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.name}>
                    {(() => {
                      let displayName = a.name;
                      if (a.parentId) {
                        const parent = processedAlbums.find(p => p.id === a.parentId);
                        if (parent && a.name.toLowerCase().startsWith(parent.name.toLowerCase() + ' ')) {
                          displayName = a.name.substring(parent.name.length + 1);
                        }
                      }
                      return displayName;
                    })()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {a.isLocked && (
                      <Lock size={14} color="var(--text-muted)" />
                    )}
                    {hasSubfolders && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                        {subAlbums.length}
                      </span>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === a.id ? null : a.id); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                {activeMenuId === a.id && (
                  <div className="vintage-dropdown">
                    <button className="vintage-dropdown-item" onClick={(e) => { e.stopPropagation(); handleNavigate(a); }}>
                      <FolderOpen size={14} /> Mở album
                    </button>
                    <button className="vintage-dropdown-item" onClick={(e) => { e.stopPropagation(); navigate('/upload'); }}>
                      <UploadCloud size={14} /> Thêm ảnh
                    </button>
                    <button className="vintage-dropdown-item" onClick={(e) => openShareModal(a, e)}>
                      <Share2 size={14} /> Chia sẻ
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                    <button className="vintage-dropdown-item" onClick={(e) => openEditModal(a, e)}>
                      <Edit2 size={14} /> Đổi tên
                    </button>
                    <button className="vintage-dropdown-item danger" onClick={(e) => handleDeleteAlbum(a.id, e)}>
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                )}
                <div className="album-count" style={{ marginTop: '2px', fontFamily: 'var(--font-body)', fontStyle: 'normal' }}>Đã tạo {a.createdAt?.split('T')[0]}</div>
              </div>
            </motion.div>
          );
        })}

        {/* Create new album card */}
        {!currentFolderId && (
          <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          onClick={openCreateModal}
          className="polaroid-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            border: '2px dashed var(--border-medium)',
            cursor: 'pointer',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            background: 'transparent',
            boxShadow: 'none'
          }}
        >
          <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
            <Plus size={24} color="var(--accent-primary)" />
          </div>
          <span style={{ fontWeight: 500, fontFamily: 'var(--font-heading)' }}>Tạo Album</span>
          </motion.div>
        )}
      </motion.div>

      {/* Photos in current album */}
      {currentFolderId && (
        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Tất cả ảnh</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setIsSlideshowOpen(true)}
                className="btn btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--accent-primary)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontWeight: 500
                }}
              >
                <Play size={16} fill="white" />
                Trình chiếu (Windows 7)
              </button>
              <button
                onClick={() => handleDownloadAlbum(currentFolderId)}
                className="btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--bg-polaroid)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-medium)",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "20px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Tải xuống
              </button>
              <button
                onClick={handleScanAlbum}
                disabled={isScanning}
                className="btn btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: isScanning ? "var(--bg-secondary)" : "var(--accent-1)",
                  color: isScanning ? "var(--text-secondary)" : "white",
                  border: "none",
                  cursor: isScanning ? "not-allowed" : "pointer",
                  padding: "6px 12px",
                  borderRadius: "20px"
                }}
              >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 12 2.1 7.1" />
                <path d="M12 12l9.9 4.9" />
              </svg>
              {isScanning ? scanProgress : "Quét AI"}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {currentAlbumPhotos.map((p) => (
              <PhotoCard key={p.id} photo={p} />
            ))}
          </div>
        </div>
      )}

      {isShareModalOpen && shareModalAlbum && (
        <ShareModal 
          album={shareModalAlbum} 
          onClose={() => setIsShareModalOpen(false)} 
          onUpdate={(updated: Album) => {
            setAlbums(albums.map(a => a.id === updated.id ? updated : a));
            setShareModalAlbum(updated);
          }} 
        />
      )}

      {isSlideshowOpen && currentFolderId && (
        <SlideshowModal
          photos={currentAlbumPhotos}
          albumName={currentPath[currentPath.length - 1]?.name || "Album"}
          onClose={() => setIsSlideshowOpen(false)}
        />
      )}

    </motion.div>
  );
}
