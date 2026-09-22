# CLAUDE.md

## Konteks

Take-home Ottodot: sistem booking kelas trial, kapasitas 4 murid per kelas. Fokus pada kebenaran backend, bukan tampilan. Scope hanya booking trial.

**README.md adalah sumber kebenaran desain.** Model data, status booking, endpoint, struktur folder, alur pembayaran Midtrans, dan pendekatan rebutan kursi terakhir mengikuti README. Jika ada perubahan desain, perbarui README juga.

Stack:

- Frontend: Next.js App Router, React, TypeScript, Tailwind
- Backend: Next.js Route Handlers untuk API dan webhook (tanpa Express)
- Database: Supabase (Postgres), Postgres function `confirm_payment` untuk logika atomik
- Pembayaran: Midtrans Snap sandbox dengan webhook Payment Notification
- Deployment: Vercel
- Testing: Vitest

## Perintah

- `npx supabase link --project-ref <ref>` menghubungkan CLI ke project Supabase online (sekali saja)
- `npx supabase db push` memasang migrasi baru ke Supabase online
- `npx supabase db reset --linked` menghapus semua data, menjalankan ulang migrasi dan seed di Supabase online
- `npm run dev` menjalankan aplikasi
- `npm test` menjalankan semua tes terhadap Supabase online. Tes mengosongkan data, jadi jalankan `db reset --linked` setelahnya untuk mengembalikan seed

Tidak ada Supabase lokal atau Docker. Development, tes, dan demo Vercel memakai satu project Supabase online (Postgres).

## Aturan Wajib

- Semua API dan webhook memakai route handler Next.js.
- Perubahan `confirmed_count` hanya lewat function `confirm_payment`. Jangan pernah "count lalu insert/update" di kode aplikasi.
- Setiap update status booking wajib memakai `WHERE status = 'pending_payment'`.
- Status pembayaran hanya berasal dari webhook Midtrans yang signature-nya sudah diverifikasi. Jangan percaya hasil pembayaran dari client.
- Duplikat dicegah oleh partial unique index. Tangkap error `23505` dan kembalikan 409.
- Perubahan skema selalu lewat file migrasi baru di `supabase/migrations`.
- Setiap perubahan logika booking atau pembayaran harus disertai tes. Tes race N8 dan N9 wajib tetap lulus.
- Jangan kerjakan yang ada di README bagian "Yang Sengaja Tidak Dikerjakan".

## Cara Kerja

- Kerjakan TODO sesuai urutan flow.
- Setiap flow dikerjakan lengkap: database, backend, UI, lalu tesnya.
- Setelah satu item selesai dan tesnya lulus, ubah `[ ]` menjadi `[x]`.
- Commit setiap selesai satu flow.

## TODO

### Perencanaan
- [x] Pahami soal dan tentukan pendekatan rebutan kursi terakhir
- [x] Draf README
- [x] Draf CLAUDE.md

### Fondasi

```
Next.js + Tailwind ─► Supabase online ─► migrasi tabel + constraint ─► seed ─► Vitest
```

- [ ] Inisialisasi Next.js dengan TypeScript dan Tailwind
- [ ] Buat project Supabase online, `npx supabase init`, lalu `npx supabase link`
- [ ] Buat `.env.example`
- [ ] Migrasi tabel `parents`, `students`, `trial_classes`, `bookings`, `payment_attempts`
- [ ] Partial unique index anti booking ganda
- [ ] CHECK constraint `confirmed_count <= capacity`
- [ ] `supabase/seed.sql` (kelas dengan 1, 3, dan 4 murid terkonfirmasi)
- [ ] `lib/supabase.ts` (server client dengan service role)
- [ ] Konfigurasi Vitest dan helper reset data tes

### Flow 1: Pilih Anak dan Kelas

```
Orang tua ─► pilih orang tua ─► GET /api/parents/:id/students ─► pilih anak
          ─► GET /api/classes (dengan sisa kursi) ─► pilih kelas
```

- [ ] `GET /api/parents/:id/students`
- [ ] `GET /api/classes` beserta sisa kursi
- [ ] UI halaman booking: dropdown orang tua, anak, dan daftar kelas
- [ ] Tes P1

### Flow 2: Buat Booking

```
Kirim booking ─► POST /api/bookings ─► insert bookings (pending_payment)
                                            ├─► berhasil ─► 201 + booking_id
                                            └─► error 23505 ─► 409 duplikat
```

- [ ] `POST /api/bookings` dengan validasi anak milik orang tua
- [ ] Tangkap error `23505` dan kembalikan 409
- [ ] UI tombol kirim booking dan pesan jika duplikat
- [ ] Tes P2, N1, N2

### Flow 3: Pembayaran Midtrans

```
Tombol bayar ─► POST /api/bookings/:id/pay
                    ─► buat transaksi Snap (order_id unik)
                    ─► simpan payment_attempts
                    ─► kembalikan snap token
             ─► orang tua bayar di Midtrans Snap
```

- [ ] `lib/midtrans.ts`: buat transaksi Snap
- [ ] `POST /api/bookings/:id/pay`
- [ ] UI tombol bayar dengan Midtrans Snap

### Flow 4: Webhook dan Konfirmasi Kursi

