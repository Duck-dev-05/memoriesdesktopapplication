import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, Photo, PhotoStats, Album } from '../api';
import PolaroidCard from '../components/PolaroidCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

export default function HomePage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stats, setStats] = useState<PhotoStats | null>(null);
  const [memories, setMemories] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [randomPhoto, setRandomPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    api.getPhotosWithLimit(15).then(p => {
      setPhotos(p);
      if (p.length > 0) {
        setRandomPhoto(p[Math.floor(Math.random() * p.length)]);
      }
    }).catch(console.error);
    api.getPhotoStats().then(setStats).catch(console.error);
    api.getMemories().then(setMemories).catch(console.error);
    api.getAlbums().then(allAlbums => {
      const mainAlbums = allAlbums.filter(a => !a.parentId);
      setAlbums(mainAlbums);
    }).catch(console.error);
  }, []);

  return (
    <motion.div className="page-content" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: '100%' }}>
      
      {/* Hero */}
      <div className="hero-banner" style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        background: 'radial-gradient(circle at 100% 50%, rgba(201,122,126,0.1) 0%, transparent 50%), var(--bg-polaroid)', 
        padding: '2rem 3rem', borderRadius: 'var(--radius-lg)', marginBottom: '3rem', 
        border: 'var(--border-delicate)', boxShadow: 'var(--shadow-md)', 
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--violet-gradient)' }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          <div className="spotlightBadge" style={{ marginBottom: '1rem', border: 'none', padding: 0 }}>
            {getGreeting()}
          </div>
          <h1 style={{ 
            fontSize: '3.5rem', margin: '0 0 1rem 0', lineHeight: 1.1, 
            color: 'var(--text-primary)', fontFamily: 'var(--font-heading)'
          }}>
            Lưu Giữ Những<br/>
            <span className="text-accent handwritten" style={{ fontSize: '1.2em' }}>
              Trang Đời Đẹp Nhất
            </span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Một không gian riêng tư, hoài niệm để bạn nâng niu, cất giữ và sống lại những đoạn đường đã qua qua lăng kính thời gian.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <motion.button onClick={() => navigate('/timeline')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Lật Mở Kỷ Niệm
            </motion.button>
            <motion.button onClick={() => navigate('/upload')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(253, 251, 247, 0.5)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <UploadCloud size={18} /> Thêm Trang Mới
            </motion.button>
          </div>
        </div>

        {/* Interactive Polaroid Stack */}
        {photos.length >= 4 && (
          <div style={{ position: 'relative', width: '220px', height: '240px', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
            {photos.slice(0,4).map((p, i) => {
              const tapeRot = (i % 2 === 0 ? -3 : 2) + Math.random() * 2 - 1;
              return (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: i === 0 ? -12 : i === 1 ? 4 : i === 2 ? -6 : 14 }}
                transition={{ delay: 0.2 + (i * 0.1), type: 'spring', stiffness: 200, damping: 20 }}
                whileHover={{ scale: 1.05, zIndex: 10, rotate: 0 }}
                style={{
                  position: 'absolute',
                  width: '140px', height: '180px',
                  background: '#fdfbf7',
                  padding: '8px 8px 0 8px',
                  borderRadius: '2px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  zIndex: 4 - i,
                  transformOrigin: 'bottom center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => navigate(`/photo/${p.id}`)}
              >
                <div className="washi-tape" style={{ top: '-10px', left: '50%', marginLeft: '-45px', transform: `rotate(${tapeRot}deg)` }}></div>
                <div style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                  <img src={p.url || p.cloudUrl || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.15) contrast(1.1)' }} />
                </div>
                <div className="handwritten" style={{ height: '40px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#2a2020' }}>
                  {p.dateTaken ? p.dateTaken.split('T')[0] : "Kỷ niệm"}
                </div>
              </motion.div>
            )})}
          </div>
        )}
      </div>

      {/* Infinite Photo Marquee */}
      {photos.length > 3 && (
        <section className="marqueeSection" style={{ margin: '0 -2rem 3rem' }}>
          <div className="marqueeTrack">
            {[...photos, ...photos].map((p, i) => (
              <div key={`${p.id}-${i}`} className="marqueeItem" onClick={() => navigate(`/photo/${p.id}`)} style={{ '--index': i } as any}>
                <div className="washi-tape" style={{ top: '-10px', left: '50%', marginLeft: '-40px' }}></div>
                <div className="marqueeImageWrapper">
                  <img src={p.url || p.cloudUrl || ''} className="marqueeMedia" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* On This Day Memories */}
      {memories.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <span className="section-title" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Ngày này năm xưa</span>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Khám phá lại những kỷ niệm vào đúng ngày này trong những năm trước.</p>
            </div>
          </div>
          <motion.div 
            variants={containerVariants} 
            initial="hidden" animate="show" 
            style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              gap: '1.5rem', 
              paddingBottom: '2rem', 
              paddingTop: '1rem',
              margin: '0 -2rem',
              paddingLeft: '2rem',
              paddingRight: '2rem',
              scrollSnapType: 'x mandatory'
            }}
          >
            {memories.map((p) => (
              <div key={p.id} style={{ flex: '0 0 auto', width: '200px', scrollSnapAlign: 'start', paddingBottom: '20px' }}>
                <PolaroidCard photo={p} />
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Spotlight Memory */}
      {randomPhoto && (
        <section className="spotlightSection" style={{ margin: '0 0 3rem' }}>
          <div className="spotlightBackground">
            <img src={randomPhoto.url || randomPhoto.cloudUrl || ''} className="spotlightBgMedia" />
            <div className="spotlightOverlay" />
          </div>
          <div className="spotlightContent">
            <div className="spotlightTextSide">
              <div className="spotlightBadge">Tiêu Điểm Kỷ Niệm</div>
              <div className="sticky-note handwritten" style={{ maxWidth: '400px', transform: 'rotate(-2deg)', display: 'block', textDecoration: 'none', color: '#2a2020', fontSize: '2rem', cursor: 'pointer' }} onClick={() => navigate(`/photo/${randomPhoto.id}`)}>
                "{(randomPhoto.altText && randomPhoto.altText !== 'Uploaded photo' && randomPhoto.altText.trim() !== '') ? randomPhoto.altText : "Một khoảnh khắc đáng nhớ, được lưu giữ mãi mãi."}"
              </div>
            </div>
            <div className="spotlightFrame" style={{ cursor: 'pointer' }} onClick={() => navigate(`/photo/${randomPhoto.id}`)}>
              <div className="washi-tape" style={{ top: '-15px', right: '-10px', transform: 'rotate(45deg)' }}></div>
              <div className="washi-tape" style={{ bottom: '-15px', left: '-10px', transform: 'rotate(45deg)' }}></div>
              <div className="spotlightImageWrapper">
                <img src={randomPhoto.url || randomPhoto.cloudUrl || ''} className="spotlightMedia" />
              </div>
              <div className="spotlightFrameCaption handwritten" style={{ fontSize: '2rem', textAlign: 'center', padding: '0 1rem' }}>
                {randomPhoto.dateTaken ? randomPhoto.dateTaken.split('T')[0] : "Kỷ niệm quý giá"}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Expanding Albums Gallery */}
      {albums.length > 0 && (
        <section className="albumsSection" style={{ margin: '0 -2rem 4rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '3rem', width: '100%' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '1rem', marginTop: 0 }}>Các Chương Sách Nổi Bật</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>
              Cuộc đời là một cuốn sách, và đây là những chương tuyệt vời nhất mà bạn đã viết lên.
            </p>
          </div>
          <div className="expandingGallery" style={{ padding: '0 2rem' }}>
            {albums.slice(0, 5).map(album => (
              <div key={album.id} className="expandCard" onClick={() => navigate(`/albums/${album.id}`)}>
                {album.coverImage ? (
                  <img src={album.coverImage} className="expandMedia" />
                ) : (
                  <div className="expandMedia" style={{ background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--border-delicate) 100%)' }} />
                )}
                <div className="expandOverlay">
                  <div className="expandTitleVertical">{album.name}</div>
                  <div className="expandContent">
                    <h3 className="expandTitle">{album.name}</h3>
                    <p className="expandDesc">{album.description || "Chưa có mô tả cho chương này."}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="stats-container">
        <div className="stats-bar">
          {[
            { value: stats !== null ? stats.totalPhotos : '...', label: 'Khoảnh khắc' },
            { value: stats !== null ? stats.totalAlbums : '...', label: 'Chương sách' },
            { value: stats !== null ? stats.totalFavorites : '...', label: 'Yêu thích' },
          ].map((s, idx) => (
            <React.Fragment key={s.label}>
              <motion.div variants={itemVariants} className="stat-item">
                <span className="stat-num">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </motion.div>
              {idx < 2 && <div className="stat-divider" />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
