const STORAGE_KEYS = {
  session: 'brewtrack.session',
  users: 'brewtrack.users',
  pendingUsers: 'brewtrack.pendingUsers',
  brews: 'brewtrack.brews',
  comments: 'brewtrack.comments',
  resetTokens: 'brewtrack.resetTokens',
};

const OTP_CODE = '123456';
const MEDIA_DB_NAME = 'brewtrack.media';
const MEDIA_STORE_NAME = 'uploads';
const MEDIA_REF_PREFIX = 'media://';
const MEDIA_MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const MEDIA_ASSET_FIELDS = [
  { urlKey: 'image_url', refKey: 'image_ref' },
  { urlKey: 'tutorial_video_url', refKey: 'tutorial_video_ref' },
];
const mediaUrlCache = new Map();

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function getUsers() {
  return readJson(STORAGE_KEYS.users, []);
}

function setUsers(users) {
  writeJson(STORAGE_KEYS.users, users);
}

function getPendingUsers() {
  return readJson(STORAGE_KEYS.pendingUsers, []);
}

function setPendingUsers(users) {
  writeJson(STORAGE_KEYS.pendingUsers, users);
}

function getSession() {
  return readJson(STORAGE_KEYS.session, null);
}

function setSession(session) {
  if (session) {
    writeJson(STORAGE_KEYS.session, session);
  } else if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  }
}

function getCurrentUser() {
  const session = getSession();
  if (!session?.email) return null;
  return getUsers().find((user) => user.email === session.email) ?? null;
}

function getUserByEmail(email) {
  return getUsers().find((user) => user.email === email) ?? null;
}

function requireUser() {
  const user = getCurrentUser();
  if (!user) {
    const error = new Error('Authentication required');
    error.type = 'auth_required';
    throw error;
  }
  return user;
}

function sortItems(items, sort) {
  if (!sort) return [...items];
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    if (aValue === bValue) return 0;
    return aValue > bValue ? direction : -direction;
  });
}

function listEntity(key) {
  return readJson(key, []);
}

function writeEntity(key, value) {
  writeJson(key, value);
}

function matchesFilter(item, filters = {}) {
  return Object.entries(filters).every(([key, value]) => item[key] === value);
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function isMediaReference(value) {
  return typeof value === 'string' && value.startsWith(MEDIA_REF_PREFIX);
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to load image'));
    };
    image.src = objectUrl;
  });
}

async function normalizeUploadFile(file) {
  if (file.type.startsWith('image/')) {
    const image = await loadImageFile(file);
    const maxWidth = 1600;
    const maxHeight = 1600;
    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.82);
    });
    if (!blob) {
      return file;
    }
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  }

  if (file.type.startsWith('video/') && file.size > MEDIA_MAX_VIDEO_BYTES) {
    const error = new Error('Video too large');
    error.code = 'video_too_large';
    throw error;
  }

  return file;
}

function openMediaDatabase() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(MEDIA_STORE_NAME)) {
        database.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open media database'));
  });
}

async function storeUploadedFile(file) {
  const normalizedFile = await normalizeUploadFile(file);
  const database = await openMediaDatabase();

  if (!database) {
    const dataUrl = await fileToDataUrl(normalizedFile);
    return { file_ref: dataUrl, file_url: dataUrl };
  }

  const id = `${MEDIA_REF_PREFIX}${makeId('upload')}`;
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(MEDIA_STORE_NAME, 'readwrite');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Unable to store file'));
    transaction.objectStore(MEDIA_STORE_NAME).put({
      id,
      file: normalizedFile,
      name: normalizedFile.name,
      type: normalizedFile.type,
      created_date: nowIso(),
    });
  });

  const fileUrl = URL.createObjectURL(normalizedFile);
  mediaUrlCache.set(id, fileUrl);
  return { file_ref: id, file_url: fileUrl };
}

