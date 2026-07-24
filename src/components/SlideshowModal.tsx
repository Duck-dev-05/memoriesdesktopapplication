import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, X, Music, Upload, Clock } from 'lucide-react';
import { Photo } from '../api';
import { ambientSynth } from '../lib/ambientSynth';

interface SlideshowModalProps {
  photos: Photo[];
  initialIndex?: number;
  onClose: () => void;
  albumName?: string;
}

export default function SlideshowModal({ photos, initialIndex = 0, onClose, albumName = "Album" }: SlideshowModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideInterval, setSlideInterval] = useState(5); // 5 seconds
  const [musicMode, setMusicMode] = useState<'synth' | 'custom' | 'mute'>('synth');
  const [volume, setVolume] = useState(0.7);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const imageUrl = currentPhoto?.url || currentPhoto?.cloudUrl || '';

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % photos.length);
    }, slideInterval * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, slideInterval, photos.length]);

  // Audio Music Management
  useEffect(() => {
    if (musicMode === 'synth') {
      if (audioRef.current) audioRef.current.pause();
      ambientSynth.start(volume);
    } else if (musicMode === 'custom' && customAudioUrl) {
      ambientSynth.stop();
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.play().catch(console.error);
      }
    } else {
      ambientSynth.stop();
      if (audioRef.current) audioRef.current.pause();
    }

    return () => {
      ambientSynth.stop();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [musicMode, customAudioUrl]);

  // Volume change
  useEffect(() => {
    if (musicMode === 'synth') {
      ambientSynth.setVolume(volume);
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, musicMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAudioUrl(url);
      setCustomAudioName(file.name);
      setMusicMode('custom');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleCustomAudioUpload}
        style={{ display: 'none' }}
      />
      <audio ref={audioRef} src={customAudioUrl || undefined} loop />

      {/* Top Header Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '1.5rem 2rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px' }}>{albumName}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
            {currentIndex + 1} / {photos.length} — {currentPhoto?.altText || "Kỷ niệm"}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Đóng trình chiếu"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Slide Image (Windows 7 Ken Burns Pan-Zoom effect) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={currentPhoto?.altText || "Slide"}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{ color: '#fff', fontSize: '1.5rem' }}>Ảnh không khả dụng</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Floating Control Bar (Windows 7 style controls) */}
      <div
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          zIndex: 10,
          background: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '9999px',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          color: '#fff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.15)'
        }}
      >
        {/* Previous Button */}
        <button
          onClick={() => setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Ảnh trước"
        >
          <SkipBack size={20} />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(prev => !prev)}
          style={{
            background: 'var(--accent-1, #d97706)',
            border: 'none',
            color: '#fff',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)'
          }}
          title={isPlaying ? "Tạm dừng" : "Tự động phát"}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Next Button */}
        <button
          onClick={() => setCurrentIndex(prev => (prev + 1) % photos.length)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Ảnh tiếp theo"
        >
          <SkipForward size={20} />
        </button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Timer Interval Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <Clock size={16} opacity={0.8} />
          <select
            value={slideInterval}
            onChange={(e) => setSlideInterval(Number(e.target.value))}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value={3} style={{ background: '#222' }}>3s / ảnh</option>
            <option value={5} style={{ background: '#222' }}>5s / ảnh</option>
            <option value={10} style={{ background: '#222' }}>10s / ảnh</option>
          </select>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Music Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <Music size={16} color="var(--accent-1, #f59e0b)" />
          <select
            value={musicMode}
            onChange={(e) => {
              const val = e.target.value as any;
              if (val === 'custom-trigger') {
                fileInputRef.current?.click();
              } else {
                setMusicMode(val);
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value="synth" style={{ background: '#222' }}>🎹 Piano thư giãn (Bản quyền 0%)</option>
            <option value="custom" style={{ background: '#222' }}>
              {customAudioName ? `🎵 ${customAudioName.slice(0, 15)}...` : '📁 Tải nhạc MP3 của bạn'}
            </option>
            <option value="custom-trigger" style={{ background: '#222' }}>➕ Chọn tệp MP3 mới...</option>
            <option value="mute" style={{ background: '#222' }}>🔇 Tắt nhạc</option>
          </select>
        </div>

        {/* Volume Control Slider */}
        {musicMode !== 'mute' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: '70px', accentColor: 'var(--accent-1, #f59e0b)', cursor: 'pointer' }}
            />
          </div>
        )}

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </div>
  );
}
