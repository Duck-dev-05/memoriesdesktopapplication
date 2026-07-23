import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, X, CheckCircle, AlertCircle, File, Loader2, RotateCcw } from 'lucide-react';
import { useUpload } from '../context/UploadContext';

export default function UploadStatusBar() {
  const { jobs, clearCompleted, cancelJob, retryJob, retryFailedJobs } = useUpload();
  const [expanded, setExpanded] = useState(true);

  if (jobs.length === 0) return null;

  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'uploading');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const errorJobs = jobs.filter(j => j.status === 'error');

  const total = jobs.length;
  const done = completedJobs.length + errorJobs.length;
  const isAllDone = total > 0 && done === total;

  let title = `Đang tải lên ${activeJobs.length} mục`;
  if (isAllDone) {
    if (errorJobs.length > 0) {
      title = `${completedJobs.length} đã tải lên, ${errorJobs.length} thất bại`;
    } else {
      title = `Hoàn tất ${total} mục tải lên`;
    }
  }

  const handleClose = () => {
    clearCompleted();
    if (activeJobs.length === 0) {
      // It will unmount naturally since jobs.length will be 0
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '360px',
      backgroundColor: 'var(--bg-elevated)',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      border: '1px solid var(--border-subtle)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: isAllDone && errorJobs.length === 0 ? 'var(--accent-primary)' : 'var(--bg-card)',
          color: isAllDone && errorJobs.length === 0 ? 'white' : 'var(--text-primary)',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {errorJobs.length > 0 && activeJobs.length === 0 && (
            <button
              title="Thử lại các tệp lỗi"
              style={{
                background: 'var(--accent-primary, #3b82f6)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500
              }}
              onClick={(e) => {
                e.stopPropagation();
                retryFailedJobs();
              }}
            >
              <RotateCcw size={12} /> Thử lại
            </button>
          )}
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleClose(); }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto', maxHeight: '300px' }}
            exit={{ height: 0 }}
            style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            {jobs.map(job => (
              <div key={job.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                gap: '12px'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '4px',
                  backgroundColor: 'var(--bg-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <File size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 500, 
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {job.file.name}
                  </div>
                  {job.status === 'error' ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-danger, #ef4444)' }}>{job.error}</div>
                  ) : job.status === 'completed' ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success, #10b981)' }}>Đã tải lên</div>
                  ) : (
                    <div style={{ 
                      height: '4px', 
                      background: 'var(--bg-body)', 
                      borderRadius: '2px', 
                      marginTop: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${job.progress}%`, 
                        background: 'var(--accent-primary)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}
                </div>
                <div>
                  {job.status === 'completed' && <CheckCircle size={18} color="var(--color-success, #10b981)" />}
                  {job.status === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        title="Thử lại tệp này"
                        onClick={(e) => {
                          e.stopPropagation();
                          retryJob(job.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary, #6b7280)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <RotateCcw size={15} />
                      </button>
                      <AlertCircle size={18} color="var(--color-danger, #ef4444)" />
                    </div>
                  )}
                  {(job.status === 'uploading' || job.status === 'pending') && (
                    <Loader2 size={18} color="var(--accent-primary)" style={{ animation: 'spin 2s linear infinite' }} />
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
