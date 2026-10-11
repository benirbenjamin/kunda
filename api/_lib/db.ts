// =====================================================================
// KUNDA SPACE: HYBRID MYSQL & IN-MEMORY STORAGE ENGINE
// =====================================================================
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Determine if MySQL database connection parameters are provided
const dbUrl = process.env.DATABASE_URL || '';
const hasMysqlConfig = Boolean(
  dbUrl ||
  process.env.MYSQL_DATABASE ||
  process.env.DB_NAME ||
  process.env.MYSQL_HOST ||
  process.env.DB_HOST
);

let pool: mysql.Pool | null = null;

if (hasMysqlConfig) {
  try {
    if (dbUrl) {
      // Connect using DATABASE_URL string (e.g. mysql://user:pass@host:3306/database)
      pool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        multipleStatements: true,
      });
    } else {
      // Connect using individual cPanel environment variables
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
        user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
        password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'kunda_space',
        ssl: process.env.MYSQL_SSL === 'true' || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        multipleStatements: true,
      });
    }
    console.log('📦 MySQL connection pool initialized successfully.');
  } catch (poolErr) {
    console.warn('⚠️ Could not initialize MySQL pool, falling back to memory store:', poolErr);
    pool = null;
  }
}

// In-Memory Database store for instant execution when MySQL is not yet connected
export const memoryStore = {
  users: [] as any[],
  profiles: [] as any[],
  photos: [] as any[],
  preferences: [] as any[],
  likes: [] as any[],
  passes: [] as any[],
  matches: [] as any[],
  conversations: [] as any[],
  messages: [] as any[],
  allowances: new Map<string, { initialRemaining: number; distinctRecipients: string[]; repliesRemaining: number }>(),
  wallets: new Map<string, { balanceMinor: number; currency: string }>(),
  transactions: [] as any[],
  subscriptions: [] as any[],
  contactUnlocks: [] as any[],
  notifications: [] as any[],
  moderationEvents: [] as any[],
  reports: [] as any[],
  adminSettings: new Map<string, any>(),
  tutorials: [] as any[],
};

