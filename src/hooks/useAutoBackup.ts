import { useEffect, useRef } from 'react';
import { readDir, readFile } from '@tauri-apps/plugin-fs';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { join } from '@tauri-apps/api/path';
import { api } from '../api';

export function useAutoBackup() {
  const isRunning = useRef(false);

  useEffect(() => {
    const checkBackup = async () => {
      if (isRunning.current) return;
      
      const folder = localStorage.getItem('auto_backup_folder');
      if (!folder) return;
      
      const settingsStr = localStorage.getItem('user_settings');
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr);
          if (settings['Auto-Backup'] === false) return;
        } catch (e) {}
      }
      
      isRunning.current = true;
      try {
        const entries = await readDir(folder);
        const uploadedStr = localStorage.getItem('auto_backup_uploaded_files');
        const uploaded: string[] = uploadedStr ? JSON.parse(uploadedStr) : [];
        
        let newUploads = 0;
        for (const entry of entries) {
          if (entry.isDirectory) continue;
          if (!entry.name) continue;
          
          const lowerName = entry.name.toLowerCase();
          if (!lowerName.endsWith('.jpg') && !lowerName.endsWith('.jpeg') && !lowerName.endsWith('.png') && !lowerName.endsWith('.webp')) continue;
          
          if (uploaded.includes(entry.name)) continue;
          
          try {
            const filePath = await join(folder, entry.name);
            const fileData = await readFile(filePath);
            
            let mimeType = 'image/jpeg';
            if (lowerName.endsWith('.png')) mimeType = 'image/png';
            if (lowerName.endsWith('.webp')) mimeType = 'image/webp';
            
            const blob = new Blob([fileData], { type: mimeType });
            const file = new File([blob], entry.name, { type: mimeType });
            
            await api.addPhoto(file);
            uploaded.push(entry.name);
            localStorage.setItem('auto_backup_uploaded_files', JSON.stringify(uploaded));
            newUploads++;
          } catch (uploadErr) {
            console.error('Failed to upload', entry.name, uploadErr);
          }
        }
        
        if (newUploads > 0) {
          let permissionGranted = await isPermissionGranted();
          if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
          }
          if (permissionGranted) {
            sendNotification({ title: 'Memories Auto-Backup', body: `Đã tự động sao lưu ${newUploads} ảnh mới.` });
          }
        }

      } catch (e) {
        console.error('Auto backup error:', e);
      } finally {
        isRunning.current = false;
      }
    };

    // Run once on startup after 5 seconds
    const timeout = setTimeout(checkBackup, 5000);
    // Then every 60 seconds
    const interval = setInterval(checkBackup, 60000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);
}
