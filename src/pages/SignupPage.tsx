import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.signup({ name, email, password });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        // Navigate to home after successful signup
        navigate('/');
      } else {
        setError('Đăng ký thất bại, không nhận được token.');
      }
    } catch (err: any) {
      setError(err.message || 'Tạo tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginWithGoogle(credentialResponse.credential);
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        navigate('/');
      } else {
        setError('Xác thực Google thất bại, không nhận được token.');
      }
    } catch (err: any) {
      setError(err.message || 'Xác thực với Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white', marginBottom: '1rem' 
          }}>
            <UserPlus size={24} />
          </div>
          <h2 className="page-title" style={{ marginBottom: '0.5rem' }}>Tạo tài khoản</h2>
          <p className="page-subtitle">Tham gia Memories để lưu ảnh của bạn</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', 
            borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Tên</label>
            <input 
              type="text" 
              className="search-input" 
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="John Doe"
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email</label>
            <input 
              type="email" 
              className="search-input" 
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mật khẩu</label>
            <input 
              type="password" 
              className="search-input"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ marginTop: '1rem', padding: '12px', width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>HOẶC</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Khởi tạo xác thực Google thất bại. Thử lại hoặc dùng email.');
            }}
            theme="outline"
            shape="rectangular"
            text="signup_with"
            width="100%"
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 500 }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
