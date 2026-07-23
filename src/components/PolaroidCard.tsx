import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Photo } from '../api';

export default function PolaroidCard({ photo }: { photo: Photo }) {
  const defaultImageUrl = photo.url || photo.cloudUrl;
  const imageUrl = defaultImageUrl;
  const navigate = useNavigate();
  const year = (photo.dateTaken || photo.createdAt).split('-')[0];

  return (
    <div 
      className="polaroid-card"
      onClick={() => navigate(`/photo/${photo.id}`)}
      style={{ width: '100%' }} // Let container control width
    >
      <div className="washi-tape" style={{ top: '-12px', left: '50%', marginLeft: '-45px', transform: 'rotate(-2deg)' }}></div>
      <div className="polaroid-img-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={photo.altText || "Ảnh"} className="polaroid-img" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {photo.altText || "Ảnh"}
          </div>
        )}
      </div>
      <span className="polaroid-year">{year}</span>
      <div className="polaroid-caption">
        {photo.altText && photo.altText !== "Uploaded photo" ? photo.altText : "Kỷ niệm"}
      </div>
    </div>
  );
}
