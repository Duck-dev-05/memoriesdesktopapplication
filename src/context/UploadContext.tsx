import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { useNotifications } from './NotificationContext';

export type UploadJob = {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  albumId?: string;
  error?: string;
};

type UploadContextType = {
  jobs: UploadJob[];
  addJobs: (files: File[], albumId?: string) => void;
  clearCompleted: () => void;
  cancelJob: (id: string) => void;
  isUploading: boolean;
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const { addNotification } = useNotifications();

  const addJobs = useCallback(async (files: File[], albumId?: string) => {
    const newJobs = files.map(f => ({
      id: Math.random().toString(36).substring(2, 11),
      file: f,
      progress: 0,
      status: 'pending' as const,
      albumId
    }));
    
    setJobs(prev => [...prev, ...newJobs]);

    let successCount = 0;
    let errorCount = 0;

    // Process sequentially
    for (const job of newJobs) {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'uploading', progress: 10 } : j));
      
      try {
        const progressInterval = setInterval(() => {
            setJobs(prev => prev.map(j => {
                if (j.id === job.id && j.progress < 90) {
                    return { ...j, progress: j.progress + Math.floor(Math.random() * 15) };
                }
                return j;
            }));
        }, 400);

        await api.addPhoto(job.file, job.albumId);
        
        clearInterval(progressInterval);
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed', progress: 100 } : j));
        successCount++;
      } catch (error: any) {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', error: error.message || "Failed" } : j));
        errorCount++;
      }
    }

    try {
      let userSettings: any = {};
      const savedSettings = localStorage.getItem('user_settings');
      if (savedSettings) {
        try { userSettings = JSON.parse(savedSettings); } catch (e) {}
      }

      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      
        // 1. Upload Complete Setting
        if (userSettings['Upload Complete'] !== false) {
          let body = `Tải lên thành công ${successCount} ảnh.`;
          if (errorCount > 0) {
            body += ` Lỗi tải lên: ${errorCount} ảnh.`;
          }
          
          // Desktop Notification
          if (permissionGranted) {
            sendNotification({ title: 'Memories', body });
          }
          
          // In-App Notification
          addNotification('Tải lên hoàn tất', body, errorCount > 0 ? 'warning' : 'success');
        }

      
    } catch (err) {
      console.error("Không thể gửi thông báo:", err);
    }
  }, [addNotification]);

  const clearCompleted = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status !== 'completed' && j.status !== 'error'));
  }, []);

  const cancelJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const isUploading = jobs.some(j => j.status === 'uploading' || j.status === 'pending');

  return (
    <UploadContext.Provider value={{ jobs, addJobs, clearCompleted, cancelJob, isUploading }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
