# 🧠 PedaVue

**PedaVue** adalah platform **e-learning interaktif** berbasis **Laravel 12** yang dirancang untuk mendukung pelatihan dan sertifikasi nasional bagi calon pendidik, profesional, dan masyarakat umum.  
Nama **PedaVue** diambil dari kata _“Pedagogi”_ dan _“Vue”_, mencerminkan semangat pembelajaran modern berbasis teknologi dan interaktivitas.

---

## 🚀 Fitur Utama

### 🎓 Pembelajaran Interaktif

- Materi pelatihan berbasis **video**, **teks**, dan **kuis**.
- Progress belajar tersimpan otomatis di setiap modul.

### 🧩 Manajemen Kursus

- Buat, kelola, dan publikasikan kursus secara fleksibel.
- Mendukung **kategori**, **tingkat kesulitan**, dan **status publikasi**.

### 🧑‍🏫 Peran Pengguna

- **Admin** → mengelola seluruh sistem dan pengguna.
- **Instruktur** → membuat kursus, kuis, dan menilai tugas.
- **Peserta** → mengikuti pelatihan, mengerjakan kuis, dan memperoleh sertifikat.

### 🏅 Sertifikasi Otomatis

- Sistem otomatis menghasilkan **sertifikat digital** setelah peserta menyelesaikan kursus.
- Setiap sertifikat memiliki **kode verifikasi unik** yang dapat dicek publik.

### 💬 Interaktivitas

- Sistem kuis (pilihan ganda, benar/salah, dan essay).
- Forum diskusi per kursus (opsional, sedang dikembangkan).

---

## 🧱 Arsitektur Sistem

- **Framework**: Laravel 12 (PHP 8.3)
- **Database**: MySQL
- **Frontend**: React.js / Inertia.js
- **Storage**: Laravel Filesystem (local)

---

## 🗂️ Struktur Model Utama

| Model                        | Deskripsi                                            |
| ---------------------------- | ---------------------------------------------------- |
| `User`                       | Menyimpan data pengguna (admin, instruktur, peserta) |
| `Course`                     | Kursus utama berisi modul, kuis, dan sertifikat      |
| `Module`                     | Submateri dari setiap kursus                         |
| `Quiz`, `Question`, `Answer` | Sistem kuis dan penilaian otomatis                   |
| `Enrollment`                 | Relasi peserta dengan kursus                         |
| `Certificate`                | Sertifikat digital hasil belajar                     |
| `Assignment`, `Submission`   | (Opsional) Tugas dan pengumpulan pekerjaan           |

---

## 🧭 Tujuan Proyek

PedaVue dikembangkan sebagai **inisiatif independen edutech** untuk:

- Memperluas akses pelatihan dan sertifikasi bagi masyarakat.
- Mendukung pengembangan **kompetensi pedagogik dan digital**.
- Menjadi dasar bagi penelitian dan inovasi di bidang **technology-enhanced learning**.

---

## 🧪 Cara Menjalankan Proyek

### 1️⃣ Clone repository

```bash
git clone https://github.com/galurarasy/pedavue.git
cd pedavue
```
