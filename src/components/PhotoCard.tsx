import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Photo } from '../api';
import { useSelection } from '../context/SelectionContext';
import { CheckCircle2, Circle } from 'lucide-react';
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function PhotoCard({ photo, style, featured, onClick }: { photo: Photo, style?: React.CSSProperties, featured?: boolean, onClick?: () => void }) {
  const defaultImageUrl = photo.url || photo.cloudUrl;
  const imageUrl = defaultImageUrl;
  const navigate = useNavigate();
  const { isSelected, toggleSelection, selectedIds } = useSelection();
  const [isHovered, setIsHovered] = useState(false);

  const selected = isSelected(photo.id);
  const selectionActive = selectedIds.length > 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // If we are in "selection mode" (meaning at least one photo is selected),
    // clicking anywhere on the card should toggle selection, not navigate.
    if (selectionActive) {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(photo.id);
      return;
    }
    
    if (onClick) onClick();
    else navigate(`/photo/${photo.id}`);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSelection(photo.id);
  };

  return (
    <motion.div
      data-photo-id={photo.id}
      variants={itemVariants}
      style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 4px var(--accent-1)' : 'var(--shadow-sm)',
        aspectRatio: featured ? '16/9' : '1/1',
        background: 'var(--bg-secondary)',
        transform: selected ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...style
      }}
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <motion.div variants={{ hover: { scale: 1.05 } }} transition={{ duration: 0.3 }} style={{ width: '100%', height: '100%' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={photo.altText || "Ảnh"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {photo.altText || "Ảnh"}
          </div>
        )}
      </motion.div>

      {/* Checkbox Overlay */}
      {(isHovered || selected || selectionActive) && (
        <div
          onClick={handleCheckboxClick}
          style={{
            position: 'absolute',
            top: '0.5rem',
            left: '0.5rem',
            zIndex: 10,
            color: selected ? 'var(--accent-1)' : 'rgba(255,255,255,0.7)',
            background: selected ? 'white' : 'transparent',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {selected ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} />}
        </div>
      )}

      {/* Permanent Overlay */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1rem',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <span style={{ 
            fontSize: '0.95rem', 
            fontWeight: 600, 
            textOverflow: 'ellipsis', 
            overflow: 'hidden', 
            whiteSpace: 'nowrap',
            flex: 1,
            marginRight: '1rem',
            letterSpacing: '0.5px'
          }}>
            {photo.altText && photo.altText !== "Uploaded photo" ? photo.altText : "Kỷ niệm"}
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            fontFamily: 'var(--font-body)', 
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400,
            letterSpacing: '0.5px'
          }}>
            {photo.dateTaken?.split('T')[0] || photo.createdAt.split('T')[0]}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
