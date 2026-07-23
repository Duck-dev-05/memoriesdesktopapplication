import React from 'react';
import { Camera, Code, Globe, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title">Giới thiệu</h2>
        <p className="page-subtitle">Ứng dụng Memories Photos trên Desktop</p>
      </div>

      {/* App identity card */}
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg,#7c6fff,#c084fc)',
          borderRadius: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 8px 24px rgba(124,111,255,0.4)',
          animation: 'float 4s ease-in-out infinite',
        }}>
          <Camera size={34} color="#fff" />
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg,#7c6fff,#c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
        }}>
          Memories Photos
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
          Ứng dụng trên Desktop
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '0.5rem',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-accent)',
        }}>
          Phiên bản 1.0.0
        </div>
      </div>

      {/* Tech stack */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <span className="section-title">Được xây dựng bằng</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {[
            { name: 'Tauri',       color: 'rgba(255,188,64,0.12)', border: 'rgba(255,188,64,0.3)', text: '#fbbf24' },
            { name: 'React',       color: 'rgba(97,218,251,0.12)',  border: 'rgba(97,218,251,0.3)',  text: '#67e8f9' },
            { name: 'TypeScript',  color: 'rgba(49,120,198,0.12)',  border: 'rgba(49,120,198,0.3)',  text: '#60a5fa' },
            { name: 'Vite',        color: 'rgba(124,111,255,0.12)', border: 'rgba(124,111,255,0.3)', text: '#a89fff' },
            { name: 'React Router',color: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.3)',  text: '#f9a8d4' },
            { name: 'Lucide Icons',color: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#6ee7b7' },
          ].map((t) => (
            <span
              key={t.name}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                background: t.color,
                border: `1px solid ${t.border}`,
                color: t.text,
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary">
          <Code size={15} /> Kho lưu trữ GitHub
        </button>
        <button className="btn btn-secondary">
          <Globe size={15} /> Truy cập trang web
        </button>
        <button className="btn btn-secondary">
          <Heart size={15} style={{ color: '#f43f5e' }} /> Hỗ trợ
        </button>
      </div>
    </div>
  );
}
