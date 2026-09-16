import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
const rootDir = process.cwd();

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf8');
  const values = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return values;
}

const env = {
  ...readEnvFile(envPath),
  ...process.env,
};

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase config. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const users = [
  {
    email: 'admin@eventsphere.local',
    password: 'Password123!',
    full_name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'organizer@eventsphere.local',
    password: 'Password123!',
    full_name: 'Organizer User',
    role: 'organizer',
  },
  {
    email: 'attendee@eventsphere.local',
    password: 'Password123!',
    full_name: 'Attendee User',
    role: 'attendee',
  },
  {
    email: 'sponsor@eventsphere.local',
    password: 'Password123!',
    full_name: 'Sponsor User',
    role: 'sponsor',
  },
];

(async () => {
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('Unable to list Supabase Auth users:', listError.message);
    process.exitCode = 1;
    return;
  }

  for (const user of users) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role },
    });

    const existingUserError = authError && /already exists|already been registered/i.test(authError.message);
    if (authError && !existingUserError) {
      console.error(`Failed to create ${user.email}:`, authError.message);
      continue;
    }

    const existingUser = authUser?.user ?? userList.users.find(
      (candidate) => candidate.email?.toLowerCase() === user.email.toLowerCase()
    );
    const id = existingUser?.id ?? null;

    if (id) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: '',
        role: user.role,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (profileError) {
        console.error(`Profile upsert failed for ${user.email}:`, profileError.message);
      } else {
        console.log(`✓ ${user.role} user ready: ${user.email} / Password123!`);
      }
    } else {
      console.error(`Unable to find Auth user for ${user.email}`);
    }
  }

  console.log('\nDemo accounts ready. Use these credentials in the app login screen.');
})();
