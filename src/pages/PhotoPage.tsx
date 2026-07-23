import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Info, Star, Share2, Trash2, 
  ChevronLeft, ChevronRight, X, Calendar, 
  Camera, MapPin, Tag, HardDrive, Maximize2, Check, Edit2, FolderOpen, Wand2
} from 'lucide-react';
import { api, Photo } from '../api';

export default function PhotoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const sharedToken = searchParams.get('shared');
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [showInfo, setShowInfo] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescText, setEditDescText] = useState('');
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  
  const isGuest = !!sharedToken;

  // Fetch photos
  useEffect(() => {
    setIsLoading(true);
    if (sharedToken) {
      api.getPublicSharedAlbum(sharedToken)
        .then(album => {
          if (album && album.photos) {
            setPhotos(album.photos);
            const idx = album.photos.findIndex((p: any) => p.id === id);
            setCurrentIndex(idx);
          } else {
            setCurrentIndex(-1);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      api.getPhotos()
        .then(fetched => {
          setPhotos(fetched);
          const idx = fetched.findIndex(p => p.id === id);
          setCurrentIndex(idx);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id, sharedToken]);

  const currentPhoto = currentIndex >= 0 ? photos[currentIndex] : null;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
      navigate(`/photo/${photos[currentIndex + 1].id}`, { replace: true });
    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
      navigate(`/photo/${photos[currentIndex - 1].id}`, { replace: true });
    } else if (e.key === 'Escape') {
      navigate(-1);
    } else if (e.key === 'i') {
      setShowInfo(prev => !prev);
    }
  }, [currentIndex, photos, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return null;
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Ngày không xác định';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: 'numeric'
    }).format(d);
  };

  // Toggle controls on mouse move (hide after 3s of inactivity)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPhoto) return;
    try {
      const updated = await api.toggleFavorite(currentPhoto.id, !currentPhoto.isFavorite);
      setPhotos(prev => prev.map(p => p.id === currentPhoto.id ? { ...p, isFavorite: updated.isFavorite } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPhoto) return;
    if (confirm('Bạn có chắc chắn muốn chuyển ảnh này vào thùng rác không?')) {
      try {
        await api.deletePhoto(currentPhoto.id);
        // Move to next photo or go back
        if (photos.length > 1) {
          const nextIdx = currentIndex === photos.length - 1 ? currentIndex - 1 : currentIndex + 1;
          navigate(`/photo/${photos[nextIdx].id}`, { replace: true });
        } else {
          navigate(-1);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Đang tải...</div>,
      document.body
    );
  }

  if (!currentPhoto) {
    return createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column' }}>
        <h2>Không tìm thấy ảnh</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Quay lại</button>
      </div>,
      document.body
    );
  }

  const portalContent = (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'radial-gradient(circle at center, #1a1b26 0%, #000000 100%)', zIndex: 9999, display: 'flex', overflow: 'hidden',
      fontFamily: 'var(--font-sans)'
    }}>
      
      {/* Main Image Area */}
      <div 
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setShowControls(prev => !prev)}
      >
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentPhoto.id}
            src={currentPhoto.url || ''} 
            alt={currentPhoto.altText}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            style={{ 
              maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
              userSelect: 'none', pointerEvents: 'none' 
            }}
          />
        </AnimatePresence>

        {/* Top Navigation Bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '1rem 1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  onClick={() => navigate(-1)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <ArrowLeft size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!isGuest && (
                  <>
                    <button 
                      onClick={toggleFavorite}
                      style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      title="Yêu thích"
                    >
                      <Star size={20} fill={currentPhoto.isFavorite ? "#fff" : "none"} />
                    </button>
                    <button 
                      onClick={() => {}}
                      style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      title="Chia sẻ"
                    >
                      <Share2 size={20} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setShowInfo(prev => !prev)}
                  style={{ background: showInfo ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseOver={e => e.currentTarget.style.background = showInfo ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = showInfo ? 'rgba(255,255,255,0.2)' : 'transparent'}
                  title="Thông tin"
                >
                  <Info size={20} />
                </button>
                {!isGuest && (
                  <button 
                    onClick={handleDelete}
                    style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    title="Xóa"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Arrow */}
        <AnimatePresence>
          {showControls && currentIndex > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={(e) => { e.stopPropagation(); navigate(`/photo/${photos[currentIndex - 1].id}${sharedToken ? `?shared=${sharedToken}` : ''}`, { replace: true }); }}
              style={{
                position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                border: 'none', color: '#fff', cursor: 'pointer', width: '48px', height: '48px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <ChevronLeft size={28} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right Arrow */}
        <AnimatePresence>
          {showControls && currentIndex < photos.length - 1 && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={(e) => { e.stopPropagation(); navigate(`/photo/${photos[currentIndex + 1].id}${sharedToken ? `?shared=${sharedToken}` : ''}`, { replace: true }); }}
              style={{
                position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                border: 'none', color: '#fff', cursor: 'pointer', width: '48px', height: '48px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <ChevronRight size={28} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Info Sidebar */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ 
              background: 'rgba(20,20,28,0.7)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
              borderLeft: '1px solid rgba(255,255,255,0.05)', 
              color: '#fff', overflowY: 'auto', flexShrink: 0
            }}
          >
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>Thông tin</h3>
                <button 
                  onClick={() => setShowInfo(false)}
                  style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Description & Alt Text */}
              <div>
                {isEditingDescription ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <textarea 
                      autoFocus
                      value={editDescText}
                      onChange={e => setEditDescText(e.target.value)}
                      style={{ 
                        width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.1)', 
                        border: '1px solid rgba(255,255,255,0.2)', color: '#fff', 
                        borderRadius: '8px', padding: '0.5rem', fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button onClick={() => setIsEditingDescription(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px 8px' }}>Hủy</button>
                      <button 
                        onClick={async () => {
                          try {
                            const updated = await api.updatePhotoDescription(currentPhoto.id, editDescText);
                            setPhotos(prev => prev.map(p => p.id === currentPhoto.id ? { ...p, description: updated.photo.description } : p));
                            setIsEditingDescription(false);
                          } catch(err) {
                            console.error(err);
                          }
                        }}
                        style={{ background: 'var(--accent-primary, #7c6fff)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 12px', borderRadius: '4px' }}
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => { if (!isGuest) { setEditDescText(currentPhoto.description || ''); setIsEditingDescription(true); } }}
                    style={{ cursor: isGuest ? 'default' : 'text', padding: '0.5rem', margin: '-0.5rem', borderRadius: '8px', transition: 'background 0.2s' }}
                    onMouseOver={e => { if (!isGuest) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseOut={e => { if (!isGuest) e.currentTarget.style.background = 'transparent'; }}
                    title={isGuest ? '' : "Nhấn để sửa mô tả"}
                  >
                    <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5, color: currentPhoto.description ? '#fff' : '#888' }}>
                      {currentPhoto.description || (!isGuest ? 'Thêm mô tả...' : 'Không có mô tả')}
                    </p>
                  </div>
                )}
              </div>

              {/* Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Date */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <Calendar size={20} color="#888" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem' }}>{formatDate(currentPhoto.dateTaken || currentPhoto.createdAt)}</div>
                  </div>
                </div>

                {/* File Info */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <HardDrive size={20} color="#888" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem' }}>{currentPhoto.altText || 'image.jpg'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {currentPhoto.fileSize ? <span>{formatFileSize(currentPhoto.fileSize)}</span> : null}
                      {currentPhoto.width && currentPhoto.height && (
                        <>
                          {currentPhoto.fileSize ? <span>•</span> : null}
                          <span>{((currentPhoto.width * currentPhoto.height) / 1000000).toFixed(1)} MP</span>
                          <span>•</span>
                          <span>{currentPhoto.width} × {currentPhoto.height}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Camera Info */}
                {(currentPhoto.cameraMake || currentPhoto.cameraModel) && (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Camera size={20} color="#888" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.95rem' }}>
                        {currentPhoto.cameraMake} {currentPhoto.cameraModel}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {currentPhoto.fNumber && <span>ƒ/{currentPhoto.fNumber}</span>}
                        {currentPhoto.exposureTime && <span>{currentPhoto.exposureTime.includes('/') ? currentPhoto.exposureTime : `1/${Math.round(1/Number(currentPhoto.exposureTime))}`}s</span>}
                        {currentPhoto.focalLength && <span>{currentPhoto.focalLength}mm</span>}
                        {currentPhoto.iso && <span>ISO {currentPhoto.iso}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Location */}
                {currentPhoto.locationName && (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <MapPin size={20} color="#888" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.95rem' }}>{currentPhoto.locationName}</div>
                      {currentPhoto.latitude && currentPhoto.longitude && (
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                          {currentPhoto.latitude.toFixed(4)}, {currentPhoto.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <Tag size={20} color="#888" style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                    {currentPhoto.tags?.map(tag => (
                      <span key={tag.id} style={{ 
                        background: '#333', padding: '4px 10px', borderRadius: '12px', 
                        fontSize: '0.85rem', color: '#ddd' 
                      }}>
                        {tag.name}
                      </span>
                    ))}
                    {!isGuest && (
                      <>
                        <button
                          onClick={async () => {
                            if (isAutoTagging) return;
                            setIsAutoTagging(true);
                            try {
                              const res = await api.autoTagPhoto(currentPhoto.id);
                              if (res.newTags && res.newTags.length > 0) {
                                setPhotos(prev => prev.map(p => {
                                  if (p.id === currentPhoto.id) {
                                    return { ...p, tags: res.photo.tags };
                                  }
                                  return p;
                                }));
                              } else {
                                alert("Không tìm thấy thẻ mới nào.");
                              }
                            } catch (err) {
                              console.error(err);
                              alert("Lỗi khi tạo thẻ tự động.");
                            } finally {
                              setIsAutoTagging(false);
                            }
                          }}
                          style={{
                            background: 'transparent', border: '1px dashed #666', color: '#888',
                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                          title="Tạo thẻ tự động bằng AI"
                        >
                          <Wand2 size={14} /> {isAutoTagging ? 'Đang tạo...' : 'Tự động'}
                        </button>
                        <input 
                          type="text" 
                          placeholder="Thêm nhãn..." 
                          style={{ 
                            background: 'transparent', border: 'none', outline: 'none', 
                            color: '#fff', fontSize: '0.85rem', padding: '4px 0', width: '80px' 
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                              try {
                                const val = e.currentTarget.value.trim();
                                const res = await api.addTag(val, currentPhoto.id);
                                const newTag = res.tag;
                                setPhotos(prev => prev.map(p => {
                                  if (p.id === currentPhoto.id) {
                                    return { ...p, tags: [...(p.tags || []), newTag] };
                                  }
                                  return p;
                                }));
                                e.currentTarget.value = '';
                              } catch(err) {
                                console.error(err);
                              }
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Album */}
                {currentPhoto.album && (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <FolderOpen size={20} color="#888" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#888' }}>Trong Album</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{currentPhoto.album.name}</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );

  return createPortal(portalContent, document.body);
}
