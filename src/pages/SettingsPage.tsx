import React, { useState, useEffect } from 'react';
import { Moon, Bell, Shield, HardDrive, FolderSync } from 'lucide-react';

function ToggleSwitch({ defaultChecked = false, onChange }: { defaultChecked?: boolean, onChange?: (val: boolean) => void }) {
  const [on, setOn] = useState(defaultChecked);
  
  useEffect(() => {
    setOn(defaultChecked);
  }, [defaultChecked]);

  const handleChange = () => {
    const newVal = !on;
    setOn(newVal);
    if (onChange) onChange(newVal);
  };

  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={on} onChange={handleChange} />
      <div className="toggle-track" />
      <div className="toggle-thumb" style={on ? { left: '23px', background: '#fff' } : {}} />
    </label>
  );
}

const DEFAULT_SETTINGS: Record<string, boolean> = {
  'dark-mode': document.documentElement.getAttribute('data-theme') === 'dark',
  'compact': false,
  'motion': false,
  'Upload Complete': true,
  'Shared Album Activity': true,
  'Storage Warnings': true,
  'Face Recognition': false,
  'Location Metadata': true,
  'Share Analytics': false,
  'Original Quality': true,
  'Auto-Backup': true,
  'HEIC Conversion': false,
};

const SETTINGS_GROUPS = [
  {
    title: 'Giao diện',
    icon: <Moon size={15} />,
    items: [
      { id: 'dark-mode', label: 'Chế độ tối', desc: 'Sử dụng chủ đề màu tối' },
      { id: 'compact', label: 'Thanh bên thu gọn', desc: 'Chỉ hiển thị biểu tượng' },
      { id: 'motion', label: 'Giảm chuyển động', desc: 'Giảm thiểu hiệu ứng hoạt ảnh' },
    ],
  },
  {
    title: 'Thông báo',
    icon: <Bell size={15} />,
    items: [
      { id: 'Upload Complete', label: 'Tải lên hoàn tất', desc: 'Thông báo khi hoàn tất tải lên' },
      { id: 'Shared Album Activity', label: 'Hoạt động album chia sẻ', desc: 'Bình luận hoặc mục mới thêm' },
      { id: 'Storage Warnings', label: 'Cảnh báo dung lượng', desc: 'Cảnh báo khi dùng 80%' },
    ],
  },
  {
    title: 'Quyền riêng tư',
    icon: <Shield size={15} />,
    items: [
      { id: 'Face Recognition', label: 'Nhận diện khuôn mặt', desc: 'Tự động nhóm ảnh theo người' },
      { id: 'Location Metadata', label: 'Siêu dữ liệu vị trí', desc: 'Lưu dữ liệu GPS cùng ảnh' },
      { id: 'Share Analytics', label: 'Chia sẻ dữ liệu phân tích', desc: 'Giúp cải thiện Memories' },
    ],
  },
  {
    title: 'Lưu trữ',
    icon: <HardDrive size={15} />,
    items: [
      { id: 'Original Quality', label: 'Chất lượng gốc', desc: 'Lưu ảnh độ phân giải đầy đủ' },
      { id: 'Auto-Backup', label: 'Tự động sao lưu', desc: 'Đồng bộ khi có WiFi' },
      { id: 'HEIC Conversion', label: 'Chuyển đổi HEIC', desc: 'Chuyển HEIC sang JPEG' },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>(DEFAULT_SETTINGS);
  const [backupFolder, setBackupFolder] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }

    const savedFolder = localStorage.getItem('auto_backup_folder');
    if (savedFolder) {
      setBackupFolder(savedFolder);
    }

    // Fetch app version
    const fetchVersion = async () => {
      try {
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
        if (isTauri) {
          const { getVersion } = await import('@tauri-apps/api/app');
          const version = await getVersion();
          setAppVersion(version);
        }
      } catch (e) {
        console.error('Failed to fetch app version', e);
      }
    };
    fetchVersion();
  }, []);

  const handleSelectFolder = async () => {
    try {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
      if (!isTauri) {
        alert("Tính năng chọn thư mục tự động sao lưu chỉ hỗ trợ trên ứng dụng Desktop.");
        return;
      }
      
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        setBackupFolder(selected);
        localStorage.setItem('auto_backup_folder', selected);
      }
    } catch (e) {
      console.error('Failed to select folder', e);
    }
  };

  const updateSetting = (id: string, val: boolean) => {
    const newSettings = { ...settings, [id]: val };
    setSettings(newSettings);
    localStorage.setItem('user_settings', JSON.stringify(newSettings));

    if (id === 'dark-mode') {
      if (val) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }
    if (id === 'compact') {
      if (val) document.documentElement.setAttribute('data-sidebar', 'compact');
      else document.documentElement.removeAttribute('data-sidebar');
    }
    if (id === 'motion') {
      if (val) document.documentElement.setAttribute('data-reduced-motion', 'true');
      else document.documentElement.removeAttribute('data-reduced-motion');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title">Cài đặt</h2>
        <p className="page-subtitle">Cấu hình trải nghiệm Memories của bạn.</p>
      </div>

      {SETTINGS_GROUPS.map((group) => (
        <div className="settings-group" key={group.title}>
          <div className="settings-group-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-secondary)' }}>{group.icon}</span>
              <span className="settings-group-title">{group.title}</span>
            </div>
          </div>
          {group.items.map((item: any) => (
            <div className="toggle-row" key={item.id}>
              <div className="toggle-info">
                <span className="toggle-label">{item.label}</span>
                <span className="toggle-desc">{item.desc}</span>
              </div>
              <ToggleSwitch 
                defaultChecked={settings[item.id]} 
                onChange={(val) => updateSetting(item.id, val)}
              />
            </div>
          ))}
        </div>
      ))}

      <div className="settings-group">
        <div className="settings-group-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-secondary)' }}><FolderSync size={15} /></span>
            <span className="settings-group-title">Tự động sao lưu thư mục</span>
          </div>
        </div>
        <div className="toggle-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <div className="toggle-info">
            <span className="toggle-label">Thư mục đồng bộ</span>
            <span className="toggle-desc">Chọn một thư mục trên máy tính để tự động sao lưu ảnh lên Memories khi ứng dụng chạy.</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={handleSelectFolder}
              style={{
                background: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500
              }}
            >
              Chọn thư mục
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {backupFolder ? backupFolder : 'Chưa chọn thư mục nào'}
            </span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-secondary)' }}><HardDrive size={15} /></span>
            <span className="settings-group-title">Tối ưu hiệu năng & Băng thông</span>
          </div>
        </div>
        <div className="toggle-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <div className="toggle-info">
            <span className="toggle-label">Số luồng tải lên đồng thời (Parallel Uploads)</span>
            <span className="toggle-desc">Tăng tốc độ tải lên nhiều file cùng lúc trên đường truyền mạng mạnh.</span>
          </div>
          <select
            defaultValue={localStorage.getItem('max_parallel_uploads') || '3'}
            onChange={(e) => localStorage.setItem('max_parallel_uploads', e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="1">1 file (An toàn / Mạng yếu)</option>
            <option value="3">3 file (Mặc định)</option>
            <option value="5">5 file (Nhanh)</option>
            <option value="10">10 file (Siêu tốc)</option>
          </select>
        </div>

        <div className="toggle-row" style={{ alignItems: 'center', marginTop: '1rem' }}>
          <div className="toggle-info">
            <span className="toggle-label">Tối ưu & Dọn dẹp CSDL địa phương (SQLite Vacuum)</span>
            <span className="toggle-desc">Giải phóng dung lượng thừa và làm mới chỉ mục tìm kiếm trên máy tính của bạn.</span>
          </div>
          <button
            onClick={async () => {
              try {
                const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
                if (!isTauri) {
                  alert("Tính năng chỉ hỗ trợ trên ứng dụng Desktop (Tauri).");
                  return;
                }
                const Database = (await import('@tauri-apps/plugin-sql')).default;
                const db = await Database.load('sqlite:photos.db');
                await db.execute('VACUUM;');
                alert("Dọn dẹp và tối ưu hóa cơ sở dữ liệu địa phương thành công!");
              } catch (e: any) {
                console.error("Database maintenance error:", e);
                alert(`Lỗi khi tối ưu cơ sở dữ liệu: ${e?.message || e}`);
              }
            }}
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Tối ưu ngay
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-secondary)' }}><HardDrive size={15} /></span>
            <span className="settings-group-title">Cập nhật ứng dụng</span>
          </div>
        </div>
        <div className="toggle-row" style={{ alignItems: 'center' }}>
          <div className="toggle-info">
            <span className="toggle-label">Kiểm tra cập nhật</span>
            <span className="toggle-desc">
              Xem có phiên bản mới của Memories không. 
              {appVersion && <span style={{ marginLeft: '4px', fontWeight: 600, color: 'var(--text-secondary)' }}>(Phiên bản hiện tại: {appVersion})</span>}
            </span>
          </div>
          <button 
            onClick={async () => {
              const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
              if (!isTauri) {
                alert("Update check feature is only available when running the Desktop (Tauri) app.");
                return;
              }
              try {
                const { check } = await import('@tauri-apps/plugin-updater');
                const update = await check();
                if (update) {
                  const confirmed = confirm(`A new update is available (v${update.version}). Would you like to download and install it now?`);
                  if (confirmed) {
                    await update.downloadAndInstall();
                    alert("Update successful! Please restart the application to apply changes.");
                  }
                } else {
                  alert("You are using the latest version!");
                }
              } catch (e: any) {
                console.error('Update check:', e);
                const errMsg = String(e?.message || e || '');
                if (
                  errMsg.includes('404') || 
                  errMsg.includes('Not Found') || 
                  errMsg.includes('Could not fetch') || 
                  errMsg.includes('release JSON')
                ) {
                  alert("You are using the latest version!");
                } else {
                  alert(`Error checking for updates: ${errMsg}`);
                }
              }
            }}
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500
            }}
          >
            Kiểm tra ngay
          </button>
        </div>
      </div>
    </div>
  );
}
