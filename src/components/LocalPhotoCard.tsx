import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { convertFileSrc } from '@tauri-apps/api/core';
import { CheckCircle2, Circle } from 'lucide-react';

interface LocalFile {
  name: string;
  path: string;
  size: number;
  lastModified: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function LocalPhotoCard({ 
  file, 
  isSelected = false, 
  onSelect 
}: { 
  file: LocalFile;
  isSelected?: boolean;
  onSelect?: (path: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    try {
      let finalUrl = convertFileSrc(file.path);
      // Ensure absolute paths on Windows use the correct URL format without URL-encoding the slashes
      if (finalUrl.startsWith('C:') || finalUrl.startsWith('/')) {
        finalUrl = `http://asset.localhost/${file.path.replace(/\\/g, '/')}`;
      }
      setImageUrl(finalUrl);
    } catch (e) {
      console.error("Failed to convert file src", e);
    }
  }, [file.path]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(file.path);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 4px var(--accent-1)' : 'var(--shadow-sm)',
        aspectRatio: '1/1',
        background: 'var(--bg-secondary)',
        cursor: 'pointer',
        transform: isSelected ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <motion.div style={{ width: '100%', height: '100%' }} variants={{ hover: { scale: 1.05 } }} transition={{ duration: 0.3 }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={file.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {file.name}
          </div>
        )}
      </motion.div>

      {/* Checkbox Overlay */}
      {(isHovered || isSelected) && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            left: '0.5rem',
            zIndex: 10,
            color: isSelected ? 'var(--accent-1)' : 'rgba(255,255,255,0.7)',
            background: isSelected ? 'white' : 'transparent',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {isSelected ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} />}
        </div>
      )}

      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 40%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1rem',
          color: 'white',
          opacity: 0,
          transition: 'opacity 0.2s'
        }}
        whileHover={{ opacity: 1 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <span style={{ 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            textOverflow: 'ellipsis', 
            overflow: 'hidden', 
            whiteSpace: 'nowrap',
            marginBottom: '0.2rem'
          }}>
            {file.name}
          </span>
          <span style={{ 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            {formatBytes(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
