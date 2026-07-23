import React, { useEffect, useState } from 'react';
import { LogOut, Shield, Cloud, CreditCard, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  
  const [usedBytes, setUsedBytes] = useState(0);
  const TOTAL_BYTES = 15 * 1024 * 1024 * 1024; // 15 GB

  useEffect(() => {
    // Fetch actual user data and stats
    api.getMe().then(data => {
      if (data.user) {
        setUserEmail(data.user.email);
        setUserName(data.user.name);
        if (data.user.image) {
          setUserAvatar(data.user.image);
        }
      }
      if (data.stats && data.stats.storageUsed !== undefined) {
        setUsedBytes(data.stats.storageUsed);
      }
    }).catch(console.error);

    // If no avatar from getMe, try local storage from google login
    const savedAvatar = localStorage.getItem('google_avatar');
    if (savedAvatar && !userAvatar) setUserAvatar(savedAvatar);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('google_avatar');
    navigate('/login');
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản không? Hành động này không thể hoàn tác!')) {
      try {
        await api.deleteAccount();
        handleLogout();
      } catch (err) {
        console.error('Lỗi khi xóa tài khoản:', err);
        alert('Có lỗi xảy ra khi xóa tài khoản.');
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = Math.min((usedBytes / TOTAL_BYTES) * 100, 100);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '2rem' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h1 className="page-title">Hồ sơ</h1>
        <p className="page-subtitle">Quản lý tài khoản và các tùy chọn cá nhân</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: User Card */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--surface-raised)' }}>
          <div style={{ 
            width: '96px', height: '96px', borderRadius: '50%', 
            background: userAvatar ? 'transparent' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', marginBottom: '1.5rem',
            fontSize: '2rem', fontWeight: 'bold', overflow: 'hidden'
          }}>
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : (
              userName ? userName.charAt(0).toUpperCase() : '?'
            )}
          </div>
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{userName || 'Loading...'}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{userEmail}</p>

          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}>
            Chỉnh sửa hồ sơ
          </button>
          
          <button 
            className="btn" 
            onClick={handleLogout}
            style={{ 
              width: '100%', justifyContent: 'center', 
              color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', border: 'none'
            }}
          >
            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
            Đăng xuất
          </button>
        </div>

        {/* Right Column: Settings & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section: Storage */}
          <div className="card" style={{ background: 'var(--surface-raised)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={18} color="var(--accent-primary)" />
              Dung lượng lưu trữ
            </h3>
            <div style={{ background: 'var(--bg-secondary)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ width: `${usagePercent}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>{formatSize(usedBytes)} đã dùng</span>
              <span>Tổng 15 GB</span>
            </div>
          </div>

          {/* Section: Account Settings */}
          <div className="card" style={{ background: 'var(--surface-raised)', padding: '0' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Cài đặt tài khoản</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <Shield size={20} color="var(--text-secondary)" style={{ marginRight: '1rem' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Bảo mật & Quyền riêng tư</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Đổi mật khẩu và 2FA</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <Cloud size={20} color="var(--text-secondary)" style={{ marginRight: '1rem' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Đồng bộ đám mây</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quản lý đồng bộ thiết bị</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer' }}>
                <CreditCard size={20} color="var(--text-secondary)" style={{ marginRight: '1rem' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Thanh toán & Gói cước</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nâng cấp giới hạn lưu trữ</p>
                </div>
              </div>

            </div>
          </div>

          {/* Danger Zone */}
          <div className="card" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#f43f5e', marginBottom: '0.5rem' }}>Khu vực nguy hiểm</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Hành động này không thể hoàn tác. Vui lòng cân nhắc kỹ trước khi xóa tài khoản.
            </p>
            <button className="btn" style={{ background: '#f43f5e', color: 'white' }} onClick={handleDeleteAccount}>
              Xóa tài khoản
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
