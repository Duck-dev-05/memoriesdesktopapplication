import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, X, Music, Clock, Shuffle, Image as ImageIcon } from 'lucide-react';
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
  const [isShuffle, setIsShuffle] = useState(false);
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
  const imageUrl = (currentPhoto as any)?.imageData || currentPhoto?.url || currentPhoto?.cloudUrl || '';
  const isVideo = Boolean(imageUrl?.match(/\.(mp4|webm|ogg|mov)$/i));

  const handleNext = () => {
    if (isShuffle && photos.length > 1) {
      let nextIdx = Math.floor(Math.random() * photos.length);
      while (nextIdx === currentIndex) {
        nextIdx = Math.floor(Math.random() * photos.length);
      }
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex(prev => (prev + 1) % photos.length);
    }
  };

  const handlePrev = () => {
    if (isShuffle && photos.length > 1) {
      let prevIdx = Math.floor(Math.random() * photos.length);
      while (prevIdx === currentIndex) {
        prevIdx = Math.floor(Math.random() * photos.length);
      }
      setCurrentIndex(prevIdx);
    } else {
      setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
    }
  };

  // Lock body scroll while slideshow is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      handleNext();
    }, slideInterval * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, slideInterval, photos.length, isShuffle, currentIndex]);

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
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose, isShuffle, currentIndex]);

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
        zIndex: 2000000,
        background: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)',
        userSelect: 'none'
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: '1.5rem 2.5rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'rgba(201, 122, 126, 0.25)',
            border: '1px solid rgba(201, 122, 126, 0.4)',
            padding: '8px 14px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <ImageIcon size={18} color="var(--accent-primary, #c97a7e)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px', color: '#f3e8e8' }}>
              {currentIndex + 1} / {photos.length}
            </span>
          </div>

          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading, serif)',
              letterSpacing: '0.3px',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              color: '#fff'
            }}>
              {albumName}
            </h3>
            <p style={{
              margin: '3px 0 0',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.7)',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)'
            }}>
              {currentPhoto?.altText || "Khoảnh khắc kỷ niệm"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 1)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Đóng trình chiếu (Esc)"
        >
          <X size={20} />
        </button>
      </motion.div>

      {/* Main Slide Media with Ken Burns Pan-Zoom Effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {imageUrl ? (
            isVideo ? (
              <video
                src={imageUrl}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.6))'
                }}
              />
            ) : (
              <img
                src={imageUrl}
                alt={currentPhoto?.altText || "Slide"}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.6))'
                }}
              />
            )
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              Ảnh không khả dụng
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Floating Glass Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          position: 'absolute',
          bottom: '2rem',
          zIndex: 20,
          background: 'rgba(18, 18, 22, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '9999px',
          padding: '0.6rem 1.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.2rem',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <button
          onClick={handlePrev}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          title="Ảnh trước (Left Arrow)"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={() => setIsPlaying(prev => !prev)}
          style={{
            background: 'linear-gradient(135deg, #c97a7e 0%, #a8585c 100%)',
            border: 'none',
            color: '#fff',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(201, 122, 126, 0.5)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title={isPlaying ? "Tạm dừng (Space)" : "Tự động phát (Space)"}
        >
          {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" style={{ marginLeft: '3px' }} />}
        </button>

        <button
          onClick={handleNext}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          title="Ảnh tiếp theo (Right Arrow)"
        >
          <SkipForward size={16} />
        </button>

        <button
          onClick={() => setIsShuffle(prev => !prev)}
          style={{
            background: isShuffle ? 'rgba(201, 122, 126, 0.3)' : 'rgba(255,255,255,0.08)',
            border: isShuffle ? '1px solid rgba(201, 122, 126, 0.6)' : '1px solid rgba(255,255,255,0.1)',
            color: isShuffle ? '#f3e8e8' : '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: isShuffle ? '0 0 12px rgba(201, 122, 126, 0.4)' : 'none'
          }}
          onMouseEnter={e => {
            if (!isShuffle) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={e => {
            if (!isShuffle) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          title={isShuffle ? "Tắt phát ngẫu nhiên" : "Bật phát ngẫu nhiên (Shuffle)"}
        >
          <Shuffle size={16} color={isShuffle ? "#c97a7e" : "#ffffff"} />
        </button>

        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)' }} />

        {/* Speed select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
          <Clock size={15} color="rgba(255,255,255,0.7)" />
          <select
            value={slideInterval}
            onChange={(e) => setSlideInterval(Number(e.target.value))}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value={3} style={{ background: '#1c1c21', color: '#fff' }}>3s / ảnh</option>
            <option value={5} style={{ background: '#1c1c21', color: '#fff' }}>5s / ảnh</option>
            <option value={10} style={{ background: '#1c1c21', color: '#fff' }}>10s / ảnh</option>
          </select>
        </div>

        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)' }} />

        {/* Music selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
          <Music size={15} color="var(--accent-primary, #c97a7e)" />
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
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '180px'
            }}
          >
            <option value="synth" style={{ background: '#1c1c21', color: '#fff' }}>🎹 Piano thư giãn (Bản quyền 0%)</option>
            <option value="custom" style={{ background: '#1c1c21', color: '#fff' }}>
              {customAudioName ? `🎵 ${customAudioName.slice(0, 14)}...` : '📁 Tải nhạc MP3 của bạn'}
            </option>
            <option value="custom-trigger" style={{ background: '#1c1c21', color: '#fff' }}>➕ Chọn tệp MP3 mới...</option>
            <option value="mute" style={{ background: '#1c1c21', color: '#fff' }}>🔇 Tắt nhạc</option>
          </select>
        </div>

        {musicMode !== 'mute' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {volume === 0 ? <VolumeX size={16} color="rgba(255,255,255,0.6)" /> : <Volume2 size={16} color="rgba(255,255,255,0.8)" />}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: '65px', accentColor: 'var(--accent-primary, #c97a7e)', cursor: 'pointer' }}
            />
          </div>
        )}

        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)' }} />

        <button
          onClick={toggleFullscreen}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </motion.div>
    </div>
  );
}
