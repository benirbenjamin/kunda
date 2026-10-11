// =====================================================================
// POST /api/upload - Upload Content to Google Drive (Refresh Token)
// =====================================================================
import { extractAuthUser } from '../_lib/auth';
import { uploadToGoogleDrive } from '../_lib/drive';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  const { fileBase64, filename, mimeType, isRegistration } = req.body;

  if (!auth && !isRegistration) {
    return res.status(401).json({ success: false, error: 'Unauthorized: login or registration context required to upload' });
  }

  try {
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: 'fileBase64 payload is required' });
    }

    // Strip data:image/...;base64, header if present
    const base64Clean = fileBase64.replace(/^data:[a-zA-Z0-9\/]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const uploaderPrefix = auth?.userId ? `user_${auth.userId}` : 'reg_guest';
    const result = await uploadToGoogleDrive(
      buffer,
      filename || `${uploaderPrefix}_${Date.now()}.jpg`,
      mimeType || 'image/jpeg'
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        url: result.url,
        fileId: result.fileId,
        message: 'File successfully uploaded to Google Drive storage.',
      });
    }

    return res.status(500).json({
      success: false,
      error: result.error || 'Failed to upload file to Google Drive',
    });
  } catch (err: any) {
    console.error('Upload endpoint error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error during upload' });
  }
}