```
Midtrans ─► POST /api/payments/midtrans/notification
         ─► verifikasi signature
               ├─► tidak valid ─► 401
               └─► valid ─► petakan status Midtrans
                              ├─► pending ─► abaikan (200)
                              ├─► gagal ─► confirm_payment ─► payment_failed
                              └─► sukses ─► confirm_payment
                                              ├─► kursi ada ─► confirmed
                                              └─► kursi habis ─► rejected_class_full
```

- [ ] Function `confirm_payment` (migrasi baru)
- [ ] `lib/midtrans.ts`: verifikasi signature
- [ ] Pemetaan status Midtrans ke sukses, gagal, atau abaikan
- [ ] `POST /api/payments/midtrans/notification`
- [ ] Helper tes untuk membuat notifikasi Midtrans bertanda tangan
- [ ] Tes P3, N3, N4, N5, N6, N7
- [ ] Tes rebutan kursi terakhir N8 dan N9

### Flow 5: Status Booking

```
Halaman status ─► GET /api/bookings/:id ─► tampilkan status
               ─► ulangi (polling) selama masih pending_payment
```

- [ ] `GET /api/bookings/:id`
- [ ] UI halaman status booking dengan polling
- [ ] Tes P4

### Flow 6: Roster

```
Admin atau guru ─► GET /api/classes/:id/roster ─► hanya booking confirmed
```

- [ ] `GET /api/classes/:id/roster`
- [ ] UI halaman roster per kelas
- [ ] Tes P5

### Deploy

```
Seed ulang (db reset --linked) ─► Vercel (env) ─► URL notifikasi Midtrans ─► uji end to end
```

- [ ] Jalankan `npx supabase db reset --linked` supaya data demo bersih
- [ ] Deploy ke Vercel dengan environment variable
- [ ] Atur Payment Notification URL di dashboard Midtrans sandbox
- [ ] Uji alur lengkap di sandbox: sukses, gagal, duplikat, kursi terakhir

### Dokumentasi dan Pengumpulan
- [ ] Lengkapi TODO di README (waktu, langkah demo, link Vercel)
- [ ] Susun AI_USAGE.md dari bagian di bawah
- [ ] Rekam video walkthrough 5 sampai 8 menit
- [ ] Pastikan repo publik dan kirim link

## Catatan

### 1. Tool AI yang Dipakai

- Claude Code: implementasi kode, tes, dan migrasi database (dipandu CLAUDE.md ini)

### 2. AI Dipakai untuk Apa


- Membahas pilihan pendekatan rebutan kursi terakhir beserta trade-off-nya
- Menyusun draf skema data, alur status booking, daftar endpoint, dan test case
- Menyusun draf README dan CLAUDE.md
- [TODO] Implementasi dengan Claude Code

Keputusan yang saya ambil sendiri: memilih pendekatan cek atomik saat konfirmasi pembayaran, memakai stack yang sudah saya kuasai (Next.js, Supabase, Vercel), memakai Midtrans sandbox dengan webhook, Next.js fullstack tanpa Express, struktur test case positif, negatif, serta rebutan kursi terakhir, dan menyusun TODO per flow.

### 3. Contoh AI Membantu Bekerja Lebih Cepat

Di tahap perencanaan, menjelaskan inti yang diuji (konkurensi dan integritas data), lalu menyusun kerangka README yang langsung memetakan semua kewajiban soal. Tahap pemahaman dan perencanaan yang biasanya memakan waktu lama jadi jauh lebih cepat sebelum saya mulai ngoding.

[TODO] Tambahkan contoh dari tahap implementasi jika ada yang lebih kuat.

### 4. Contoh Output AI yang Dikoreksi atau Ditolak

- Claude awalnya merancang pembayaran sebagai mock (hasil sukses atau gagal dipilih dari client). Saya koreksi untuk memakai Midtrans sandbox karena integrasinya sudah pernah. Dampaknya, desain berubah: status pembayaran harus datang dari webhook yang diverifikasi signature-nya, dan penanganan notifikasi ganda jadi bagian penting.
- Claude awalnya menyarankan stack Next.js dengan Postgres lewat Docker. Saya ganti ke stack yang sudah saya pakai (Supabase dan Vercel). Dari situ muncul keputusan memindahkan logika pengambilan kursi ke Postgres function `confirm_payment`, karena Supabase JS client tidak mendukung transaksi multi-statement.
- TODO dari Claude awalnya disusun per lapisan teknis (setup, database, backend, UI). Saya ubah menjadi per flow dengan diagram alur, supaya setiap fitur dikerjakan dan dites sampai tuntas sebelum pindah ke fitur berikutnya.

[TODO] Tambahkan koreksi dari tahap implementasi.

### 5. Yang Akan Diubah dari Cara Kerja dengan AI

[TODO] Isi di akhir pengerjaan.

### 6. Cara Memverifikasi Implementasi Akhir

[TODO] Isi setelah verifikasi benar-benar dilakukan. Rencana: menjalankan semua tes termasuk N8 dan N9, mencoba alur lengkap di sandbox Midtrans lewat URL Vercel, mengecek isi tabel di Supabase setelah setiap skenario, dan membaca ulang `confirm_payment`.