async function resolveMediaReference(value) {
  if (!value) return value;
  if (!isMediaReference(value)) return value;
  if (mediaUrlCache.has(value)) {
    return mediaUrlCache.get(value);
  }

  const database = await openMediaDatabase();
  if (!database) return '';

  const record = await new Promise((resolve, reject) => {
    const transaction = database.transaction(MEDIA_STORE_NAME, 'readonly');
    const request = transaction.objectStore(MEDIA_STORE_NAME).get(value);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error || new Error('Unable to read stored file'));
  });

  if (!record?.file) return '';

  const objectUrl = URL.createObjectURL(record.file);
  mediaUrlCache.set(value, objectUrl);
  return objectUrl;
}

function prepareAssetPayload(payload) {
  const nextPayload = { ...payload };

  MEDIA_ASSET_FIELDS.forEach(({ urlKey, refKey }) => {
    if (isMediaReference(nextPayload[urlKey]) && !nextPayload[refKey]) {
      nextPayload[refKey] = nextPayload[urlKey];
    }

    if (nextPayload[refKey] && nextPayload[urlKey] && nextPayload[urlKey].startsWith('blob:')) {
      delete nextPayload[urlKey];
    }
  });

  return nextPayload;
}

async function hydrateRecord(record) {
  if (!record) return null;

  const hydrated = { ...record };
  const owner = hydrated.owner_email ? getUserByEmail(hydrated.owner_email) : null;
  if (owner?.full_name && !hydrated.owner_name) {
    hydrated.owner_name = owner.full_name;
  }

  for (const { urlKey, refKey } of MEDIA_ASSET_FIELDS) {
    const rawValue = hydrated[refKey] || hydrated[urlKey];
    if (isMediaReference(hydrated[urlKey]) && !hydrated[refKey]) {
      hydrated[refKey] = hydrated[urlKey];
    }
    if (rawValue) {
      hydrated[urlKey] = await resolveMediaReference(rawValue);
    }
  }

  return hydrated;
}

async function hydrateCollection(records) {
  return Promise.all(records.map((record) => hydrateRecord(record)));
}

