# RULES.md — Aturan Bisnis, Kepatuhan Data & Standar Pengembangan Sistem

Dokumen ini merupakan pedoman wajib bagi seluruh tim pengembang (*Backend*, *Frontend*, *Database Administrator*, dan *DevOps*) dalam membangun dan mengoperasikan platform **MedCred Nasional**.

---

## 1. Prinsip Dasar & Kepatuhan Hukum (Compliance Rules)

1. **Posisi Layanan Sebagai Fasilitator Administrasi**:
   - Sistem berfungsi sebagai platform **pendampingan, kurasi kelengkapan, dan pemantauan administrasi** antara dokter/faskes dengan instansi resmi (Kemenkes, KKI, Kolegium, Dinkes).
   - Sistem **dilarang keras** memfasilitasi pemalsuan dokumen, manipulasi angka SKP, atau penerbitan dokumen tanpa sumber primer yang sah.
   - Setiap dokumen persyaratan wajib melewati tahap **Primary Source Verification (PSV)** atau pengecekan keabsahan resmi sebelum status tiket dipindahkan ke `SUBMITTED_TO_GOV`.

2. **Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022)**:
   - **Enkripsi Data Sensitif**: NIK dokter (`doctors.nik_encrypted`) dan nomor rekening agen (`agents_and_pics.bank_account_enc`) wajib dienkripsi menggunakan **AES-256** (`pgcrypto`) sebelum disimpan. Pencarian eksak wajib menggunakan kolom hash (`nik_hash`), bukan mendekripsi seluruh tabel.
   - **Audit Akses Data Sensitif**: Setiap pembacaan NIK terdekripsi wajib memiliki izin `docs:view_sensitive_nik` dan tercatat di tabel `auth_audit_logs` dengan `event_type = 'SENSITIVE_NIK_VIEW'`.
   - **Object Storage & Presigned URL**: File fisik dokumen (KTP, STR, SIP, Ijazah) dilarang disimpan di database maupun diakses melalui URL publik statis. Gunakan *Presigned URL* dengan masa berlaku maksimal **15 menit**.

3. **Batas Praktik Dokter Sesuai Regulasi Kesehatan**:
   - Relasi pada `doctor_organization_affiliations` membatasi setiap dokter memiliki maksimal **3 slot tempat praktik** (`practice_slot BETWEEN 1 AND 3`). Sistem harus menolak pendaftaran SIP baru jika ke-3 slot aktif dokter sudah terisi penuh tanpa pencabutan SIP lama.

---

## 2. Aturan Alur Kerja Tiket (*Ticket State Machine*)

Perpindahan `current_stage` pada tabel `service_tickets` wajib mengikuti transisi yang sah di bawah ini:

| Dari Tahap (`from_stage`) | Ke Tahap (`to_stage`) | Syarat & Validasi Sistem Wajib |
| :--- | :--- | :--- |
| *(Baru)* | `AWAITING_DOCS` | Profil dokter valid, `service_type_id` aktif, sesi QR & PIN dibuat. |
| `AWAITING_DOCS` | `INTERNAL_CURATION` | Minimal dokumen inti telah diunggah oleh dokter atau PIC B2B. |
| `INTERNAL_CURATION` | `REVISION_REQUIRED` | Operator menandai minimal 1 dokumen berstatus `REJECTED` beserta `rejection_reason` yang jelas; notifikasi WA otomatis dikirim ke dokter. |
| `REVISION_REQUIRED` | `INTERNAL_CURATION` | Dokter mengunggah ulang dokumen perbaikan melalui Portal QR. |
| `INTERNAL_CURATION` | `SUBMITTED_TO_GOV` | **WAJIB**: `verified_docs_count >= required_docs_total` dan seluruh kode dokumen di `master_service_types.required_doc_codes` berstatus `VERIFIED_OCR` atau `VERIFIED_PSV`. |
| `SUBMITTED_TO_GOV` | `GOV_VERIFICATION` | Nomor resi/registrasi instansi (`external_gov_ref_no`) telah diinput oleh operator. |
| `GOV_VERIFICATION` | `COMPLETED` | **WAJIB**: Minimal 1 dokumen hasil terbitan resmi telah diunggah ke tabel `issued_outcomes` dan status pembayaran invoice lunas (`PAID`), kecuali kontrak B2B pascabayar (*Enterprise*). |
| *(Tahap sebelum `SUBMITTED_TO_GOV`)* | `CANCELLED` | Wajib menyertakan alasan pembatalan di `ticket_stage_histories.notes`. |

