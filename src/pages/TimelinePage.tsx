import React, { useEffect, useState, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { api, Photo } from '../api';
import PhotoCard from '../components/PhotoCard';
import { Virtuoso } from 'react-virtuoso';

type ListItem =
  | { type: 'header'; label: string; count: number }
  | { type: 'row'; photos: Photo[] };

export default function TimelinePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    api.getPhotos().then(data => {
      setPhotos(data);
    }).catch(console.error);
  }, []);

  // Compute items based on width
  const items = useMemo(() => {
    // Group by date
    const grouped: Record<string, Photo[]> = {};
    for (const p of photos) {
      const dateStr = (p.dateTaken || p.createdAt) ? (p.dateTaken || p.createdAt).split('T')[0] : 'Unknown Date';
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(p);
    }
    const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // Assume each card is min 200px wide, plus gap
    const columns = Math.max(1, Math.floor(containerWidth / 220));

    const listItems: ListItem[] = [];
    for (const key of sortedKeys) {
      const groupPhotos = grouped[key];
      listItems.push({ type: 'header', label: key, count: groupPhotos.length });

      // Chunk photos into rows
      for (let i = 0; i < groupPhotos.length; i += columns) {
        listItems.push({ type: 'row', photos: groupPhotos.slice(i, i + columns) });
      }
    }
    return listItems;
  }, [photos, containerWidth]);

  return (
    <div
      className="page-content"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      ref={el => {
        if (el && el.clientWidth !== containerWidth) {
          setContainerWidth(el.clientWidth);
        }
      }}
    >
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2 className="page-title">Timeline</h2>
        <p className="page-subtitle">Browse your memories chronologically.</p>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Virtuoso
          data={items}
          style={{ height: '100%' }}
          itemContent={(_index, item) => {
            if (item.type === 'header') {
              return (
                <div className="timeline-date-label" style={{ paddingTop: '1rem' }}>
                  {item.label}
                  <div className="timeline-date-line" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {item.count} photos
                  </span>
                </div>
              );
            }

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`,
                gap: '1.5rem',
                paddingBottom: '1.5rem'
              }}>
                {item.photos.map(p => (
                  <PhotoCard key={p.id} photo={p} />
                ))}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