function defaultNameFromEmail(email) {
  const name = (email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  return name ? name.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Brewer';
}

function createScopedEntityApi({ key, prefix }) {
  return {
    async list(sort = '-created_date', limit) {
      const user = requireUser();
      const items = listEntity(key).filter((item) => item.owner_email === user.email);
      const sorted = sortItems(items, sort);
      const limited = typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
      return hydrateCollection(limited);
    },
    async listAll(sort = '-created_date', limit) {
      const items = sortItems(listEntity(key), sort);
      const limited = typeof limit === 'number' ? items.slice(0, limit) : items;
      return hydrateCollection(limited);
    },
    async filter(filters = {}, sort = '-created_date') {
      const items = await this.list(sort);
      return items.filter((item) => matchesFilter(item, filters));
    },
    async filterAll(filters = {}, sort = '-created_date') {
      const items = await this.listAll(sort);
      return items.filter((item) => matchesFilter(item, filters));
    },
    async get(id) {
      const items = await this.filter({ id });
      return items[0] ?? null;
    },
    async getAny(id) {
      const items = await this.filterAll({ id });
      return items[0] ?? null;
    },
    async create(payload) {
      const user = requireUser();
      const items = listEntity(key);
      const record = {
        ...prepareAssetPayload(payload),
        id: makeId(prefix),
        owner_email: user.email,
        created_date: nowIso(),
        updated_date: nowIso(),
      };
      items.push(record);
      writeEntity(key, items);
      return hydrateRecord(record);
    },
    async update(id, updates) {
      const user = requireUser();
      const items = listEntity(key);
      const index = items.findIndex((item) => item.id === id && item.owner_email === user.email);
      if (index === -1) throw new Error(`${prefix} not found`);
      items[index] = {
        ...items[index],
        ...prepareAssetPayload(updates),
        updated_date: nowIso(),
      };
      writeEntity(key, items);
      return hydrateRecord(items[index]);
    },
    async delete(id) {
      const user = requireUser();
      const items = listEntity(key);
      const nextItems = items.filter((item) => !(item.id === id && item.owner_email === user.email));
      writeEntity(key, nextItems);

      if (key === STORAGE_KEYS.brews) {
        const comments = listEntity(STORAGE_KEYS.comments).filter(
          (comment) => !(comment.brew_id === id && comment.owner_email === user.email)
        );
        writeEntity(STORAGE_KEYS.comments, comments);
      }
    },
  };
}

async function loginUser(user) {
  setSession({ email: user.email, token: `local_${user.id}` });
  return { user, access_token: `local_${user.id}` };
}

export const apiClient = {
  auth: {
    async register({ email, password }) {
      const users = getUsers();
      const pendingUsers = getPendingUsers();
      if (users.some((user) => user.email === email) || pendingUsers.some((user) => user.email === email)) {
        throw new Error('An account with this email already exists.');
      }

      const pendingUser = {
        id: makeId('user'),
        email,
        password,
        full_name: defaultNameFromEmail(email),
        role: 'user',
        created_date: nowIso(),
      };
      setPendingUsers([...pendingUsers, pendingUser]);
      return { email, otpCode: OTP_CODE };
    },

    async verifyOtp({ email, otpCode }) {
      if (otpCode !== OTP_CODE) {
        throw new Error('Invalid verification code.');
      }

      const pendingUsers = getPendingUsers();
      const pendingUser = pendingUsers.find((user) => user.email === email);
      if (!pendingUser) throw new Error('No pending account found.');

      setPendingUsers(pendingUsers.filter((user) => user.email !== email));
      setUsers([...getUsers(), pendingUser]);
      return loginUser(pendingUser);
    },

    setToken(token) {
      const session = getSession();
      if (!session) return;
      setSession({ ...session, token });
    },

    async resendOtp(email) {
      const pendingUser = getPendingUsers().find((user) => user.email === email);
      if (!pendingUser) throw new Error('No pending account found.');
      return { otpCode: OTP_CODE };
    },

    async loginViaEmailPassword(email, password) {
      const user = getUsers().find((item) => item.email === email && item.password === password);
      if (!user) throw new Error('Invalid email or password');
      return loginUser(user);
    },

    loginWithProvider(_provider, redirectPath = '/') {
      const demoEmail = 'google.user@local.dev';
      const users = getUsers();
      let user = users.find((item) => item.email === demoEmail);
      if (!user) {
        user = {
          id: makeId('user'),
          email: demoEmail,
          password: null,
          full_name: 'Google User',
          role: 'user',
          created_date: nowIso(),
        };
        setUsers([...users, user]);
      }
      return loginUser(user).then((result) => ({
        ...result,
        redirectPath,
      }));
    },

    async resetPasswordRequest(email) {
      const user = getUsers().find((item) => item.email === email);
      const token = makeId('reset');
      const tokens = readJson(STORAGE_KEYS.resetTokens, {});
      tokens[token] = user?.email ?? email;
      writeJson(STORAGE_KEYS.resetTokens, tokens);
      return { resetToken: token };
    },

    async resetPassword({ resetToken, newPassword }) {
      const tokens = readJson(STORAGE_KEYS.resetTokens, {});
      const email = tokens[resetToken];
      if (!email) throw new Error('Invalid reset token');
      const users = getUsers();
      const index = users.findIndex((user) => user.email === email);
      if (index === -1) throw new Error('User not found');
      users[index] = { ...users[index], password: newPassword, updated_date: nowIso() };
      delete tokens[resetToken];
      writeJson(STORAGE_KEYS.resetTokens, tokens);
      setUsers(users);
      return { success: true };
    },

    logout(redirectPath = '/welcome') {
      setSession(null);
      return { redirectPath };
    },

    async me() {
      return getCurrentUser();
    },
  },

  entities: {
    Brew: createScopedEntityApi({ key: STORAGE_KEYS.brews, prefix: 'brew' }),
    Comment: createScopedEntityApi({ key: STORAGE_KEYS.comments, prefix: 'comment' }),
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        return storeUploadedFile(file);
      },
    },
  },
};