---

## 3. Aturan Akses Portal Mandiri QR Code (`qr_upload_sessions`)

1. **Keamanan Token & PIN**:
   - Token akses pada URL QR tidak boleh menggunakan UUID tiket atau nomor STR secara langsung. Gunakan token acak 256-bit yang disimpan dalam bentuk hash SHA-256 (`access_code_hash`) dan dipasangkan dengan 6-digit PIN (`pin_code`).
2. **Kedaluwarsa & Pembatasan Percobaan**:
   - Sesi QR berlaku selama **7 hari** (`expires_at`) sejak diterbitkan dan dapat diperpanjang oleh operator.
   - Salah memasukkan PIN sebanyak **5 kali berturut-turut** akan mengunci sesi sementara selama 30 menit dan mencatat peristiwa di `auth_audit_logs`.
3. **Antarmuka Bebas Hambatan**:
   - Halaman Portal QR Dokter dirancang khusus untuk perangkat seluler tanpa tombol kembali yang membingungkan alur, sehingga dokter langsung fokus melengkapi formulir dan mengunggah berkas.

---

## 4. Aturan Penagihan (Billing), SLA & Komisi Agen

1. **SLA Bertingkat (`service_sla_tiers` & `ticket_stage_slas`)**:
   - SLA dihitung otomatis per tahapan oleh *trigger* `trg_ticket_stage_sla`.
   - Worker pemantau SLA berjalan setiap **5 menit** untuk memperbarui status menjadi `WARNING` saat waktu melewati `warning_at` (80% durasi) dan `BREACHED` saat melewati `breach_due_at`, lalu mengirim eskalasi ke `REGIONAL_PIC` atau `SUPER_ADMIN`.
2. **Penagihan B2C vs. B2B (`service_invoices`)**:
   - **Jalur B2C**: 1 tagihan diterbitkan per tiket pengurusan dokter mandiri.
   - **Jalur B2B**: Mendukung penagihan per tiket maupun penagihan kolektif (*consolidated invoice*) untuk beberapa tiket dokter dalam satu `organization_id`.
3. **Perhitungan Komisi Agen & PIC (`commission_ledger`)**:
   - Entri komisi hanya boleh dibuat setelah tiket mencapai status `COMPLETED` **dan** tagihan terkait berstatus `PAID`.
   - Apabila terjadi pengembalian dana (*refund*) atau pembatalan pasca-selesai, sistem wajib membuat entri pembalik (`payout_status = 'CLAWBACK'`) dan tidak boleh menghapus baris historis pada `commission_ledger`.

---

## 5. Standar *Engineering* & Database untuk Skala 100 Juta+ Baris

1. **Larangan Kueri Tanpa Kunci Partisi**:
   - Setiap kueri `SELECT`, `UPDATE`, atau `DELETE` pada tabel terpartisi (`service_tickets`, `doctor_documents`, `ticket_stage_histories`, `user_sessions`, `commission_ledger`) **wajib** menyertakan filter kolom kunci partisi (`created_at`, `uploaded_at`, `logged_at`, atau `started_at`) agar PostgreSQL menjalankan *Partition Pruning*.
2. **Gunakan UUIDv7 untuk Primary Key**:
   - Seluruh pembuatan `UUID` di lapisan aplikasi wajib menggunakan standar **UUIDv7** (*time-ordered*) agar penyisipan indeks B-Tree selalu berurutan di ujung kanan (*append-only*) dan mencegah penurunan IOPS disk.
3. **Larangan `COUNT(*)` Lintas Tabel Besar untuk Dashboard**:
   - Halaman ringkasan operasional wajib membaca kolom ter-denormalisasi `verified_docs_count` pada `service_tickets` dan menggunakan *cache* Redis (TTL 30–60 detik) untuk angka agregasi nasional.
4. **Isolasi Multi-Tenant Wajib via RLS**:
   - Setiap koneksi database yang melayani permintaan API pengguna eksternal (`B2B_ADMIN`, `REGIONAL_PIC`, `DOCTOR`) **wajib** menginjeksi `SET LOCAL app.current_role`, `SET LOCAL app.current_org_id`, dan `SET LOCAL app.current_province` di dalam blok transaksi sebelum mengeksekusi kueri apa pun.