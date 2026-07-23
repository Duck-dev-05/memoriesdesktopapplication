import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Link as LinkIcon, Folder, Copy, CheckCircle, MoreVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, API_BASE_URL, Album } from '../api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function SharedPage() {
  const [sharedAlbums, setSharedAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSharedAlbums()
      .then(setSharedAlbums)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopyLink = (shareToken: string, albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    const link = `${baseUrl}/shared/${shareToken}`;
    navigator.clipboard.writeText(link);
    setCopiedId(albumId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUnshareAlbum = async (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.unshareAlbum(albumId);
      setSharedAlbums(prev => prev.filter(a => a.id !== albumId));
      setActiveMenuId(null);
    } catch (err) {
      console.error(err);
      alert('Ngừng chia sẻ thất bại.');
    }
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h1 className="page-title">Album đã chia sẻ</h1>
        <p className="page-subtitle">Các album bạn đã chia sẻ qua liên kết công khai.</p>
      </div>

      <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Đang tải...</span>
          </div>
        ) : sharedAlbums.length === 0 ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', margin: '0 2rem 2rem', background: 'var(--surface-sunken)' }}>
            <Users size={48} color="var(--accent-primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Không có album chia sẻ nào</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
              Bạn chưa chia sẻ album nào. Hãy chuyển đến Bộ sưu tập, chọn một album và nhấn "Chia sẻ" để tạo liên kết công khai!
            </p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem', padding: '1rem' }}>
            {sharedAlbums.map((a) => (
              <motion.div 
                key={a.id} 
                variants={itemVariants} 
                className="polaroid-card" 
                style={{ zIndex: activeMenuId === a.id ? 20 : 1 }}
                onClick={() => navigate(`/albums`)}
              >
                <div className="polaroid-image-wrapper">
                  {a.coverImage ? (
                    <img src={a.coverImage} alt={a.name} />
                  ) : (
                    <div style={{ background: 'var(--bg-secondary)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Folder size={36} color="var(--text-tertiary)" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--accent-primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', zIndex: 5, boxShadow: 'var(--shadow-sm)' }}>
                    <LinkIcon size={12} /> Chia sẻ
                  </div>
                </div>
                
                <div className="polaroid-caption" style={{ padding: '0 0.25rem', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
                  <div className="album-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1.05rem' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.name}>
                      {a.name}
                    </span>
                    <div style={{ position: 'relative' }}>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === a.id ? null : a.id); }}>
                        <MoreVertical size={16} color="var(--text-muted)" />
                      </button>
                      
                      {activeMenuId === a.id && (
                        <div className="vintage-dropdown">
                          <button className="vintage-dropdown-item" onClick={(e) => handleCopyLink(a.shareToken!, a.id, e)}>
                            {copiedId === a.id ? (
                              <><CheckCircle size={14} color="var(--success-color, #10b981)" /> Đã sao chép!</>
                            ) : (
                              <><Copy size={14} /> Sao chép liên kết</>
                            )}
                          </button>
                          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                          <button className="vintage-dropdown-item danger" onClick={(e) => handleUnshareAlbum(a.id, e)}>
                            <X size={14} /> Ngừng chia sẻ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