// Seed initial memory store with admin and realistic member profiles
function initMemoryStore() {
  const adminId = 'a0000000-0000-0000-0000-000000000001';
  memoryStore.users.push({
    id: adminId,
    email: 'admin@kunda.space',
    passwordHash: '$2a$10$wE73kYpQ9a83B3qKz0R0QegE8s9N8xV9PkWgK2U3a1OQh1sBf8v4G', // Admin@Kunda2026!
    role: 'super_admin',
    dob: '1990-05-15',
    phone: '788123456',
    phoneCode: '+250',
    preferredLanguage: 'rw',
    emailVerified: true,
    isSuspended: false,
    createdAt: new Date().toISOString(),
  });
  memoryStore.wallets.set(adminId, { balanceMinor: 50000, currency: 'RWF' });
  memoryStore.allowances.set(adminId, { initialRemaining: 3, distinctRecipients: [], repliesRemaining: 3 });

  // Initial business settings
  memoryStore.adminSettings.set('free_initial_messages', 3);
  memoryStore.adminSettings.set('free_distinct_recipients', 3);
  memoryStore.adminSettings.set('free_replies', 3);
  memoryStore.adminSettings.set('pay_per_message_cost', 150);
  memoryStore.adminSettings.set('contact_unlock_cost', 2000);
  memoryStore.adminSettings.set('default_currency', 'RWF');

  // Email & Google Drive Settings
  memoryStore.adminSettings.set('email_provider', 'mock'); // 'resend' | 'smtp' | 'mock'
  memoryStore.adminSettings.set('resend_api_key', '');
  memoryStore.adminSettings.set('resend_from_email', 'Kunda Space <onboarding@resend.dev>');
  memoryStore.adminSettings.set('smtp_host', 'smtp.gmail.com');
  memoryStore.adminSettings.set('smtp_port', 587);
  memoryStore.adminSettings.set('smtp_secure', false);
  memoryStore.adminSettings.set('smtp_user', '');
  memoryStore.adminSettings.set('smtp_pass', '');
  memoryStore.adminSettings.set('smtp_from_email', 'Kunda Space <noreply@kunda.space>');
  memoryStore.adminSettings.set('google_drive_client_id', '');
  memoryStore.adminSettings.set('google_drive_client_secret', '');
  memoryStore.adminSettings.set('google_drive_refresh_token', '');
  memoryStore.adminSettings.set('google_drive_folder_id', '');

  // Pre-seed Tutorials shown to users during registration and onboarding
  memoryStore.tutorials.push(
    {
      id: 'tut-1',
      title_en: 'How Kunda Space Works: A Quick Beginner Guide',
      title_rw: "Uko Kunda Space Ikora: Inyoborabumenyi y'Ibanze",
      title_fr: 'Comment Fonctionne Kunda Space: Guide Débutant',
      content_en: 'Welcome to Kunda Space! Learn how to create an attractive, authentic profile, how our compatibility algorithm finds genuine matches in Rwanda, and how your privacy is protected at every step.',
      content_rw: "Murakaza neza kuri Kunda Space! Muri iyi nyoborabumenyi uramenya uko wuzuza umwirondoro witeguye neza, uko ikoranabuhanga riguha abahuje nawe mu Rwanda, n'uko amakuru yawe arindwa.",
      content_fr: 'Bienvenue sur Kunda Space ! Découvrez comment compléter votre profil, comment notre algorithme de compatibilité vous connecte aux profils sincères au Rwanda, et comment vos données privées sont sécurisées.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      stepTag: 'step1',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tut-2',
      title_en: 'Safe Messaging & Direct Contact Unlocks',
      title_rw: 'Uko Wandikirana mu Mutekano no Gufungura Nimero',
      title_fr: 'Messagerie Sécurisée et Déblocage de Contact',
      content_en: 'To protect you from scams, phone numbers are locked in chat. You start with 3 free messages and 3 replies. When mutual rapport is built, both parties can consent to unlock direct contacts!',
      content_rw: "Mu rwego rwo kurinda umutekano wanyu, nimero za telefone ziba zifunze muri chat. Utangirana n'ubutumwa 3 bw'ubuntu n'ibisubizo 3. Iyo mwembi mwemeranyijwe, mushobora gufungura nimero ya telefone.",
      content_fr: 'Pour vous protéger des escroqueries, les numéros sont verrouillés dans le chat. Vous disposez de 3 messages gratuits et 3 réponses. Une fois la confiance établie, vous pouvez débloquer le numéro avec accord mutuel !',
      videoUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      stepTag: 'step2',
      displayOrder: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tut-3',
      title_en: 'Photo Best Practices for Real Singles',
      title_rw: 'Inama ku Mafoto Meza Akurura Urukundo Nyakuri',
      title_fr: 'Conseils pour de Bonnes Photos de Profil',
      content_en: 'Profiles with clear, smiling photos showing your face receive 4x more mutual likes. Avoid sunglasses or heavily filtered photos for maximum trust.',
      content_rw: 'Umwirondoro uriho amafoto asobanutse amwenyura uboneka inshuro 4 kurenza andi. Irinde amadarubindi yirabura cyangwa filtri zikabije kugira ngo wizerewe kurushaho.',
      content_fr: 'Les profils avec des photos nettes et souriantes reçoivent 4 fois plus de matchs mutuels. Évitez les lunettes de soleil ou les filtres excessifs pour inspirer confiance.',
      videoUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      stepTag: 'step3',
      displayOrder: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  );

  // Seed 4 verified adult member profiles for instant discovery
  const seedMembers = [
    {
      id: 'm1000000-0000-0000-0000-000000000001',
      email: 'keza.aline@kunda.example',
      passwordHash: '$2a$10$wE73kYpQ9a83B3qKz0R0QegE8s9N8xV9PkWgK2U3a1OQh1sBf8v4G',
      role: 'user',
      dob: '1998-04-12', // 28 years old
      phone: '788998877',
      phoneCode: '+250',
      preferredLanguage: 'rw',
      emailVerified: true,
      profile: {
        id: 'p1000000-0000-0000-0000-000000000001',
        displayName: 'Keza Aline',
        gender: 'woman',
        interestedIn: 'men',
        country: 'Rwanda',
        city: 'Kigali',
        bio: 'Software engineer passionate about coffee, traditional dance, and exploring the 1000 hills. Looking for a kind, ambitious partner for a serious relationship.',
        height: 168,
        languages: ['Kinyarwanda', 'English', 'French'],
        education: 'BSc Computer Science',
        occupation: 'Product Engineer',
        relationshipIntention: 'serious_relationship',
        childrenStatus: 'wants_children',
        contactSharingConsent: true,
        verifiedBadge: true,
        photos: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
        ],
        interests: ['Tech & Entrepreneurship', 'Coffee & Tea Tasting', 'Traditional Dance & Music', 'Hiking in 1000 Hills'],
      }
    },
    {
      id: 'm2000000-0000-0000-0000-000000000002',
      email: 'mugisha.eric@kunda.example',
      passwordHash: '$2a$10$wE73kYpQ9a83B3qKz0R0QegE8s9N8xV9PkWgK2U3a1OQh1sBf8v4G',
      role: 'user',
      dob: '1994-08-20', // 32 years old
      phone: '783112233',
      phoneCode: '+250',
      preferredLanguage: 'en',
      emailVerified: true,
      profile: {
        id: 'p2000000-0000-0000-0000-000000000002',
        displayName: 'Mugisha Eric',
        gender: 'man',
        interestedIn: 'women',
        country: 'Rwanda',
        city: 'Kigali',
        bio: 'Architect, weekend trail runner and book lover. Believer in open communication and genuine emotional intimacy. Ready to settle down.',
        height: 182,
        languages: ['English', 'Kinyarwanda', 'French'],
        education: 'Master of Architecture',
        occupation: 'Architect & Designer',
        relationshipIntention: 'marriage',
        childrenStatus: 'wants_children',
        contactSharingConsent: true,
        verifiedBadge: true,
        photos: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
        ],
        interests: ['Hiking in 1000 Hills', 'Book Club & Reading', 'Dining Out & Foodie', 'Fitness & Gym'],
      }
    },
    {
      id: 'm3000000-0000-0000-0000-000000000003',
      email: 'uwase.diane@kunda.example',
      passwordHash: '$2a$10$wE73kYpQ9a83B3qKz0R0QegE8s9N8xV9PkWgK2U3a1OQh1sBf8v4G',
      role: 'user',
      dob: '1999-11-03', // 27 years old
      phone: '785445566',
      phoneCode: '+250',
      preferredLanguage: 'rw',
      emailVerified: true,
      profile: {
        id: 'p3000000-0000-0000-0000-000000000003',
        displayName: 'Uwase Diane',
        gender: 'woman',
        interestedIn: 'men',
        country: 'Rwanda',
        city: 'Rubavu',
        bio: 'Lover of Lake Kivu sunsets, acoustic music, and meaningful conversations. Looking for someone genuine and funny.',
        height: 165,
        languages: ['Kinyarwanda', 'French', 'English'],
        education: 'Bachelor of Tourism & Hospitality',
        occupation: 'Eco-lodge Manager',
        relationshipIntention: 'serious_relationship',
        childrenStatus: 'open_to_children',
        contactSharingConsent: true,
        verifiedBadge: true,
        photos: [
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
        ],
        interests: ['Travel & Road Trips', 'Coffee & Tea Tasting', 'Art & Photography'],
      }
    },
    {
      id: 'm4000000-0000-0000-0000-000000000004',
      email: 'jean.claude@kunda.example',
      passwordHash: '$2a$10$wE73kYpQ9a83B3qKz0R0QegE8s9N8xV9PkWgK2U3a1OQh1sBf8v4G',
      role: 'user',
      dob: '1995-02-14', // 31 years old
      phone: '789778899',
      phoneCode: '+250',
      preferredLanguage: 'fr',
      emailVerified: true,
      profile: {
        id: 'p4000000-0000-0000-0000-000000000004',
        displayName: 'Jean-Claude N.',
        gender: 'man',
        interestedIn: 'women',
        country: 'Rwanda',
        city: 'Musanze',
        bio: 'Agricultural researcher based in the volcanic region. Passionate about nature conservation and good cuisine.',
        height: 178,
        languages: ['French', 'Kinyarwanda', 'English'],
        education: 'MSc Agronomy',
        occupation: 'Research Scientist',
        relationshipIntention: 'serious_relationship',
        childrenStatus: 'wants_children',
        contactSharingConsent: true,
        verifiedBadge: true,
        photos: [
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
        ],
        interests: ['Hiking in 1000 Hills', 'Dining Out & Foodie', 'Tech & Entrepreneurship'],
      }
    }
  ];

  for (const m of seedMembers) {
    memoryStore.users.push({
      id: m.id,
      email: m.email,
      passwordHash: m.passwordHash,
      role: m.role,
      dob: m.dob,
      phone: m.phone,
      phoneCode: m.phoneCode,
      preferredLanguage: m.preferredLanguage,
      emailVerified: m.emailVerified,
      isSuspended: false,
      createdAt: new Date().toISOString(),
    });
    memoryStore.profiles.push({
      id: m.profile.id,
      userId: m.id,
      displayName: m.profile.displayName,
      gender: m.profile.gender,
      interestedIn: m.profile.interestedIn,
      country: m.profile.country,
      city: m.profile.city,
      bio: m.profile.bio,
      height: m.profile.height,
      languages: m.profile.languages,
      education: m.profile.education,
      occupation: m.profile.occupation,
      relationshipIntention: m.profile.relationshipIntention,
      childrenStatus: m.profile.childrenStatus,
      contactSharingConsent: m.profile.contactSharingConsent,
      profileCompleted: true,
      verifiedBadge: m.profile.verifiedBadge,
      photos: m.profile.photos,
      interests: m.profile.interests,
      createdAt: new Date().toISOString(),
    });
    memoryStore.wallets.set(m.id, { balanceMinor: 5000, currency: 'RWF' });
    memoryStore.allowances.set(m.id, { initialRemaining: 3, distinctRecipients: [], repliesRemaining: 3 });
  }
}

