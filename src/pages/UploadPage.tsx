import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Film, FileImage } from 'lucide-react';
import { api, Photo } from '../api';
import { extractFilesFromDataTransfer } from '../lib/fileDrop';
import { useUpload } from '../context/UploadContext';

export default function UploadPage() {
  const [recentUploads, setRecentUploads] = useState<Photo[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { addJobs, isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecent = () => api.getPhotosWithLimit(4).then(setRecentUploads).catch(console.error);

  useEffect(() => {
    fetchRecent();
  }, []);

  // Refresh recent uploads when all jobs are finished
  useEffect(() => {
    if (!isUploading) {
      fetchRecent();
    }
  }, [isUploading]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const validFiles = files.filter(f => {
      if (f.type.startsWith('image/') || f.type.startsWith('video/')) return true;
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'mp4', 'mov', 'webm'].includes(ext);
    });
    if (validFiles.length > 0) {
      addJobs(validFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.items) {
      const files = await extractFilesFromDataTransfer(e.dataTransfer.items);
      await uploadFiles(files);
    } else if (e.dataTransfer.files) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="page-content" style={{ position: 'relative' }}>
      <div className="page-header">
        <h2 className="page-title">Tải lên</h2>
        <p className="page-subtitle">Thêm ảnh và video mới vào thư viện của bạn.</p>
      </div>

      {/* Drop zone */}
      <div 
        className={`upload-zone ${dragActive ? 'drag-active' : ''}`} 
        style={{ 
          marginBottom: '2rem', 
          border: dragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-medium)',
          backgroundColor: dragActive ? 'rgba(var(--accent-primary-rgb), 0.05)' : 'transparent',
          transition: 'all 0.2s ease'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-icon" style={{ animation: 'float 3s ease-in-out infinite' }}>
          <UploadCloud size={52} color={dragActive ? 'var(--accent-primary)' : 'currentColor'} />
        </div>
        <div>
          <div className="upload-title">Kéo thả tệp hoặc thư mục vào đây</div>
          <p className="upload-subtitle">
            hoặc nhấp để chọn tệp — hỗ trợ JPG, PNG, HEIC, MP4, MOV
          </p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          multiple 
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
        <button 
          className="btn btn-primary" 
          onClick={handleUploadClick} 
          disabled={isUploading}
          style={{ marginTop: '1.5rem', padding: '12px 24px' }}
        >
          <FileImage size={16} /> {isUploading ? "Đang tải lên..." : "Duyệt tệp"}
        </button>
      </div>

      {/* Supported formats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { icon: <ImageIcon size={14} />, label: 'JPEG / PNG' },
          { icon: <ImageIcon size={14} />, label: 'HEIC / HEIF' },
          { icon: <Film size={14} />, label: 'MP4 / MOV' },
          { icon: <FileImage size={14} />, label: 'RAW Files' },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            {f.icon} {f.label}
          </div>
        ))}
      </div>

      {/* Recent uploads */}
      <div className="section-header">
        <span className="section-title">Tải lên gần đây</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {recentUploads.map((file) => (
          <div className="card" key={file.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', gap: '1rem' }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: '8px',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ImageIcon size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {file.altText || "Ảnh"}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {file.fileSize ? (file.fileSize / (1024 * 1024)).toFixed(1) : 0} MB
              </div>
            </div>
            <div style={{
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-accent)',
              padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--text-accent)',
              fontFamily: 'var(--font-heading)', fontStyle: 'italic'
            }}>
              Đã tải lên
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
