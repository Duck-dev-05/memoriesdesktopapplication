import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, Photo } from '../api';
import PhotoCard from '../components/PhotoCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setPhotos([]);
      return;
    }
    
    setIsLoading(true);
    api.searchPhotos(query)
      .then(setPhotos)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title">Kết quả tìm kiếm</h2>
        <p className="page-subtitle">
          {query ? `Hiển thị kết quả cho "${query}"` : 'Nhập từ khóa tìm kiếm để tìm kỷ niệm.'}
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Đang tìm kiếm...
        </div>
      ) : photos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} />
          ))}
        </div>
      ) : query ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Không tìm thấy kết quả</h3>
          <p style={{ color: 'var(--text-muted)' }}>Chúng tôi không thể tìm thấy ảnh nào khớp với "{query}".<br/>Hãy thử tìm kiếm với tên, mô tả hoặc nhãn khác.</p>
        </div>
      ) : null}
    </div>
  );
}
