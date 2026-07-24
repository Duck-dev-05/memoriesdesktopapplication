import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Maximize2, Minimize2, X, Music, Clock, Shuffle, 
  Image as ImageIcon, LayoutGrid, ChevronUp, ChevronDown, Sparkles
} from 'lucide-react';
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
  const [showThumbnails, setShowThumbnails] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

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

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, showThumbnails]);

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
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
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

  const modalContent = (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
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

      {/* Ambient Blurred Background Glow */}
      {imageUrl && !isVideo && (
        <div
          key={`ambient-${currentIndex}`}
          style={{
            position: 'absolute',
            inset: -40,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(75px) brightness(0.32) saturate(1.3)',
            transform: 'scale(1.2)',
            transition: 'background-image 0.8s ease-in-out',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}

      {/* Dark Subtle Radial Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* Top Header Floating Glass Overlay */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: '1.25rem 2rem',
          background: 'linear-gradient(to bottom, rgba(9, 9, 11, 0.9) 0%, rgba(9, 9, 11, 0.4) 60%, rgba(9, 9, 11, 0) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {/* Index Counter Pill */}
          <div style={{
            background: 'rgba(201, 122, 126, 0.2)',
            border: '1px solid rgba(201, 122, 126, 0.4)',
            padding: '8px 16px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <ImageIcon size={16} color="var(--accent-primary, #c97a7e)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.5px', color: '#f8ecec' }}>
              {currentIndex + 1} <span style={{ opacity: 0.6 }}>/</span> {photos.length}
            </span>
          </div>

          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading, serif)',
              letterSpacing: '0.3px',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              color: '#ffffff'
            }}>
              {albumName}
            </h3>
            <p style={{
              margin: '2px 0 0',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.75)',
              textShadow: '0 1px 6px rgba(0,0,0,0.8)',
              maxWidth: '400px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {(currentPhoto as any)?.title || currentPhoto?.altText || "Khoảnh khắc kỷ niệm"}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Ambient Music Indicator Pill */}
          {musicMode === 'synth' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(10px)'
            }}>
              <Sparkles size={14} color="#c97a7e" />
              <span>Nhạc nền Synth</span>
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25 ease',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.85)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 1)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Đóng trình chiếu (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </motion.div>

      {/* Main Media Container with Smooth Transitions */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: showThumbnails ? '5rem 2rem 10rem 2rem' : '5rem 2rem 6rem 2rem',
        transition: 'padding 0.3s ease'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1.0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
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
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.5)'
                  }}
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={currentPhoto?.altText || "Slide"}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.5)',
                    transition: 'transform 0.4s ease'
                  }}
                />
              )
            ) : (
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.25rem',
                fontFamily: 'var(--font-heading)',
                background: 'rgba(255,255,255,0.05)',
                padding: '2rem 3rem',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                Ảnh không khả dụng
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Filmstrip Carousel */}
      <AnimatePresence>
        {showThumbnails && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '5.5rem',
              zIndex: 25,
              width: '90%',
              maxWidth: '900px',
              background: 'rgba(15, 15, 20, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '10px 14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              overflowX: 'auto',
              display: 'flex',
              gap: '10px',
              scrollbarWidth: 'none'
            }}
          >
            {photos.map((p, idx) => {
              const thumbUrl = (p as any)?.imageData || p.url || p.cloudUrl || '';
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={p.id || idx}
                  ref={isSelected ? activeThumbRef : null}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    flexShrink: 0,
                    width: '64px',
                    height: '50px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: isSelected ? '2px solid #c97a7e' : '1px solid rgba(255,255,255,0.15)',
                    padding: 0,
                    background: '#1c1c21',
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.5,
                    transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 14px rgba(201, 122, 126, 0.6)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.opacity = '0.85';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.opacity = '0.5';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={`Thumb ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                      <ImageIcon size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          zIndex: 30,
          background: 'rgba(18, 18, 24, 0.85)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderRadius: '9999px',
          padding: '0.5rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}
      >
        {/* Prev Button */}
        <button
          onClick={handlePrev}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
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
          title="Ảnh trước (Mũi tên trái)"
        >
          <SkipBack size={16} />
        </button>

        {/* Play / Pause Primary Button */}
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
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title={isPlaying ? "Tạm dừng (Space)" : "Tự động phát (Space)"}
        >
          {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" style={{ marginLeft: '3px' }} />}
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
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
          title="Ảnh tiếp theo (Mũi tên phải)"
        >
          <SkipForward size={16} />
        </button>

        {/* Shuffle Button */}
        <button
          onClick={() => setIsShuffle(prev => !prev)}
          style={{
            background: isShuffle ? 'rgba(201, 122, 126, 0.3)' : 'rgba(255,255,255,0.08)',
            border: isShuffle ? '1px solid rgba(201, 122, 126, 0.6)' : '1px solid rgba(255,255,255,0.12)',
            color: isShuffle ? '#f3e8e8' : '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: isShuffle ? '0 0 14px rgba(201, 122, 126, 0.5)' : 'none'
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

        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.18)' }} />

        {/* Speed interval select */}
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
            <option value={3} style={{ background: '#1c1c21', color: '#fff' }}>3 giây</option>
            <option value={5} style={{ background: '#1c1c21', color: '#fff' }}>5 giây</option>
            <option value={10} style={{ background: '#1c1c21', color: '#fff' }}>10 giây</option>
            <option value={15} style={{ background: '#1c1c21', color: '#fff' }}>15 giây</option>
          </select>
        </div>

        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.18)' }} />

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
              maxWidth: '170px'
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
            {volume === 0 ? <VolumeX size={16} color="rgba(255,255,255,0.6)" /> : <Volume2 size={16} color="rgba(255,255,255,0.85)" />}
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

        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.18)' }} />

        {/* Filmstrip Toggle Button */}
        <button
          onClick={() => setShowThumbnails(prev => !prev)}
          style={{
            background: showThumbnails ? 'rgba(201, 122, 126, 0.25)' : 'rgba(255,255,255,0.08)',
            border: showThumbnails ? '1px solid rgba(201, 122, 126, 0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: showThumbnails ? '#f8ecec' : '#fff',
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
          onMouseLeave={e => {
            if (!showThumbnails) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          title={showThumbnails ? "Ẩn danh sách ảnh thu nhỏ" : "Hiện danh sách ảnh thu nhỏ"}
        >
          <LayoutGrid size={16} color={showThumbnails ? "#c97a7e" : "#ffffff"} />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
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
          title={isFullscreen ? "Thoát toàn màn hình (F)" : "Toàn màn hình (F)"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