initMemoryStore();

/**
 * Universal Query Adapter: Executes SQL on MySQL connection pool
 * Automatically translates PostgreSQL parameter placeholders ($1, $2, ...) to MySQL (?)
 * and translates Postgres syntax (like ON CONFLICT) to MySQL compatible equivalents.
 */
export async function query(sql: string, params: any[] = []): Promise<any> {
  if (pool) {
    try {
      // 1. Translate PostgreSQL parameter markers ($1, $2, $3...) to MySQL (?)
      let mysqlSql = sql.replace(/\$(\d+)/g, '?');

      // 2. Translate PostgreSQL "ON CONFLICT ... DO NOTHING" to MySQL "ON DUPLICATE KEY UPDATE id=id"
      mysqlSql = mysqlSql.replace(/ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*NOTHING/gi, 'ON DUPLICATE KEY UPDATE id=id');
      mysqlSql = mysqlSql.replace(/ON\s+CONFLICT\s*DO\s*NOTHING/gi, 'ON DUPLICATE KEY UPDATE id=id');

      // 3. Remove PostgreSQL "RETURNING ..." clause if present
      mysqlSql = mysqlSql.replace(/\s+RETURNING\s+[\w,\s.*]+/gi, '');

      // 4. Execute query on MySQL pool
      const [results] = await pool.query(mysqlSql, params);

      // 5. Provide standard PostgreSQL-like response object for code backward compatibility
      if (Array.isArray(results)) {
        return {
          rows: results,
          rowCount: results.length,
        };
      }

      const header = results as mysql.ResultSetHeader;
      return {
        rows: [],
        rowCount: header.affectedRows ?? 0,
        insertId: header.insertId ?? null,
      };
    } catch (err) {
      console.error('MySQL query error, falling back to memory store:', err);
    }
  }
  return null;
}

/**
 * Returns active MySQL connection pool
 */
export function getDbPool(): mysql.Pool | null {
  return pool;
}
