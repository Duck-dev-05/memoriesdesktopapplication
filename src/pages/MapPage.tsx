import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { api, Photo } from '../api';
import { Map as MapIcon, ChevronRight } from 'lucide-react';

const createCustomIcon = (photoUrl: string) => {
  return L.divIcon({
    className: 'custom-photo-marker',
    html: `
      <div style="
        width: 52px; height: 52px; border-radius: 12px; border: 3px solid white;
        box-shadow: 0 8px 16px rgba(0,0,0,0.15); overflow: hidden;
        background-color: #333;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform-origin: bottom center;
      ">
        <img src="${photoUrl}" style="width:100%; height:100%; object-fit:cover;" />
      </div>
    `,
    iconSize: [58, 58],
    iconAnchor: [29, 58],
    popupAnchor: [0, -58]
  });
};

const createClusterCustomIcon = function (cluster: any) {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #7c6fff, #c084fc);
        color: white;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.1rem;
        box-shadow: 0 4px 12px rgba(124, 111, 255, 0.4);
        border: 3px solid white;
      ">
        ${cluster.getChildCount()}
      </div>
    `,
    className: 'custom-marker-cluster',
    iconSize: L.point(44, 44, true),
  });
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function MapPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch photos and filter those with GPS coordinates
    api.getPhotos()
      .then(allPhotos => {
        const mappedPhotos = allPhotos.filter(p => p.latitude != null && p.longitude != null);
        setPhotos(mappedPhotos);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, position: 'relative' }}>
      
      {/* Floating Header */}
      <div style={{ 
        position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 1000, 
        pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', 
          padding: '1rem 1.5rem', borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.4)',
          pointerEvents: 'auto'
        }}>
          <h1 className="page-title" style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>Địa điểm</h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '0.9rem' }}>
            {isLoading ? 'Đang tải bản đồ...' : `Bạn có ${photos.length} ảnh có dữ liệu vị trí.`}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Đang tải...</span>
          </div>
        ) : photos.length === 0 ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', margin: '0 2rem 2rem', background: 'var(--surface-sunken)' }}>
            <MapIcon size={48} color="var(--accent-primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Không tìm thấy địa điểm nào</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
              Không có ảnh nào bạn tải lên chứa dữ liệu GPS. Hãy thử chụp ảnh với dịch vụ định vị được bật trên máy ảnh hoặc điện thoại của bạn!
            </p>
          </div>
        ) : (
          <div style={{ 
            width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-base)'
          }}>
            <MapContainer 
              center={[photos[0].latitude || 0, photos[0].longitude || 0]} 
              zoom={3} 
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <MapResizer />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={60}
              showCoverageOnHover={false}
              spiderfyOnMaxZoom={true}
              iconCreateFunction={createClusterCustomIcon}
            >
              {photos.map((p) => {
                const lat = p.latitude!;
                const lng = p.longitude!;
                const icon = createCustomIcon(p.url || p.cloudUrl || '');
                return (
                  <Marker 
                    key={p.id} 
                    position={[lat, lng]} 
                    icon={icon}
                  >
                    <Popup className="photo-map-popup">
                      <div 
                        style={{ cursor: 'pointer', textAlign: 'center' }} 
                        onClick={() => navigate(`/photo/${p.id}`)}
                      >
                        <img 
                          src={p.url || p.cloudUrl || undefined} 
                          alt="Thumbnail" 
                          style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} 
                        />
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          Xem ảnh <ChevronRight size={14} />
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
