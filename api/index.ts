// =====================================================================
// KUNDA SPACE: SINGLE CONSOLIDATED SERVERLESS FUNCTION (Vercel Hobby Plan)
// =====================================================================
import app from '../server';

export default function handler(req: any, res: any) {
  return app(req, res);
}
