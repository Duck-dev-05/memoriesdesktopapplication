import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { LogIn } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        // Navigate to home after successful login
        navigate('/');
      } else {
        setError('Đăng nhập thất bại, không nhận được token.');
      }
    } catch (err: any) {
      setError(err.message || 'Thông tin xác thực không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = credentialResponse.credential;
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        if (payload.picture) localStorage.setItem('google_avatar', payload.picture);
      } catch (e) {}

      const res = await api.loginWithGoogle(idToken);
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        navigate('/');
      } else {
        setError('Đăng nhập Google thất bại, không nhận được token.');
      }
    } catch (err: any) {
      setError(err.message || 'Xác thực với Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleNativeGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const port = await invoke<number>('start_oauth_server');
      const clientId = '895961799970-2a7t32h2026q2b2ajqei9b4hp27fmvo3.apps.googleusercontent.com';
      const redirectUri = `http://localhost:${port}/callback`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'id_token',
        scope: 'email profile',
        nonce: Math.random().toString(36).substring(2)
      });

      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      const unlisten = await listen<string>('oauth-token', async (event) => {
        const tokenUrl = event.payload;
        const queryStr = tokenUrl.split('?')[1] || '';
        const urlParams = new URLSearchParams(queryStr);
        const idToken = urlParams.get('id_token');
        const errorMsg = urlParams.get('error');

        if (errorMsg) {
          setError(`Đăng nhập Google bị hủy hoặc thất bại: ${errorMsg}`);
          setLoading(false);
          unlisten();
          return;
        }

        if (idToken) {
          try {
            try {
              const payload = JSON.parse(atob(idToken.split('.')[1]));
              if (payload.picture) localStorage.setItem('google_avatar', payload.picture);
            } catch (e) {}

            const res = await api.loginWithGoogle(idToken);
            if (res.token) {
              localStorage.setItem('auth_token', res.token);
              navigate('/');
            } else {
              setError('Đăng nhập Google thất bại, không nhận được token.');
            }
          } catch (err: any) {
            setError(err.message || 'Xác thực với Google thất bại');
          } finally {
            setLoading(false);
          }
        } else {
          setError('Đăng nhập Google thất bại: Không nhận được id_token');
          setLoading(false);
        }
        unlisten();
      });

      await openUrl(oauthUrl);
    } catch (err: any) {
      setError('Khởi động đăng nhập Google thất bại: ' + err.message);
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
            <LogIn size={24} />
          </div>
          <h2 className="page-title" style={{ marginBottom: '0.5rem' }}>Chào mừng bạn quay lại</h2>
          <p className="page-subtitle">Đăng nhập vào tài khoản</p>
        </div>

        {error && (
          <div style={{
            padding: '12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e',
            borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '1rem', padding: '12px', width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>HOẶC</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {isTauri ? (
            <div style={{ width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleNativeGoogleLogin}
                disabled={loading}
                style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                Đăng nhập bằng Google
              </button>
              {loading && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setLoading(false)}
                  style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
                >
                  Hủy đăng nhập
                </button>
              )}
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Khởi tạo Đăng nhập Google thất bại. Thử lại hoặc dùng email.');
              }}
              theme="outline"
              shape="rectangular"
              text="signin_with"
              width="100%"
            />
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Chưa có tài khoản? <Link to="/signup" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 500 }}>Đăng ký</Link>
        </div>

      </div>
    </div>
  );
}
