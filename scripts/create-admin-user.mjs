import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';

const envFiles = ['.env.local', '.env'];

for (const file of envFiles) {
  if (!existsSync(file)) {
    continue;
  }

  const lines = readFileSync(file, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match || process.env[match[1]]) {
      continue;
    }

    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? '4dxjatt@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? '123456';
const adminFullName = process.env.ADMIN_FULL_NAME ?? 'Admin';

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL.');
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local before running this script.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const findExistingUser = async () => {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      throw error;
    }

    const existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
    );

    if (existingUser || data.users.length < perPage) {
      return existingUser;
    }

    page += 1;
  }
};

const existingUser = await findExistingUser();

if (existingUser) {
  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    app_metadata: {
      ...existingUser.app_metadata,
      role: 'admin',
      roles: ['admin']
    },
    email: adminEmail,
    email_confirm: true,
    password: adminPassword,
    user_metadata: {
      ...existingUser.user_metadata,
      full_name: adminFullName,
      role: 'admin'
    }
  });

  if (error) {
    throw error;
  }

  console.log(`Updated admin user: ${adminEmail}`);
  process.exit(0);
}

const { error } = await supabase.auth.admin.createUser({
  app_metadata: {
    role: 'admin',
    roles: ['admin']
  },
  email: adminEmail,
  email_confirm: true,
  password: adminPassword,
  user_metadata: {
    full_name: adminFullName,
    role: 'admin'
  }
});

if (error) {
  throw error;
}

console.log(`Created admin user: ${adminEmail}`);
