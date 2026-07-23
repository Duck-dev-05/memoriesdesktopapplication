import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, FolderPlus, Edit3, Lock, Unlock } from 'lucide-react';
import { api, Album } from '../api';

export default function CreateAlbumPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>(); 
  
  const parentId = searchParams.get('parentId');
  const isEditMode = Boolean(id);
  
  const [albumNameInput, setAlbumNameInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockPasscode, setLockPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      api.getAlbums().then(albums => {
        const found = albums.find(a => a.id === id);
        if (found) {
          setAlbumNameInput(found.name);
          setIsLocked(!!found.isLocked);
          // Passcode is generally not returned for security, so we leave it empty for the user to set a new one if they want, or we don't update it if left empty
        }
      }).catch(console.error);
    }
  }, [isEditMode, id]);

  const handleSaveAlbum = async () => {
    if (!albumNameInput.trim() || isSubmitting) return;
    if (isLocked && !lockPasscode && !isEditMode) {
      alert("Vui lòng nhập mật khẩu cho album khóa");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await api.updateAlbum(id, albumNameInput.trim(), isLocked, lockPasscode || undefined);
      } else {
        await api.createAlbum(albumNameInput.trim(), parentId || null, isLocked, lockPasscode || null);
      }
      navigate(-1);
    } catch (e) {
      console.error(e);
      alert('Lưu album thất bại');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100%',
      padding: '2rem'
    }}>
      
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', background: 'var(--accent-glow)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'rgba(192, 132, 252, 0.15)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.6 }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          padding: '3rem',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '480px',
          boxShadow: 'var(--shadow-lg), 0 24px 48px rgba(0,0,0,0.05)',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10
        }}
      >
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            position: 'absolute', top: '2rem', left: '2rem',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', 
            cursor: 'pointer', color: 'var(--text-muted)', width: '36px', height: '36px', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', zIndex: 2
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1rem' }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'var(--accent-subtle)', borderRadius: '16px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
            color: 'var(--accent-primary)', boxShadow: '0 8px 16px var(--accent-glow)'
          }}>
            {isEditMode ? <Edit3 size={32} /> : <FolderPlus size={32} />}
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, 
            color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' 
          }}>
            {isEditMode ? 'Đổi tên Album' : 'Tạo Album mới'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {isEditMode ? 'Đặt một tên mới cho bộ sưu tập của bạn.' : 'Bắt đầu một bộ sưu tập mới cho những kỷ niệm quý giá của bạn.'}
          </p>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tên Album
          </label>
          <input 
            type="text" 
            value={albumNameInput}
            onChange={(e) => setAlbumNameInput(e.target.value)}
            placeholder="VD: Kỳ nghỉ hè 2026"
            autoFocus
            disabled={isSubmitting}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveAlbum()}
            style={{
              width: '100%', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-xl)', 
              border: '2px solid var(--border-subtle)', background: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500,
              outline: 'none', transition: 'all 0.25s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              opacity: isSubmitting ? 0.7 : 1,
              marginBottom: '1.5rem'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--accent-subtle)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '8px', background: isLocked ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)', color: isLocked ? '#ef4444' : 'var(--text-muted)', borderRadius: '12px' }}>
                {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>Khóa Album</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cần nhập mật khẩu để xem ảnh</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
              <span className="slider round"></span>
            </label>
          </div>

          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Mật khẩu {isEditMode ? '(Để trống nếu không muốn đổi)' : ''}</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={lockPasscode}
                    onChange={(e) => setLockPasscode(e.target.value)}
                    style={{
                      width: '100%', padding: '1rem', borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          onClick={handleSaveAlbum} 
          disabled={isSubmitting || !albumNameInput.trim()}
          style={{ 
            width: '100%', padding: '1.1rem', background: 'var(--violet-gradient)', 
            border: 'none', cursor: (isSubmitting || !albumNameInput.trim()) ? 'not-allowed' : 'pointer', 
            color: '#fff', fontSize: '1.1rem', fontWeight: 600,
            borderRadius: 'var(--radius-xl)', transition: 'all 0.3s ease',
            boxShadow: '0 8px 20px var(--accent-glow)',
            opacity: (isSubmitting || !albumNameInput.trim()) ? 0.6 : 1,
            transform: (isSubmitting || !albumNameInput.trim()) ? 'scale(0.98)' : 'scale(1)'
          }}
          onMouseOver={(e) => { if(!isSubmitting && albumNameInput.trim()) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 24px var(--accent-glow)'; } }}
          onMouseOut={(e) => { if(!isSubmitting && albumNameInput.trim()) { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 20px var(--accent-glow)'; } }}
        >
          {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo Album')}
        </button>
      </motion.div>
    </div>
  );
}
