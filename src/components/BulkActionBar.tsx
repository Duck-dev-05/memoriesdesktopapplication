import React, { useState } from 'react';
import { useSelection } from '../context/SelectionContext';
import { Download, X, HardDrive, FolderOutput, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { api, API_BASE_URL, Album } from '../api';
import { BaseDirectory, join } from '@tauri-apps/api/path';
import { exists, writeFile, mkdir } from '@tauri-apps/plugin-fs';

export default function BulkActionBar() {
  const { selectedIds, clearSelection } = useSelection();
  const [loading, setLoading] = useState(false);
  const [caching, setCaching] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [moving, setMoving] = useState(false);

  const count = selectedIds.length;
  if (count === 0) return null;

  const openMoveModal = async () => {
    try {
      const fetchedAlbums = await api.getAlbums();
      setAlbums(fetchedAlbums);
      setShowMoveModal(true);
    } catch (e) {
      console.error(e);
      alert("Không thể tải danh sách album");
    }
  };

  const handleMove = async (targetAlbumId: string | null) => {
    setMoving(true);
    try {
      await api.movePhotosToAlbum(selectedIds, targetAlbumId);
      clearSelection();
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      if (permissionGranted) {
        sendNotification({ title: 'Memories', body: `Đã chuyển ${count} ảnh thành công` });
      }
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(`Chuyển ảnh thất bại: ${e?.message || e}`);
    }
    setMoving(false);
    setShowMoveModal(false);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = API_BASE_URL.replace('/v1', '');
      const downloadUrl = `${baseUrl}/download/bulk`;

      let savePath: string | null = null;
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

      if (isTauri) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        savePath = await save({
          filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
          defaultPath: `memories-${Date.now()}.zip`,
        });
        if (!savePath) {
          setLoading(false);
          return; // User canceled
        }
      }

      const res = await fetch(downloadUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      
      if (!res.ok) throw new Error("Download failed");
      
      if (isTauri && savePath) {
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const buffer = await res.arrayBuffer();
        await writeFile(savePath, new Uint8Array(buffer));
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `memories-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      clearSelection();

      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      if (permissionGranted) {
        sendNotification({ title: 'Memories', body: `Đã bắt đầu tải xuống ZIP (${count} ảnh)` });
      }

    } catch (e) {
      console.error(e);
      alert("Tải xuống thất bại. Vui lòng thử lại.");
    }
    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
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
            background: "var(--text-primary)",
            color: "var(--bg-primary)",
            borderRadius: "9999px",
            padding: "0.5rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap" }}>
            {count} ảnh đã chọn
          </span>

          <button 
            onClick={openMoveModal}
            disabled={moving}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9rem",
              opacity: moving ? 0.5 : 1,
              transition: "opacity 0.2s"
            }}
            title="Chuyển sang Album khác hoặc chuyển ra ngoài"
          >
            <FolderOutput size={16} />
            {moving ? "Đang chuyển..." : "Chuyển Album"}
          </button>

          <button 
            onClick={handleDownload} 
            disabled={loading || caching}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9rem",
              opacity: loading ? 0.5 : 1,
              transition: "opacity 0.2s"
            }}
            title="Tải xuống ZIP"
          >
            <Download size={16} />
            {loading ? "Đang tải..." : "Tải xuống"}
          </button>

          <button 
            onClick={clearSelection}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "var(--bg-primary)",
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
      </AnimatePresence>

      {/* Move Album Modal */}
      {showMoveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: '16px', width: '100%', maxWidth: '420px',
            padding: '1.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Chuyển {count} ảnh đã chọn</h3>
              <button onClick={() => setShowMoveModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Chọn album đích hoặc gỡ ảnh ra khỏi album hiện tại:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
              <button
                onClick={() => handleMove(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px 14px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                  cursor: 'pointer', textAlign: 'left', fontWeight: 500, color: 'var(--accent-secondary)'
                }}
              >
                <FolderOutput size={18} />
                <span>Chuyển ra ngoài (Bộ sưu tập chính / Gỡ album)</span>
              </button>

              {albums.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleMove(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px 14px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px',
                    cursor: 'pointer', textAlign: 'left', fontWeight: 500, color: 'var(--text-primary)'
                  }}
                >
                  <Folder size={18} color="var(--accent-primary)" />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
