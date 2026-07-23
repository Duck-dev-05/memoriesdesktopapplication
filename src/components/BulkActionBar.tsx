import React, { useState } from 'react';
import { useSelection } from '../context/SelectionContext';
import { Download, X, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { api, API_BASE_URL } from '../api';
import { BaseDirectory, join } from '@tauri-apps/api/path';
import { exists, writeFile, mkdir } from '@tauri-apps/plugin-fs';

export default function BulkActionBar() {
  const { selectedIds, clearSelection } = useSelection();
  const [loading, setLoading] = useState(false);
  const [caching, setCaching] = useState(false);

  const count = selectedIds.length;
  if (count === 0) return null;

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

      // Native notification
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

  // Save Offline feature removed

  return (
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
          gap: "1.5rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap" }}>
          {count} ảnh đã chọn
        </span>

        {/* Offline save removed */}


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
  );
}
