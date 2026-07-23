import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, AlertCircle, HardDrive, UploadCloud, CheckSquare, X, FolderSync } from 'lucide-react';
import { useUpload } from '../context/UploadContext';

interface LocalFile {
  name: string;
  path: string;
  size: number;
  lastModified: number;
}

export default function LocalPhotosPage() {
  const [photos, setPhotos] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [LocalPhotoCard, setLocalPhotoCard] = useState<any>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [autoBackupFolder, setAutoBackupFolder] = useState<string | null>(null);
  const { addJobs } = useUpload();

  useEffect(() => {
    // Dynamic import to avoid SSR or non-Tauri issues
    import('../components/LocalPhotoCard').then(module => {
      setLocalPhotoCard(() => module.default);
    }).catch(err => {
      console.error("Failed to load LocalPhotoCard", err);
    });

    const savedBackupFolder = localStorage.getItem('auto_backup_folder');
    if (savedBackupFolder) setAutoBackupFolder(savedBackupFolder);
  }, []);

  const handleSelectFolder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Chọn thư mục chứa ảnh'
      });

      if (!selected) {
        setLoading(false);
        return; // User canceled
      }

      const folderPath = Array.isArray(selected) ? selected[0] : selected;
      setCurrentFolder(folderPath);

      const { readDir, stat } = await import('@tauri-apps/plugin-fs');
      const { join } = await import('@tauri-apps/api/path');
      
      const entries = await readDir(folderPath);
      
      const imageFiles: LocalFile[] = [];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

      for (const entry of entries) {
        if (entry.isFile && entry.name) {
          const lowerName = entry.name.toLowerCase();
          const isImage = allowedExtensions.some(ext => lowerName.endsWith(ext));
          
          if (isImage) {
            const filePath = await join(folderPath, entry.name);
            let fileSize = 0;
            let fileTime = 0;
            try {
              const fileStat = await stat(filePath);
              fileSize = fileStat.size;
              fileTime = fileStat.mtime?.getTime() || 0;
            } catch (statErr) {
              console.warn("Could not stat file", filePath);
            }
            
            imageFiles.push({
              name: entry.name,
              path: filePath,
              size: fileSize,
              lastModified: fileTime
            });
          }
        }
      }

      // Sort by newest first
      imageFiles.sort((a, b) => b.lastModified - a.lastModified);
      
      setPhotos(imageFiles);
      setSelectedPaths(new Set());

    } catch (err: any) {
      console.error("Failed to read folder", err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedPaths.size === photos.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(photos.map(p => p.path)));
    }
  };

  const toggleAutoBackup = () => {
    if (!currentFolder) return;
    
    if (autoBackupFolder === currentFolder) {
      localStorage.removeItem('auto_backup_folder');
      setAutoBackupFolder(null);
    } else {
      localStorage.setItem('auto_backup_folder', currentFolder);
      setAutoBackupFolder(currentFolder);
    }
  };

  const handleUploadSelected = async () => {
    if (!navigator.onLine) {
      alert("Bạn cần kết nối mạng để tải ảnh lên đám mây.");
      return;
    }

    try {
      setLoading(true);
      const { readFile } = await import('@tauri-apps/plugin-fs');
      
      const filesToUpload: File[] = [];
      const selectedPhotos = photos.filter(p => selectedPaths.has(p.path));

      for (const photo of selectedPhotos) {
        // Read file bytes from Tauri
        const buffer = await readFile(photo.path);
        // Convert to browser Blob/File
        const blob = new Blob([buffer]);
        // Simple mime type detection based on extension
        const ext = photo.name.split('.').pop()?.toLowerCase();
        let mime = 'image/jpeg';
        if (ext === 'png') mime = 'image/png';
        if (ext === 'webp') mime = 'image/webp';
        if (ext === 'gif') mime = 'image/gif';

        const file = new File([blob], photo.name, { type: mime });
        filesToUpload.push(file);
      }

      addJobs(filesToUpload);
      setSelectedPaths(new Set()); // clear selection
      alert(`Đã thêm ${filesToUpload.length} ảnh vào hàng đợi tải lên!`);
    } catch (err: any) {
      console.error("Upload preparation failed", err);
      alert("Có lỗi khi chuẩn bị tải lên: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', paddingBottom: selectedPaths.size > 0 ? '100px' : '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HardDrive size={28} /> Ảnh trên máy
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            Xem ảnh trực tiếp từ thư mục trên máy tính (Không cần mạng)
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {photos.length > 0 && (
            <button
              onClick={handleSelectAll}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.7 : 1
              }}
            >
              <CheckSquare size={20} />
              {selectedPaths.size === photos.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          )}

          <button
            onClick={handleSelectFolder}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              opacity: loading ? 0.7 : 1
            }}
          >
            <FolderOpen size={20} />
            {loading ? 'Đang đọc...' : 'Chọn thư mục'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {currentFolder && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Thư mục hiện tại: <strong>{currentFolder}</strong>
          </div>
          
          <button
            onClick={toggleAutoBackup}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: autoBackupFolder === currentFolder ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: autoBackupFolder === currentFolder ? '#34c759' : 'var(--text-primary)',
              border: `1px solid ${autoBackupFolder === currentFolder ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <FolderSync size={16} />
            {autoBackupFolder === currentFolder ? 'Đang tự động sao lưu thư mục này' : 'Bật tự động sao lưu thư mục này'}
          </button>
        </div>
      )}

      {photos.length > 0 ? (
        <div 
          className="photo-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          {photos.map((file, idx) => (
            LocalPhotoCard ? (
              <LocalPhotoCard 
                key={file.path + idx} 
                file={file} 
                isSelected={selectedPaths.has(file.path)}
                onSelect={toggleSelection}
              />
            ) : null
          ))}
        </div>
      ) : currentFolder && !loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <HardDrive size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>Không tìm thấy ảnh</h3>
          <p>Không có file ảnh nào (JPG, PNG, WEBP, GIF) trong thư mục này.</p>
        </div>
      ) : !currentFolder && !loading ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
          <FolderOpen size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
          <h2>Chưa chọn thư mục</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            Bấm vào nút "Chọn thư mục" ở góc trên để chọn thư mục chứa ảnh. Memories sẽ hiển thị ngay lập tức và siêu nhanh.
          </p>
        </div>
      ) : null}

      <AnimatePresence>
        {selectedPaths.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "fixed",
              bottom: "2rem",
              left: "50%",
              zIndex: 9999,
              background: "var(--accent-1)",
              color: "white",
              borderRadius: "9999px",
              padding: "0.5rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              fontFamily: "var(--font-body), sans-serif",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap" }}>
              {selectedPaths.size} ảnh đã chọn
            </span>

            <button 
              onClick={handleUploadSelected} 
              disabled={loading || !navigator.onLine}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.9rem",
                opacity: loading || !navigator.onLine ? 0.5 : 1,
                transition: "opacity 0.2s"
              }}
              title={navigator.onLine ? "Tải lên đám mây" : "Cần kết nối mạng để tải lên"}
            >
              <UploadCloud size={16} />
              Tải lên đám mây
            </button>

            <button 
              onClick={() => setSelectedPaths(new Set())}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginLeft: "0.5rem"
              }}
              title="Bỏ chọn tất cả"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
