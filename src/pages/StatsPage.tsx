import React, { useEffect, useState } from 'react';
import { Image, Heart, TrendingUp, HardDrive, Smartphone, Camera, MapPin, Folder, Activity, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, PhotoStats, Photo } from '../api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

export default function StatsPage() {
  const [stats, setStats] = useState<PhotoStats | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPhotoStats(),
      api.getPhotos()
    ]).then(([s, p]) => {
      setStats(s);
      setPhotos(p);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const monthlyStats = stats?.monthlyUploads || [];
  const maxMonthlyCount = Math.max(...monthlyStats.map((m) => m.count), 1);

  // Extract Top Devices and Locations
  const deviceCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  let totalWithLocation = 0;
  let totalWithDevice = 0;

  photos.forEach(p => {
    let deviceName = p.cameraModel;
    if (deviceName) {
      if (p.cameraMake && !deviceName.toLowerCase().includes(p.cameraMake.toLowerCase()) && p.cameraMake.toLowerCase() !== 'apple') {
        deviceName = `${p.cameraMake} ${deviceName}`;
      }
      deviceCounts[deviceName] = (deviceCounts[deviceName] || 0) + 1;
      totalWithDevice++;
    } else if (p.cameraMake) {
      deviceCounts[p.cameraMake] = (deviceCounts[p.cameraMake] || 0) + 1;
      totalWithDevice++;
    }

    if (p.locationName) {
      const loc = p.locationName.split(',')[0].trim();
      if (loc) {
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        totalWithLocation++;
      }
    }
  });

  const topDevices = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxDeviceCount = topDevices.length > 0 ? topDevices[0][1] : 1;

  const topLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxLocationCount = topLocations.length > 0 ? topLocations[0][1] : 1;

  // Calculate real total size from uploaded photos
  const realTotalSizeBytes = photos.reduce((acc, p) => acc + (p.fileSize || 0), 0);
  const finalSizeBytes = stats && stats.totalSizeBytes > 0 ? stats.totalSizeBytes : realTotalSizeBytes;

  const storageGB = (finalSizeBytes / (1024 * 1024 * 1024)).toFixed(3);
  const storagePercentage = Math.min((finalSizeBytes / (15 * 1024 * 1024 * 1024)) * 100, 100);

  return (
    <div className="page-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 3rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Analytics Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid var(--border-delicate)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-1)', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Activity size={16} /> Analytics Dashboard
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '0', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-1px' }}>Thống kê Dữ liệu</h2>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
          Real-time Sync Active
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Row 1: KPI Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {[
            { label: 'TỔNG SỐ ẢNH', value: stats?.totalPhotos || 0, icon: <Image size={20} />, trend: '+12%', color: '#3b82f6' },
            { label: 'ALBUM', value: stats?.totalAlbums || 0, icon: <Folder size={20} />, trend: '+2', color: '#8b5cf6' },
            { label: 'YÊU THÍCH', value: stats?.totalFavorites || 0, icon: <Heart size={20} />, trend: '0%', color: '#ec4899' },
            { label: 'LƯU TRỮ (GB)', value: storageGB, icon: <HardDrive size={20} />, trend: `${storagePercentage.toFixed(1)}%`, color: '#10b981' }
          ].map((kpi) => (
            <motion.div key={kpi.label} variants={itemVariants} style={{
              background: 'var(--bg-polaroid)', padding: '1.5rem', borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
              display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>{kpi.label}</span>
                <div style={{ color: kpi.color, background: `${kpi.color}15`, padding: '6px', borderRadius: '8px' }}>
                  {kpi.icon}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {kpi.value}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981', background: '#10b98115', padding: '2px 6px', borderRadius: '4px' }}>
                  {kpi.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Row 2: Charts & Progress */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          
          {/* Monthly Uploads Chart */}
          <motion.div variants={itemVariants} style={{ background: 'var(--bg-polaroid)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>
              <BarChart2 size={18} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Tần suất Tải lên (6 Tháng)</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', gap: '1rem', padding: '0 1rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              {monthlyStats.length > 0 ? monthlyStats.map(m => (
                <div key={m.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{m.count}</span>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.count / maxMonthlyCount) * 100}%` }}
                    transition={{ duration: 0.8, type: 'spring' }}
                    style={{ width: '100%', maxWidth: '40px', background: 'linear-gradient(to top, var(--accent-2), var(--accent-1))', borderRadius: '4px 4px 0 0', opacity: 0.85 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '4px' }}>{m.month.substring(0,3)}</span>
                </div>
              )) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>
              )}
            </div>
          </motion.div>

          {/* Storage Breakdown */}
          <motion.div variants={itemVariants} style={{ background: 'var(--bg-polaroid)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              <HardDrive size={18} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Quota Lưu trữ</h3>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Đã dùng</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{storagePercentage.toFixed(1)}%</span>
              </div>
              <div style={{ height: '24px', background: 'rgba(0,0,0,0.04)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${storagePercentage}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  style={{ height: '100%', background: storagePercentage > 90 ? '#ef4444' : storagePercentage > 75 ? '#f59e0b' : '#10b981' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>0 GB</span>
                <span>15.0 GB</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Row 3: Metadata Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Devices Distribution */}
          <motion.div variants={itemVariants} style={{ background: 'var(--bg-polaroid)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Camera size={18} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Phân tích Thiết bị (Camera/Phone)</h3>
              </div>
              <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>{totalWithDevice} records</span>
            </div>
            
            {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing EXIF data...</p> : topDevices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topDevices.map(([device, count]) => {
                  const percentage = ((count / totalWithDevice) * 100).toFixed(1);
                  const isPhone = device.toLowerCase().includes('iphone') || device.toLowerCase().includes('samsung') || device.toLowerCase().includes('pixel');
                  return (
                    <div key={device}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isPhone ? <Smartphone size={14} color="var(--text-muted)" /> : <Camera size={14} color="var(--text-muted)" />}
                          {device}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{count} ({percentage}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxDeviceCount) * 100}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', background: '#3b82f6' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                Không có đủ dữ liệu EXIF để phân tích.
              </div>
            )}
          </motion.div>

          {/* Locations Distribution */}
          <motion.div variants={itemVariants} style={{ background: 'var(--bg-polaroid)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <MapPin size={18} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Phân tích Địa điểm (GPS)</h3>
              </div>
              <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>{totalWithLocation} records</span>
            </div>
            
            {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing Geotags...</p> : topLocations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topLocations.map(([loc, count]) => {
                  const percentage = ((count / totalWithLocation) * 100).toFixed(1);
                  return (
                    <div key={loc}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{loc}</span>
                        <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{count} ({percentage}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxLocationCount) * 100}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', background: '#8b5cf6' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                Không có đủ dữ liệu GPS để phân tích.
              </div>
            )}
          </motion.div>

        </div>

      </motion.div>
    </div>
  );
}
