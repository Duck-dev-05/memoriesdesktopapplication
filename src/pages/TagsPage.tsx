import React, { useEffect, useState } from 'react';
import { Tag, TrendingUp, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, TagWithCount } from '../api';

const TAG_COLORS = [
  { bg: 'rgba(201, 122, 126, 0.12)', border: 'rgba(201, 122, 126, 0.3)', text: 'var(--accent-1)' },
  { bg: 'rgba(143, 155, 130, 0.12)', border: 'rgba(143, 155, 130, 0.3)', text: 'var(--accent-2)' },
  { bg: 'rgba(209, 191, 174, 0.15)', border: 'rgba(209, 191, 174, 0.4)', text: 'var(--text-secondary)' },
  { bg: 'rgba(110, 95, 95, 0.08)',   border: 'rgba(110, 95, 95, 0.2)',   text: 'var(--text-primary)' },
];

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getTagsWithCount().then(setTags).catch(console.error);
  }, []);

  const handleTagClick = (tagName: string) => {
    navigate(`/search?q=${encodeURIComponent(tagName)}`);
  };

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const popularTags = [...tags].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h2 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Nhãn & Phân loại</h2>
          <p className="page-subtitle" style={{ fontSize: '1.1rem' }}>Khám phá {tags.length} nhãn trong bộ sưu tập của bạn.</p>
        </div>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhãn..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-glass)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-body)'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Main Tag Cloud */}
        <div className="card" style={{ padding: '2.5rem', background: 'var(--bg-polaroid)', boxShadow: 'var(--shadow-md)' }}>
          <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tag size={20} color="var(--accent-1)" />
            <span className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>Tất cả nhãn</span>
          </div>
          
          <div className="tag-cloud" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {filteredTags.length > 0 ? filteredTags.map((tag, i) => {
              const c = TAG_COLORS[i % TAG_COLORS.length];
              return (
                <span
                  key={tag.id}
                  className="badge"
                  style={{ 
                    background: c.bg, 
                    borderColor: c.border, 
                    color: c.text, 
                    cursor: 'pointer',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-full)',
                    transition: 'all var(--ease-normal)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => handleTagClick(tag.name)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.background = c.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = c.bg;
                  }}
                >
                  #{tag.name}
                  <span style={{ 
                    opacity: 0.7, 
                    fontSize: '0.75rem', 
                    background: 'rgba(255,255,255,0.5)',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {tag.count}
                  </span>
                </span>
              );
            }) : (
              <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Không tìm thấy nhãn nào khớp với tìm kiếm.</p>
            )}
          </div>
        </div>

        {/* Popular tags sidebar */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-delicate)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <TrendingUp size={20} color="var(--accent-2)" />
            <h3 className="section-title" style={{ margin: 0, fontSize: '1.1rem' }}>Phổ biến nhất</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {popularTags.map((tag) => {
              const maxCount = Math.max(...popularTags.map(t => t.count), 1);
              const percentage = (tag.count / maxCount) * 100;
              return (
                <div 
                  key={tag.id} 
                  onClick={() => handleTagClick(tag.name)}
                  style={{ 
                    cursor: 'pointer',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    transition: 'background var(--ease-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{tag.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{tag.count} ảnh</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`,
                        background: 'var(--violet-gradient)',
                        borderRadius: '3px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
