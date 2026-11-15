/*
 * Demo auth helper — client-side only.
 *
 * Accounts and sessions live in this browser's localStorage. There is no server,
 * so this is for prototyping the UI only: anything stored here can be read and
 * edited by anyone with access to the browser.
 *
 * TODO: Replace with a real backend before any real use — verify credentials
 * server-side, store password hashes (bcrypt/argon2) in a database, and keep the
 * session in an httpOnly, Secure cookie. Never hardcode credentials in this file;
 * load any server-side secrets from environment variables or a secrets vault.
 */
(function (global) {
  'use strict';

  var USERS_KEY = 'demo.users';
  var SESSION_KEY = 'demo.session';

  function readUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    } catch (e) {
      return false;
    }
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function randomSalt() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return toHex(bytes.buffer);
  }

  function toHex(buffer) {
    return Array.prototype.map
      .call(new Uint8Array(buffer), function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
  }

  // Hash so the demo never keeps a plaintext password around. A real backend
  // would use a slow password hash (bcrypt/argon2/scrypt) server-side instead.
  function hashPassword(password, salt) {
    if (!global.crypto || !global.crypto.subtle) {
      return Promise.reject(
        new Error('This page needs a secure context. Serve it over http://localhost instead of opening the file directly.')
      );
    }
    var data = new TextEncoder().encode(salt + ':' + password);
    return crypto.subtle.digest('SHA-256', data).then(toHex);
  }

  function register(name, email, password) {
    var cleanEmail = normalizeEmail(email);
    var cleanName = String(name || '').trim();

    if (!cleanName) return Promise.reject(new Error('Nama belum diisi.'));
    if (!isValidEmail(cleanEmail)) return Promise.reject(new Error('Format email tidak valid.'));
    if (String(password || '').length < 8) {
      return Promise.reject(new Error('Password minimal 8 karakter.'));
    }

    var users = readUsers();
    if (users[cleanEmail]) {
      return Promise.reject(new Error('Email ini sudah terdaftar. Silakan login.'));
    }

    var salt = randomSalt();
    return hashPassword(password, salt).then(function (hash) {
      users[cleanEmail] = {
        name: cleanName,
        email: cleanEmail,
        salt: salt,
        hash: hash,
        createdAt: new Date().toISOString()
      };
      if (!writeUsers(users)) {
        throw new Error('Tidak bisa menyimpan data di browser ini.');
      }
      return users[cleanEmail];
    });
  }

  function login(email, password) {
    var cleanEmail = normalizeEmail(email);
    var users = readUsers();
    var user = users[cleanEmail];

    // Same message either way, so the form doesn't reveal which emails exist.
    var failed = new Error('Email atau password salah.');

    if (!user) return Promise.reject(failed);

    return hashPassword(password, user.salt).then(function (hash) {
      if (hash !== user.hash) throw failed;
      startSession(user);
      return user;
    });
  }

  function startSession(user) {
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ email: user.email, name: user.name, since: Date.now() })
      );
    } catch (e) {
      /* storage unavailable — the homepage guard will send the user back to login */
    }
  }

  function currentUser() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      /* nothing to clear */
    }
  }

  // Send anyone without a session back to the login page.
  function requireAuth(redirectTo) {
    var user = currentUser();
    if (!user) {
      location.replace(redirectTo || 'index.html');
      return null;
    }
    return user;
  }

  global.Auth = {
    register: register,
    login: login,
    logout: logout,
    currentUser: currentUser,
    requireAuth: requireAuth,
    isValidEmail: isValidEmail
  };
})(window);
