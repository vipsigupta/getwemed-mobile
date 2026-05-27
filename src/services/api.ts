import axios from 'axios';

// Production live Vercel deployment base URL
const API_BASE_URL = 'https://getmewed-backend.vercel.app/v1';

export const fetchSpaceByInviteCode = async (code: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/spaces/invite/${code}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchDashboardSpaces = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Uploads an avatar image to the backend, which stores it in Supabase Storage.
 * Returns the permanent public URL.
 */
export const uploadAvatar = async (token: string, localUri: string): Promise<string> => {
  const filename = localUri.split('/').pop() || 'avatar.jpg';
  const ext = filename.split('.').pop() || 'jpg';
  const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as any);

  const response = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.avatarUrl;
};

/**
 * Uploads any image (cover photo, star photo, etc.) to the backend Supabase storage.
 * Returns the permanent public CDN URL.
 */
export const uploadImage = async (token: string, localUri: string): Promise<string> => {
  const filename = localUri.split('/').pop() || 'image.jpg';
  const ext = filename.split('.').pop() || 'jpg';
  const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as any);

  const response = await axios.post(`${API_BASE_URL}/auth/upload-image`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.imageUrl;
};

export const updateProfile = async (token: string, name: string, avatarUrl?: string) => {
  try {
    const body: Record<string, string> = { name };
    if (avatarUrl) body.avatarUrl = avatarUrl;
    const response = await axios.patch(`${API_BASE_URL}/auth/profile`, body, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a brand new event celebration space on the backend.
 */
export const createSpace = async (token: string, spaceData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/spaces`, spaceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Maps default image identifier keys (offline-ready) to local required assets,
 * and web-based image URLs to React Native source objects.
 */
export const getEventImageSource = (urlOrKey: any) => {
  if (!urlOrKey) {
    return require('../../assets/images/default_other.jpg');
  }

  // If already a local asset identifier (numeric)
  if (typeof urlOrKey === 'number') {
    return urlOrKey;
  }

  const key = String(urlOrKey).trim().toLowerCase();

  if (key === 'default_wedding' || key.includes('default_wedding')) {
    return require('../../assets/images/default_wedding.jpg');
  }
  if (key === 'default_birthday' || key.includes('default_birthday')) {
    return require('../../assets/images/default_birthday.jpg');
  }
  if (key === 'default_anniversary' || key.includes('default_anniversary')) {
    return require('../../assets/images/default_anniversary.jpg');
  }
  if (key === 'default_kitty' || key.includes('default_kitty')) {
    return require('../../assets/images/default_kitty.jpg');
  }
  if (key === 'default_other' || key.includes('default_other')) {
    return require('../../assets/images/default_other.jpg');
  }

  // Fallbacks for direct URLs
  return { uri: urlOrKey };
};
