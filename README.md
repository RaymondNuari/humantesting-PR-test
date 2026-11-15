# Simple App — login, register, homepage

Website statis sederhana: halaman login (email + password), halaman register,
dan homepage yang hanya bisa diakses setelah login.

## Struktur

```
index.html      halaman login (+ tombol Register)
register.html   form pendaftaran
home.html       homepage, redirect ke login kalau belum masuk
css/style.css   styling bersama (light & dark mode)
js/auth.js      helper auth demo (localStorage)
```

## Menjalankan

```bash
cd /Users/raymondnuari/testGH_App && python3 -m http.server 8000
```

Lalu buka http://localhost:8000.

Jalankan lewat server lokal, jangan buka file HTML-nya langsung — `crypto.subtle`
(dipakai untuk hashing password) hanya aktif di secure context.

## Alur

1. Buka `/` → halaman login.
2. Klik **Register** → isi nama, email, password (min. 8 karakter) → kembali ke login.
3. Login dengan email + password tadi → masuk ke homepage.
4. Tombol **Logout** di homepage menghapus sesi.

## Catatan keamanan

Ini prototipe UI. Akun dan sesi disimpan di `localStorage` browser, jadi siapa pun
yang punya akses ke browser bisa membaca dan mengubahnya. Password di-hash
(SHA-256 + salt acak) supaya tidak ada plaintext yang tersimpan, tapi itu tetap
bukan pengganti autentikasi server.

Sebelum dipakai sungguhan:

- Pindahkan verifikasi kredensial ke backend.
- Simpan hash password dengan algoritma lambat (bcrypt / argon2) di database.
- Simpan sesi di cookie `httpOnly` + `Secure`, bukan localStorage.
- Ambil konfigurasi rahasia dari environment variable atau secrets vault — jangan
  pernah menulisnya langsung di kode.
