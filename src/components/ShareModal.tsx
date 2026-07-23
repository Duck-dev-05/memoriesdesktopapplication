import React, { useState, useEffect } from 'react';
import { X, Globe, Link, Copy, Mail, User, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, API_BASE_URL, Album } from '../api';
import { openUrl } from '@tauri-apps/plugin-opener';

interface ShareModalProps {
  album: Album;
  onClose: () => void;
  onUpdate: (updatedAlbum: Album) => void;
}

export default function ShareModal({ album, onClose, onUpdate }: ShareModalProps) {
  const [shares, setShares] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShares();
  }, [album.id]);

  const fetchShares = async () => {
    try {
      const data = await api.getAlbumShares(album.id);
      setShares(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      const updated = await api.shareAlbum(album.id);
      onUpdate(updated);
    } catch (err) {
      console.error(err);
      alert('Tạo liên kết thất bại');
    }
  };

  const handleUnshareAlbum = async () => {
    try {
      const updated = await api.unshareAlbum(album.id);
      onUpdate(updated);
    } catch (err) {
      console.error(err);
      alert('Ngừng chia sẻ thất bại');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    try {
      await api.inviteToAlbum(album.id, inviteEmail, inviteRole);
      setInviteEmail('');
      await fetchShares();
    } catch (err: any) {
      alert(err.message || 'Mời người dùng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await api.removeAlbumShare(album.id, shareId);
      await fetchShares();
    } catch (err) {
      alert('Xóa quyền truy cập thất bại');
    }
  };

  const shareUrl = `${API_BASE_URL.replace('/api/v1', '')}/shared/${album.shareToken}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(59, 47, 47, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-medium)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(201, 122, 126, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Globe size={24} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Chia sẻ Album</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Quản lý quyền truy cập cho album "{album.name}".</p>
        </div>

        {/* Link Sharing Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Liên kết công khai</h3>
          {album.shareToken ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <Link size={16} color="var(--text-muted)" />
                <input type="text" readOnly value={shareUrl} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }} />
                <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 500, fontSize: '0.9rem' }}>
                  <Copy size={14} /> Copy
                </button>
              </div>
              <button onClick={handleUnshareAlbum} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', fontSize: '0.85rem' }}>
                Tắt liên kết công khai
              </button>
            </div>
          ) : (
            <button onClick={handleGenerateShareLink} className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-elevated)' }}>
              Tạo liên kết chia sẻ
            </button>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1.5rem 0' }} />

        {/* Email Invitation Section */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Mời người dùng</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="email" 
              placeholder="Email người dùng..." 
              value={inviteEmail} 
              onChange={e => setInviteEmail(e.target.value)}
              style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', outline: 'none' }} 
            />
            <select 
              value={inviteRole} 
              onChange={e => setInviteRole(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', outline: 'none' }}
            >
              <option value="VIEWER">Chỉ xem</option>
              <option value="EDITOR">Đóng góp</option>
            </select>
            <button onClick={handleInvite} disabled={loading || !inviteEmail} className="btn btn-primary" style={{ padding: '0 1rem' }}>
              Mời
            </button>
          </div>

          <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Người có quyền truy cập</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {shares.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Chưa có ai được mời.</p>
            ) : (
              shares.map(share => (
                <div key={share.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {share.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{share.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{share.user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                      {share.role === 'EDITOR' ? 'Đóng góp' : 'Chỉ xem'}
                    </span>
                    <button onClick={() => handleRemoveShare(share.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
