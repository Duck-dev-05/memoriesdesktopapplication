import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { api, Photo } from '../api';

export default function TrashPage() {
  const [trashPhotos, setTrashPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const photos = await api.getTrashPhotos();
      setTrashPhotos(photos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleEmptyTrash = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tất cả các mục trong thùng rác không? Hành động này không thể hoàn tác.")) return;
    
    try {
      await api.emptyTrash();
      setTrashPhotos([]);
    } catch (e) {
      console.error(e);
      alert("Dọn dẹp thùng rác thất bại");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restorePhotos([id]);
      setTrashPhotos(trashPhotos.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("Khôi phục ảnh thất bại");
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="page-title">Thùng rác</h2>
            <p className="page-subtitle">Ảnh ở đây sẽ bị xóa vĩnh viễn sau 30 ngày.</p>
          </div>
          <button 
            className="btn btn-danger" 
            onClick={handleEmptyTrash}
            disabled={trashPhotos.length === 0}
          >
            <Trash2 size={15} /> Dọn dẹp thùng rác
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div
        className="card"
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '2rem',
          padding: '1rem 1.25rem',
        }}
      >
        <AlertTriangle size={18} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, color: '#f87171', fontSize: '0.875rem' }}>
            Các mục tự động xóa sau 30 ngày
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
            Khôi phục ảnh trước khi chúng bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
          </div>
        </div>
      </div>

      {!loading && trashPhotos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ width: 84, height: 84 }}>
            <Trash2 size={34} />
          </div>
          <div className="empty-title">Thùng rác trống</div>
          <p className="empty-desc">
            Ảnh và video bạn xóa sẽ xuất hiện ở đây trước khi bị xóa vĩnh viễn.
          </p>
        </div>
      ) : (
        <div style={{
          columns: '3 200px',
          columnGap: '6px',
          gap: '6px',
        }}>
          {trashPhotos.map((f, i) => (
            <div
              key={f.id}
              className="photo-card"
              style={{
                breakInside: 'avoid',
                aspectRatio: 'unset',
                height: 200 + (i % 3) * 30, // fake variable height
                marginBottom: '6px',
                display: 'inline-block',
                width: '100%',
                background: (f.url || f.cloudUrl) ? 'transparent' : 'linear-gradient(135deg,#6b7280,#374151)',
                position: 'relative'
              }}
            >
              {(f.url || f.cloudUrl) && (
                <img src={(f.url || f.cloudUrl)!} alt={f.altText || "Ảnh đã xóa"} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
              )}
              <div className="photo-card-overlay" style={{ opacity: 1, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
                  onClick={() => handleRestore(f.id)}
                >
                  <RotateCcw size={16} style={{ marginRight: '6px' }}/> Khôi phục
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
