// =====================================================================
// KUNDA SPACE: GOOGLE DRIVE REFRESH TOKEN OBJECT STORAGE SERVICE
// =====================================================================
import { memoryStore } from './db.js';

export interface DriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string;
}

export function getDriveConfig(): DriveConfig {
  const settings = memoryStore.adminSettings;
  return {
    clientId: (settings.get('google_drive_client_id') as string) || process.env.GOOGLE_DRIVE_CLIENT_ID || '',
    clientSecret: (settings.get('google_drive_client_secret') as string) || process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    refreshToken: (settings.get('google_drive_refresh_token') as string) || process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    folderId: (settings.get('google_drive_folder_id') as string) || process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  };
}

/**
 * Exchanges refresh_token for a fresh Google OAuth2 access_token
 */
export async function getFreshAccessToken(config: DriveConfig): Promise<string | null> {
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const data = await res.json();
    if (res.ok && data.access_token) {
      return data.access_token;
    }
    console.error('Google OAuth token refresh error:', data);
    return null;
  } catch (err) {
    console.error('Failed to exchange Google Drive refresh token:', err);
    return null;
  }
}

/**
 * Uploads media file to Google Drive using the refresh token method
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; url: string; fileId?: string; error?: string }> {
  const config = getDriveConfig();
  const accessToken = await getFreshAccessToken(config);

  // If Google Drive credentials are configured, execute real upload
  if (accessToken) {
    try {
      const metadata: any = {
        name: `kunda_${Date.now()}_${filename}`,
        mimeType,
      };
      if (config.folderId) {
        metadata.parents = [config.folderId];
      }

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
      const mediaPart = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(fileBuffer).toString('base64')}${closeDelimiter}`;

      const multipartBody = metadataPart + mediaPart;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,webViewLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      const fileData = await uploadRes.json();
      if (!uploadRes.ok || !fileData.id) {
        return { success: false, url: '', error: fileData.error?.message || 'Drive upload failed' };
      }

      // Make file publicly viewable so it renders in web browsers
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' }),
        });
      } catch (permErr) {
        console.warn('Google Drive permission set warning:', permErr);
      }

      // Direct CDN embed link
      const directUrl = `https://lh3.googleusercontent.com/d/${fileData.id}`;
      return { success: true, url: directUrl, fileId: fileData.id };
    } catch (err: any) {
      console.error('Google Drive upload execution error:', err);
      return { success: false, url: '', error: err.message };
    }
  }

  // Fallback if Drive credentials not yet entered in settings:
  const base64Data = Buffer.from(fileBuffer).toString('base64');
  const dataUri = `data:${mimeType};base64,${base64Data}`;
  return {
    success: true,
    url: dataUri,
    fileId: `mock-drive-${Date.now()}`,
  };
}

/**
 * Uploads a database .sql backup file to Google Drive using the refresh token method.
 * Keeps all previous backups intact without deletion, generating a permanent historical copy.
 */
export async function uploadBackupToGoogleDrive(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  mimeType: string = 'application/sql'
): Promise<{ success: boolean; url: string; fileId?: string; webViewLink?: string; error?: string }> {
  const config = getDriveConfig();
  const accessToken = await getFreshAccessToken(config);

  if (accessToken) {
    try {
      const metadata: any = {
        name: filename,
        mimeType,
        description: `Kunda Space MySQL Automated Database Backup generated on ${new Date().toISOString()}`,
      };
      if (config.folderId) {
        metadata.parents = [config.folderId];
      }

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
      const mediaPart = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(fileBuffer).toString('base64')}${closeDelimiter}`;

      const multipartBody = metadataPart + mediaPart;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,webViewLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      const fileData = await uploadRes.json();
      if (!uploadRes.ok || !fileData.id) {
        return { success: false, url: '', error: fileData.error?.message || 'Google Drive backup upload failed' };
      }

      return {
        success: true,
        url: fileData.webViewLink || fileData.webContentLink || `https://drive.google.com/file/d/${fileData.id}/view`,
        webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
        fileId: fileData.id,
      };
    } catch (err: any) {
      console.error('Google Drive backup upload error:', err);
      return { success: false, url: '', error: err.message };
    }
  }

  // Fallback if credentials not yet configured
  return {
    success: false,
    url: '',
    error: 'Google Drive credentials not configured. Please set GOOGLE_DRIVE_CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN in Admin Settings or .env',
  };
}
