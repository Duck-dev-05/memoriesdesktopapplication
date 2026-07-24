import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://memoriesphotos-five.vercel.app/api/v1';
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    console.error("Fetch network error:", err);
    throw new Error('Không thể kết nối đến máy chủ API (Lỗi mạng hoặc máy chủ không phản hồi)');
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error || errorJson.message || errorJson.detail || errorJson.msg || '';
    } catch (e) {
      // response body was not valid JSON
    }

    if (errorDetail) {
      throw new Error(errorDetail);
    }

    if (response.status === 401) {
      throw new Error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn (401)');
    }
    if (response.status === 403) {
      throw new Error('Bạn không có quyền thực hiện thao tác này (403)');
    }
    if (response.status === 413) {
      throw new Error('Dung lượng tệp tải lên vượt quá giới hạn (413)');
    }
    if (response.status === 500) {
      throw new Error('Lỗi máy chủ nội bộ (500 Internal Server Error)');
    }
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error('Máy chủ quá tải hoặc không phản hồi (Bad Gateway / Timeout)');
    }

    throw new Error(`Yêu cầu API thất bại (${response.status} ${response.statusText})`);
  }

  return response.json();
}

export interface Photo {
  id: string;
  url: string | null;
  cloudUrl: string | null;
  altText: string;
  description: string | null;
  createdAt: string;
  isFavorite: boolean;
  dateTaken: string | null;
  userId: string | null;
  albumId: string | null;
  fileSize: number | null;
  // EXIF & Meta fields
  cameraMake?: string | null;
  cameraModel?: string | null;
  lensModel?: string | null;
  focalLength?: number | null;
  fNumber?: number | null;
  iso?: number | null;
  exposureTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  width?: number | null;
  height?: number | null;
  tags?: { id: string; name: string }[];
  album?: { id: string; name: string } | null;
}

export interface Album {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  parentId?: string | null;
  createdAt: string;
  userId: string | null;
  shareToken?: string | null;
  isLocked?: boolean;
  lockPasscode?: string | null;
  _count?: {
    photos: number;
  };
}

export interface Tag {
  id: string;
  name: string;
}

export interface TagWithCount extends Tag {
  count: number;
}

export interface PhotoStats {
  totalPhotos: number;
  totalAlbums: number;
  totalFavorites: number;
  totalSizeBytes: number;
  monthlyUploads?: { month: string; count: number }[];
}

export const api = {
  // Photos
  getPhotos: async (albumId?: string, passcode?: string): Promise<Photo[]> => {
    try {
      let url = '/photos';
      if (albumId) {
        url += `?albumId=${albumId}`;
        if (passcode) {
          url += `&passcode=${encodeURIComponent(passcode)}`;
        }
      }
      const res = await fetchApi(url);
      return res.photos || [];
    } catch (e) {
      console.warn("Network failed, returning empty photos list", e);
      return [];
    }
  },

  searchPhotos: async (query: string): Promise<Photo[]> => {
    const res = await fetchApi(`/search?q=${encodeURIComponent(query)}`);
    return res.photos || [];
  },

  getPhotosWithLimit: async (limit: number): Promise<Photo[]> => {
    // Currently relying on frontend slice as v1 might not have limit param
    const res = await fetchApi('/photos');
    const photos = res.photos || [];
    return photos.slice(0, limit);
  },

  getMemories: async (): Promise<Photo[]> => {
    try {
      const res = await fetchApi('/memories');
      return res.memories || [];
    } catch {
      return [];
    }
  },

  getFavoritePhotos: async (): Promise<Photo[]> => {
    // Attempt to hit favorites endpoint, fallback to filtering if it doesn't exist
    try {
      const res = await fetchApi('/photos/favorites');
      return res.photos || [];
    } catch (e) {
      const res = await fetchApi('/photos');
      const photos: Photo[] = res.photos || [];
      return photos.filter(p => p.isFavorite);
    }
  },

  getPhotoStats: async (): Promise<PhotoStats> => {
    try {
      const res = await fetchApi('/stats');
      return res.stats || { totalPhotos: 0, totalAlbums: 0, totalFavorites: 0, totalSizeBytes: 0, monthlyUploads: [] };
    } catch (e) {
      console.error("Failed to fetch photo stats:", e);
      return { totalPhotos: 0, totalAlbums: 0, totalFavorites: 0, totalSizeBytes: 0, monthlyUploads: [] };
    }
  },

  addPhoto: async (file: File, albumId?: string): Promise<any> => {
    let finalFile = file;
    let userSettings: any = {};
    try {
      const savedSettings = localStorage.getItem('user_settings');
      if (savedSettings) userSettings = JSON.parse(savedSettings);
    } catch (e) {}

    // HEIC Conversion
    if (userSettings['HEIC Conversion'] && (finalFile.name.toLowerCase().endsWith('.heic') || finalFile.name.toLowerCase().endsWith('.heif'))) {
      try {
        const convertedBlob = await heic2any({ blob: finalFile, toType: "image/jpeg", quality: 0.8 }) as Blob;
        finalFile = new File([convertedBlob], finalFile.name.replace(/\.heic|\.heif/i, '.jpg'), { type: 'image/jpeg' });
      } catch (e) {
        console.error("HEIC Conversion failed", e);
      }
    }

    // Image Compression (if Original Quality is false OR if file > 4MB to prevent Vercel 4.5MB 413 payload limit)
    if (finalFile.type.startsWith('image/') && (userSettings['Original Quality'] === false || finalFile.size > 4 * 1024 * 1024)) {
      try {
        const options = { maxSizeMB: 3.8, maxWidthOrHeight: 2560, useWebWorker: true };
        finalFile = await imageCompression(finalFile, options);
      } catch (e) {
        console.error("Image compression failed", e);
      }
    }

    const formData = new FormData();
    formData.append('file', finalFile);
    
    // Privacy / Backend Flags
    if (userSettings['Face Recognition'] !== undefined) {
      formData.append('processFaces', String(userSettings['Face Recognition']));
    }
    if (userSettings['Location Metadata'] === false) {
      formData.append('stripLocation', 'true');
    }
    
    const res = await fetchApi('/photos/upload', {
      method: 'POST',
      body: formData,
      headers: {}
    });

    if (res && res.photo && albumId) {
      try {
        await fetchApi(`/photos/${res.photo.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ albumId })
        });
      } catch (err) {
        console.warn("Backend may not support PATCH /photos/:id", err);
      }
    }
    return res;
  },

  toggleFavorite: async (id: string, isFavorite: boolean): Promise<any> => {
    return fetchApi(`/photos/${id}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ isFavorite })
    });
  },

  updatePhotoAlbum: async (id: string, albumId: string | null): Promise<any> => {
    return fetchApi(`/photos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ albumId })
    });
  },

  updatePhotoDescription: async (id: string, description: string | null): Promise<any> => {
    return fetchApi(`/photos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ description })
    });
  },

  deletePhoto: async (id: string): Promise<any> => {
    return fetchApi(`/photos/${id}`, {
      method: 'DELETE'
    });
  },

  autoTagPhoto: async (id: string): Promise<any> => {
    return fetchApi(`/photos/${id}/auto-tag`, {
      method: 'POST'
    });
  },

  getTrashPhotos: async (): Promise<Photo[]> => {
    try {
      const res = await fetchApi('/trash');
      return res.photos || [];
    } catch {
      return [];
    }
  },

  restorePhotos: async (photoIds: string[]): Promise<any> => {
    return fetchApi('/trash/restore', {
      method: 'POST',
      body: JSON.stringify({ photoIds })
    });
  },

  emptyTrash: async (): Promise<any> => {
    return fetchApi('/trash/empty', {
      method: 'POST'
    });
  },


  // Albums
  getAlbums: async (): Promise<Album[]> => {
    try {
      const res = await fetchApi('/albums');
      return res.albums || [];
    } catch (e) {
      console.warn("Network failed, returning empty albums list", e);
      return [];
    }
  },

  createAlbum: async (name: string, parentId?: string | null, isLocked?: boolean, lockPasscode?: string | null): Promise<Album> => {
    const res = await fetchApi('/albums', {
      method: 'POST',
      body: JSON.stringify({ name, parentId, isLocked, lockPasscode })
    });
    return res.album;
  },

  updateAlbum: async (id: string, name: string, isLocked?: boolean, lockPasscode?: string | null): Promise<Album> => {
    const res = await fetchApi(`/albums/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, isLocked, lockPasscode })
    });
    return res.album;
  },

  deleteAlbum: async (id: string): Promise<void> => {
    await fetchApi(`/albums/${id}`, {
      method: 'DELETE'
    });
  },

  shareAlbum: async (id: string): Promise<Album> => {
    const res = await fetchApi(`/albums/${id}/share`, {
      method: 'POST'
    });
    return res.album;
  },

  unshareAlbum: async (id: string): Promise<Album> => {
    const res = await fetchApi(`/albums/${id}/share`, {
      method: 'DELETE'
    });
    return res.album;
  },

  getPublicSharedAlbum: async (token: string): Promise<any> => {
    // This endpoint can be accessed without auth
    const res = await fetchApi(`/shared/${token}`);
    return res.album;
  },

  // Role-based Sharing
  inviteToAlbum: async (albumId: string, email: string, role: string): Promise<any> => {
    return fetchApi(`/albums/${albumId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
  },

  getAlbumShares: async (albumId: string): Promise<any[]> => {
    const res = await fetchApi(`/albums/${albumId}/shares`);
    return res.shares || [];
  },

  updateAlbumShare: async (albumId: string, shareId: string, role: string): Promise<any> => {
    return fetchApi(`/albums/${albumId}/shares/${shareId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  removeAlbumShare: async (albumId: string, shareId: string): Promise<any> => {
    return fetchApi(`/albums/${albumId}/shares/${shareId}`, {
      method: 'DELETE'
    });
  },

  // Tags
  getSharedAlbums: async (): Promise<Album[]> => {
    try {
      const res = await fetchApi('/shared');
      return res.albums || [];
    } catch (err) {
      console.error("Failed to fetch shared albums:", err);
      return [];
    }
  },

  getTags: async (): Promise<Tag[]> => {
    try {
      const res = await fetchApi('/tags');
      return res.tags || [];
    } catch {
      return [];
    }
  },

  getTagsWithCount: async (): Promise<TagWithCount[]> => {
    try {
      const res = await fetchApi('/tags/counts');
      return res.tags || [];
    } catch {
      return [];
    }
  },

  addTag: async (name: string, photoId?: string): Promise<any> => {
    return fetchApi('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, photoId })
    });
  },

  // Auth
  login: (data: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data: any) => fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  loginWithGoogle: (idToken: string) => fetchApi('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  getMe: async (): Promise<any> => {
    return fetchApi('/auth/me');
  },
  deleteAccount: async (): Promise<any> => {
    return fetchApi('/auth/me', { method: 'DELETE' });
  },
};
