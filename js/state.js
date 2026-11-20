// =============================================================================
// MEDCRED CONCIERGE - SHARED STATE & DATA LAYER (js/state.js)
// =============================================================================

const CREDENTIAL_STANDARDS = [
      { code: 'STR', title: '1. STR Dokter Spesialis' },
      { code: 'SIP1', title: '2. SIP 1 (Rumah Sakit Utama)' },
      { code: 'SIP2', title: '3. SIP 2 (Faskes Jejaring)' },
      { code: 'IJAZAH', title: '4. Ijazah Dokter Spesialis' },
      { code: 'KOLEGIUM', title: '5. Sertifikat Kolegium' },
      { code: 'SEHAT', title: '6. Surat Sehat Fisik & Jiwa' },
      { code: 'MITRA', title: '7. Rekomendasi Mitra Bestari' },
      { code: 'NAPZA', title: '8. Surat Bebas Narkoba (NAPZA)' },
      { code: 'LOGBOOK', title: '9. Log Book Tindakan 12 Bulan' }
    ];

const DEFAULT_STATE = {
  settingsTab: 'api',
  settingsData: {
    kkiStatus: true,
    kkiAutoSync: 'daily',
    satuSehatStatus: true,
    satuSehatEnv: 'production',
    satuSehatClientId: 'MK-PROD-99834211-KEMKES',
    satuSehatSecret: '••••••••••••••••••••••••••••••••',
    satuSehatEndpoint: 'https://api.satusehat.kemkes.go.id/v1/practitioner',
    waStatus: true,
    waSender: '+62 812-9988-7711 (MedCred Concierge Official)',
    waToken: '••••••••••••••••••••••••••••••••',
    smtpHost: 'smtp.medcred.id',
    smtpPort: 587,
    smtpSender: 'concierge-notifikasi@medcred.id',
    expiryThresholdDays: 30,
    reminderFrequency: 'weekly',
    slaStrDays: 7,
    slaJafungDays: 14,
    slaKolegiumDays: 10,
    slaSipDays: 7,
    encryptionEnabled: true,
    twoFactorEnabled: true,
    sessionTimeoutMin: 30,
    legalEntityName: 'PT MedCred Layanan Medis Nusantara',
    nibNumber: '0220391823019',
    officeAddress: 'Menara Kuningan Lt. 15, Jl. H.R. Rasuna Said Kav. 5, Jakarta Selatan 12940',
    supportEmail: 'concierge@medcred.id',
    callCenter: '(021) 5088-9120 / WhatsApp: 0812-9988-7711'
  },
      loginRole: 'admin', // 'admin' | 'doctor' | 'partner'
      currentUser: {
        id: 'user-siti',
        name: 'Siti Rahma, S.Farm',
        role: 'admin',
        roleLabel: 'LEAD CONCIERGE PERIZINAN & KREDENSIAL',
        badge: 'Admin Concierge Nasional',
        avatarBg: 'bg-[#006948]'
      },
      clientSegmentFilter: 'all', // 'all' | 'b2c' | 'b2b'
      servicePackageFilter: 'all',
      selectedDoctorId: 'doc-elena',
      psvDoctorId: 'doc-elena',
      psvMobileTab: 'preview',
      committeeDoctorId: 'doc-elena',
      qrPortalDoctorId: 'doc-elena',
      qrPortalMode: 'existing',
      qrModalDoctorId: 'doc-elena',
      tableStatusTab: 'all', // 'all' | 'curation' | 'need_revision' | 'submitted_instansi' | 'completed' | 'cancelled'
      pinAttempts: 5,
      portalLocked: false,
      sipSlotExceeded: false,
      sipRevokeChosen: false,
      sipRevokeSlot: 'slot2',
      cancellingDoctorId: null,
      unmaskingDoctorId: null,
      tablePage: 1,
      currentZoom: 1,
      reminderTargetDoctorId: null,
      psvPendingCount: 28,
      criticalCount: 14,
      totalNationalTickets: 148,

      // State Filter & Pagination Direktori Dokter
      directoryTab: 'all', // 'all' | 'curation' | 'need_revision' | 'submitted_instansi' | 'completed'
      directorySearch: '',
      directorySegment: 'all', // 'all' | 'B2C' | 'B2B'
      directoryService: 'all', // 'all' | 'srv-str' | 'srv-jafung' | 'srv-kolegium' | 'srv-sip'
      directoryCompleteness: 'all', // 'all' | 'complete' | 'incomplete'
      directorySpecialty: 'all',
      directoryPage: 1,
      directoryPerPage: 5,

      // State Invoicing (Faktur & Penagihan B2C / B2B)
      invoiceFilter: 'all', // 'all' | 'PAID' | 'UNPAID' | 'B2C' | 'B2B'
      invoices: [
        {
          id: 'INV-2026-0081',
          date: '14 Nov 2026',
          dueDate: '28 Nov 2026',
          clientType: 'B2C',
          clientName: 'Dr. Elena Rostova, Sp.A(K)',
          clientOrg: 'Praktik Mandiri - Bandung',
          serviceName: 'Pembaruan STR 5 Tahunan & SKP Plataran Sehat',
          ticketRef: '#MC-2026-8839',
          amount: 2500000,
          paymentMethod: 'Transfer VA BCA',
          status: 'PAID',
          paidAt: '15 Nov 2026, 10:24 WIB'
        },
        {
          id: 'INV-2026-0082',
          date: '15 Nov 2026',
          dueDate: '29 Nov 2026',
          clientType: 'B2B',
          clientName: 'Klinik Pratama Sehat Bersama',
          clientOrg: 'Surabaya, Jawa Timur',
          serviceName: 'Fasilitasi Batch SIP Kolektif & SKP (12 Dokter)',
          ticketRef: 'Batch 12 Tiket',
          amount: 18000000,
          paymentMethod: 'Pascabayar Kontrak B2B (Term 30)',
          status: 'PAID',
          paidAt: '17 Nov 2026, 14:10 WIB'
        },
        {
          id: 'INV-2026-0083',
          date: '16 Nov 2026',
          dueDate: '30 Nov 2026',
          clientType: 'B2C',
          clientName: 'Dr. Marcus Vance, Sp.BTKV',
          clientOrg: 'RS Citra Medika Jabar',
          serviceName: 'Pemberkasan Kenaikan Jenjang Jabatan Fungsional (Jafung)',
          ticketRef: '#MC-2026-8841',
          amount: 3200000,
          paymentMethod: 'QRIS Dinamis',
          status: 'PAID',
          paidAt: '16 Nov 2026, 16:45 WIB'
        },
        {
          id: 'INV-2026-0084',
          date: '18 Nov 2026',
          dueDate: '02 Des 2026',
          clientType: 'B2C',
          clientName: 'Dr. Sophia Al-Mansoor, Sp.An',
          clientOrg: 'Klinik Utama Sehat',
          serviceName: 'Rekomendasi Kolegium & Penerbitan SIP Jejaring 2',
          ticketRef: '#MC-2026-8838',
          amount: 2800000,
          paymentMethod: 'Transfer Mandiri VA',
          status: 'UNPAID',
          paidAt: null
        },
        {
          id: 'INV-2026-0085',
          date: '18 Nov 2026',
          dueDate: '02 Des 2026',
          clientType: 'B2B',
          clientName: 'RS Citra Medika Jaringan Jabar',
          clientOrg: 'Bandung, Jawa Barat',
          serviceName: 'Fasilitasi Kenaikan Jafung & SIP Spesialis (24 Dokter)',
          ticketRef: 'Batch 24 Tiket',
          amount: 36000000,
          paymentMethod: 'Termin Korporasi B2B',
          status: 'UNPAID',
          paidAt: null
        },
        {
          id: 'INV-2026-0086',
          date: '19 Nov 2026',
          dueDate: '03 Des 2026',
          clientType: 'B2C',
          clientName: 'dr. Amara Okafor, Sp.PD-KGEH',
          clientOrg: 'Surabaya Medika Center',
          serviceName: 'Pembaruan STR Subspesialis & Rekomendasi Kolegium',
          ticketRef: '#MC-2026-8818',
          amount: 3500000,
          paymentMethod: 'Transfer BNI VA',
          status: 'PAID',
          paidAt: '19 Nov 2026, 11:05 WIB'
        }
      ],

      // State Buku Besar Komisi Agen (Commission Ledger)
      commissionFilter: 'all', // 'all' | 'READY_FOR_PAYOUT' | 'PAID_OUT' | 'CLAWBACK'
      commissions: [
        {
          id: 'COM-2026-101',
          date: '15 Nov 2026',
          agentName: 'Rahmat Hidayat',
          agentRole: 'REFERRAL_AGENT',
          agentArea: 'Jawa Timur',
          doctorName: 'Dr. Elena Rostova, Sp.A(K)',
          ticketRef: '#MC-2026-8839',
          grossAmount: 500000,
          taxPph: 25000, // 5% PPh 21
          netAmount: 475000,
          bankAccount: 'BCA 8210-9912-33 a.n Rahmat Hidayat',
          status: 'PAID_OUT',
          payoutDate: '17 Nov 2026'
        },
        {
          id: 'COM-2026-102',
          date: '16 Nov 2026',
          agentName: 'Siti Rahma, S.Farm',
          agentRole: 'HANDLING_PIC',
          agentArea: 'Nasional',
          doctorName: 'Dr. Marcus Vance, Sp.BTKV',
          ticketRef: '#MC-2026-8841',
          grossAmount: 400000,
          taxPph: 20000,
          netAmount: 380000,
          bankAccount: 'Mandiri 1370-0019-82 a.n Siti Rahma',
          status: 'PAID_OUT',
          payoutDate: '17 Nov 2026'
        },
        {
          id: 'COM-2026-103',
          date: '17 Nov 2026',
          agentName: 'Ibu Nurlaila, S.Kep',
          agentRole: 'REGIONAL_LEAD',
          agentArea: 'Jawa Barat',
          doctorName: 'Kemitraan RS Citra Medika (Batch 24 Dr)',
          ticketRef: 'Batch 24 Tiket',
          grossAmount: 2400000,
          taxPph: 120000,
          netAmount: 2280000,
          bankAccount: 'BCA 4410-1829-01 a.n Nurlaila',
          status: 'READY_FOR_PAYOUT',
          payoutDate: null
        },
        {
          id: 'COM-2026-104',
          date: '18 Nov 2026',
          agentName: 'dr. Bagus Setiawan',
          agentRole: 'HANDLING_PIC',
          agentArea: 'Jawa Timur',
          doctorName: 'Klinik Pratama Sehat Bersama (Batch 12 Dr)',
          ticketRef: 'Batch 12 Tiket',
          grossAmount: 1200000,
          taxPph: 60000,
          netAmount: 1140000,
          bankAccount: 'BNI 0921-8841-29 a.n Bagus Setiawan',
          status: 'READY_FOR_PAYOUT',
          payoutDate: null
        },
        {
          id: 'COM-2026-105',
          date: '19 Nov 2026',
          agentName: 'Dimas Prasetyo',
          agentRole: 'REFERRAL_AGENT',
          agentArea: 'D.I. Yogyakarta',
          doctorName: 'dr. Amara Okafor, Sp.PD-KGEH',
          ticketRef: '#MC-2026-8818',
          grossAmount: 500000,
          taxPph: 25000,
          netAmount: 475000,
          bankAccount: 'BSI 7120-9941-88 a.n Dimas Prasetyo',
          status: 'READY_FOR_PAYOUT',
          payoutDate: null
        },
        {
          id: 'COM-2026-098',
          date: '10 Nov 2026',
          agentName: 'Budi Santoso',
          agentRole: 'REFERRAL_AGENT',
          agentArea: 'Jawa Tengah',
          doctorName: 'dr. Rudi Hartono, Sp.B (Dibatalkan Pasca Submit)',
          ticketRef: '#MC-2026-8802',
          grossAmount: -500000,
          taxPph: -25000,
          netAmount: -475000,
          bankAccount: 'BCA 1180-2219-44 a.n Budi Santoso',
          status: 'CLAWBACK',
          payoutDate: '12 Nov 2026 (Penyesuaian Buku Besar)'
        }
      ],

      // Partners B2B (Mitra Klinik, Faskes & RS Swasta)
      partners: [
        {
          id: 'part-1',
          name: 'Klinik Pratama Sehat Bersama',
          city: 'Surabaya, Jawa Timur',
          type: 'Klinik Rawat Inap & 24 Jam',
          totalDoctors: 12,
          completedCount: 10,
          inProgressCount: 2,
          contactPerson: 'dr. Bagus Setiawan (Penanggung Jawab Medis)',
          phone: '0812-6619-9874'
        },
        {
          id: 'part-2',
          name: 'RS Citra Medika Jaringan Jabar',
          city: 'Bandung, Jawa Barat',
          type: 'Rumah Sakit Swasta Tipe C',
          totalDoctors: 24,
          completedCount: 18,
          inProgressCount: 6,
          contactPerson: 'Ibu Nurlaila, S.Kep (Bagian Diklat & SDM)',
          phone: '0813-4412-9901'
        },
        {
          id: 'part-3',
          name: 'Klinik Spesialis Kasih Medika',
          city: 'Yogyakarta, D.I. Yogyakarta',
          type: 'Klinik Spesialis & Bedah Minor',
          totalDoctors: 8,
          completedCount: 7,
          inProgressCount: 1,
          contactPerson: 'dr. Hendra Wijaya (Manajer Medis)',
          phone: '0811-7789-2233'
        }
      ],

      // Katalog Paket Layanan Pengurusan ke Instansi
      servicePackages: [
        {
          id: 'srv-str',
          title: 'Pembaruan STR 5 Tahunan & SKP Plataran Sehat',
          instansi: 'Kemenkes RI & KKI',
          targetSla: '7 - 14 Hari Kerja',
          badge: 'Siklus 5 Tahunan',
          desc: 'Kurasi poin SKP SatuSehat Plataran Sehat Kemenkes, validasi e-KTA IDI/Organisasi Profesi, dan penerbitan e-STR Konsil Kedokteran Indonesia.'
        },
        {
          id: 'srv-jafung',
          title: 'Pemberkasan Kenaikan Jenjang Jabatan Fungsional (Jafung)',
          instansi: 'Kemenkes RI & BKN',
          targetSla: '14 - 21 Hari Kerja',
          badge: 'Karier Dokter',
          desc: 'Penyusunan portofolio DUPAK dan penilaian angka kredit pelayanan medis berkala untuk jenjang Pertama, Muda, Madya, hingga Utama.'
        },
        {
          id: 'srv-kolegium',
          title: 'Pengurusan Rekomendasi Kolegium & Sertifikat Kompetensi',
          instansi: 'Kolegium Spesialis & Kemenkes',
          targetSla: '10 - 20 Hari Kerja',
          badge: 'Resertifikasi',
          desc: 'Audit logbook tindakan medis, pengesahan borang resertifikasi kompetensi, dan penerbitan surat rekomendasi kolegium spesialis.'
        },
        {
          id: 'srv-sip',
          title: 'Penerbitan SIP Baru & SIP Faskes Jejaring Dinkes',
          instansi: 'Dinas Kesehatan & DPMPTSP',
          targetSla: '5 - 10 Hari Kerja',
          badge: 'Perizinan Faskes',
          desc: 'Pengurusan SIP Tempat Praktik Mandiri, Klinik, dan RS Jejaring di seluruh wilayah kota/kabupaten terintegrasi SatuSehat SDMK.'
        }
      ],

      doctors: [
        {
          id: 'doc-elena',
          regId: '#MC-2026-8839',
          name: 'Dr. Elena Rostova, Sp.A(K)',
          initials: 'ER',
          avatarBg: 'bg-emerald-100 text-emerald-800',
          specialty: 'Pediatri Perawatan Intensif / PICU',
          specialtyCode: 'Sp.A(K)',
          deptFilter: 'Pediatri',
          departmentLabel: 'Divisi Pediatri Gawat Darurat',
          nip: '198803242014022001',
          nik: '3273240888000001',
          isNikUnmasked: false,
          slaStatus: 'ON_TRACK',
          slaTier: 'REGULER',
          str: '9833073462',
          submittedDate: '12 Nov 2026',
          strExpiry: '24 Maret 2029',
          validUntilLabel: 'Siklus 5 Thn: Habis 2029',
          email: 'elena.rostova@gmail.com',
          phone: '0812-8841-2019',
          qrSlug: 'dr-elena-rostova',
          pin: '892-019',
          clientType: 'B2C',
          clientOrg: 'Praktik Mandiri — Bandung, Jawa Barat',
          serviceType: 'Pembaruan STR 5 Tahunan & SKP Plataran Sehat',
          serviceCode: 'srv-str',
          pipelineStatus: 'submitted_instansi',
          pipelineLabel: 'Diajukan ke Kemenkes RI',
          pipelineBadgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          instansiTarget: 'Kemenkes RI (SatuSehat SDMK & KKI)',
          instansiRegNo: 'KMK-STR-2026-98334',
          picConcierge: 'Siti Rahma, S.Farm (Konsultan Senior)',
          picPhone: '0812-9988-7711',
          targetSla: '28 Nov 2026 (7 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Diajukan ke Kemenkes',
          criticalExpiry: false,
          credentials: [
            { title: '1. STR Dokter Spesialis', detail: 'No: 9833073462 • KKI & SatuSehat Valid', status: 'valid', fileName: 'STR_Elena_Rostova.pdf' },
            { title: '2. SIP 1 (Praktik Utama)', detail: 'No: 503/4412/SIP-DS/2024 (Valid s/d 2029)', status: 'valid', fileName: 'SIP1_Elena.pdf' },
            { title: '3. SIP 2 (Faskes Jejaring)', detail: 'RS Hermina Pasteur • Valid s/d 2028', status: 'valid', fileName: 'SIP2_Elena.pdf' },
            { title: '4. Ijazah Dokter Spesialis', detail: 'Spesialis Ilmu Kesehatan Anak Univ. Indonesia', status: 'valid', fileName: 'Ijazah_SpA_Elena.pdf' },
            { title: '5. Sertifikat Kolegium', detail: 'Kolegium Ilmu Kesehatan Anak Indonesia (IDAI)', status: 'valid', fileName: 'Serkom_IDAI_Elena.pdf' },
            { title: '6. Surat Sehat Fisik & Jiwa', detail: 'MCU RSUP Terakreditasi Paripurna', status: 'valid', fileName: 'SuratSehat_Elena.pdf' },
            { title: '7. Bukti SKP Plataran Sehat', detail: '250 SKP Pemenuhan 5 Tahunan Kemenkes', status: 'psv', fileName: 'SKP_Kemenkes_Elena.pdf' },
            { title: '8. Surat Bebas Narkoba', detail: 'Laboratorium BNN Terdaftar', status: 'valid', fileName: 'BNN_Elena_2026.pdf' },
            { title: '9. Log Book Tindakan 12 Bulan', detail: '342 Kasus PICU & Resusitasi Pediatri', status: 'valid', fileName: 'Logbook_PICU_Elena.pdf' }
          ],
          rkkItems: [
            { title: '1. Resusitasi Lanjut Pediatri (PALS) & Ventilasi Mekanik PICU', level: 'Kewenangan Mandiri (Level 4)' },
            { title: '2. Terapi Pengganti Ginjal Berkelanjutan (CRRT) pada Anak', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-marcus',
          regId: '#MC-2026-8841',
          name: 'Dr. Marcus Vance, Sp.BTKV',
          initials: 'MV',
          avatarBg: 'bg-blue-100 text-blue-800',
          specialty: 'Bedah Toraks Kardiovaskular',
          specialtyCode: 'Sp.BTKV',
          deptFilter: 'Bedah',
          departmentLabel: 'Departemen Ilmu Bedah',
          nip: '198009142006041002',
          nik: '3273240888000002',
          isNikUnmasked: false,
          slaStatus: 'WARNING',
          slaNote: 'Sisa 14 Jam Kerja Menuju Batas SLA Kemenkes',
          slaTier: 'EXPRESS',
          str: '5487239313',
          submittedDate: '15 Nov 2026',
          strExpiry: '14 September 2028',
          validUntilLabel: 'Siklus 5 Thn: Habis 2028',
          email: 'marcus.vance@gmail.com',
          phone: '0811-9043-4578',
          qrSlug: 'dr-marcus-vance',
          pin: '741-502',
          clientType: 'B2B',
          clientOrg: 'RS Citra Medika Jaringan Jabar',
          serviceType: 'Pemberkasan Kenaikan Jenjang Jabatan Fungsional (Jafung Madya)',
          serviceCode: 'srv-jafung',
          pipelineStatus: 'curation',
          pipelineLabel: 'Kurasi Berkas MedCred',
          pipelineBadgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          instansiTarget: 'Kemenkes RI & BKN',
          instansiRegNo: 'Menunggu Kurasi Selesai',
          picConcierge: 'dr. Dimas Prasetyo (Lead Concierge)',
          picPhone: '0812-1122-3344',
          targetSla: '5 Des 2026 (12 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Kurasi Berkas',
          criticalExpiry: false,
          credentials: [
            { title: '1. STR Dokter Spesialis', detail: 'No: 5487239313 • Valid KKI', status: 'valid', fileName: 'STR_Marcus.pdf' },
            { title: '2. SIP 1 (Rumah Sakit Utama)', detail: 'No: 449/0812/SIP-DS/2025', status: 'valid', fileName: 'SIP1_Marcus.pdf' },
            { title: '3. SIP 2 (Faskes Jejaring)', detail: 'Pusat Jantung Regional', status: 'valid', fileName: 'SIP2_Marcus.pdf' },
            { title: '4. Ijazah Dokter Spesialis', detail: 'Spesialis BTKV FK UI', status: 'valid', fileName: 'Ijazah_Marcus.pdf' },
            { title: '5. Portofolio DUPAK Jafung', detail: 'Angka Kredit Pelayanan Medis 450 Poin', status: 'psv', fileName: 'DUPAK_Marcus_2026.pdf' },
            { title: '6. Surat Sehat Fisik & Jiwa', detail: 'MCU Terdaftar Kemenkes', status: 'valid', fileName: 'MCU_Marcus.pdf' },
            { title: '7. Penilaian Kinerja Kemenkes', detail: 'SKP Predikat Sangat Baik 2 Tahun Terakhir', status: 'psv', fileName: 'SKP_Kinerja_Marcus.pdf' },
            { title: '8. Surat Bebas Narkoba', detail: 'Lab Terverifikasi BNN', status: 'valid', fileName: 'NAPZA_Marcus.pdf' },
            { title: '9. Log Book Tindakan 12 Bulan', detail: '194 Prosedur Bedah Toraks & Vaskular', status: 'valid', fileName: 'Logbook_Marcus.pdf' }
          ],
          rkkItems: [
            { title: '1. Bedah Pintas Arteri Koroner (CABG) & Katup Jantung', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-sophia',
          regId: '#MC-2026-8830',
          name: 'Dr. Sophia Al-Mansoor, Sp.An',
          initials: 'SA',
          avatarBg: 'bg-amber-100 text-amber-800',
          specialty: 'Anestesiologi & Terapi Intensif',
          specialtyCode: 'Sp.An',
          deptFilter: 'Bedah',
          departmentLabel: 'Instalasi Gawat Darurat & Bedah',
          nip: '198705122012042003',
          str: '6239104857',
          submittedDate: '10 Nov 2026',
          strExpiry: '12 Mei 2028',
          validUntilLabel: 'Siklus 5 Thn: Habis 2028',
          email: 'sophia.almansoor@gmail.com',
          phone: '0813-7729-1048',
          qrSlug: 'dr-sophia-al-mansoor',
          pin: '394-281',
          clientType: 'B2C',
          clientOrg: 'Praktik Mandiri — Surabaya, Jawa Timur',
          serviceType: 'Pengurusan Rekomendasi Kolegium & Sertifikat Kompetensi',
          serviceCode: 'srv-kolegium',
          pipelineStatus: 'need_revision',
          pipelineLabel: 'Perlu Revisi Dokter',
          pipelineBadgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          instansiTarget: 'Kolegium Anestesiologi & Kemenkes',
          instansiRegNo: 'TICKET-REV-2026-091',
          picConcierge: 'Siti Rahma, S.Farm (Konsultan Senior)',
          picPhone: '0812-9988-7711',
          targetSla: 'Menunggu Unggah Ulang Berkas Dokter',
          revisionNote: 'Scan Logbook Tindakan 2025 belum dilegalisir supervisor klinis. Mohon unggah ulang salinan bertanda tangan basah / barcode sah.',
          statusLabel: 'Perlu Revisi',
          criticalExpiry: false,
          credentials: [
            { title: '1. STR Dokter Spesialis', detail: 'No: 6239104857 • Terdaftar KKI', status: 'valid', fileName: 'STR_Sophia.pdf' },
            { title: '2. SIP 1 (Faskes Utama)', detail: 'No: 503/0912/SIP/2023', status: 'valid', fileName: 'SIP1_Sophia.pdf' },
            { title: '3. SIP 2 (Klinik Pratama)', detail: 'Klinik Surabaya Barat', status: 'valid', fileName: 'SIP2_Sophia.pdf' },
            { title: '4. Ijazah Dokter Spesialis', detail: 'Spesialis Anestesiologi FK UNAIR', status: 'valid', fileName: 'Ijazah_Sophia.pdf' },
            { title: '5. Logbook Resertifikasi', detail: 'PERLU REVISI: Belum dilegalisir supervisor', status: 'pending', fileName: '' },
            { title: '6. Surat Sehat Fisik & Jiwa', detail: 'MCU Terkini', status: 'valid', fileName: 'MCU_Sophia.pdf' },
            { title: '7. Portofolio Kasus Kritis', detail: '518 Kasus Resusitasi & Trauma', status: 'valid', fileName: 'Kasus_Sophia.pdf' },
            { title: '8. Surat Bebas Narkoba', detail: 'Lab Terakreditasi', status: 'valid', fileName: 'NAPZA_Sophia.pdf' },
            { title: '9. Log Book Tindakan 12 Bulan', detail: '518 Kasus Trauma & Sedasi', status: 'valid', fileName: 'Logbook_IGD_Sophia.pdf' }
          ],
          rkkItems: [
            { title: '1. Resusitasi Trauma Mayor & Sedasi Prosedural Kritis', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-bagus',
          regId: '#MC-2026-8824',
          name: 'Dr. Bagus Setiawan, Sp.An',
          initials: 'BS',
          avatarBg: 'bg-emerald-100 text-emerald-800',
          specialty: 'Anestesiologi & Terapi Intensif',
          specialtyCode: 'Sp.An',
          deptFilter: 'Bedah',
          departmentLabel: 'Instalasi Bedah Sentral & ICU',
          nip: '198607152011011005',
          str: '4561239874',
          submittedDate: '01 Nov 2026',
          strExpiry: '15 Juli 2029',
          validUntilLabel: 'Siklus 5 Thn: Habis 2029',
          email: 'bagus.setiawan@kliniksehat.id',
          phone: '0812-6619-9874',
          qrSlug: 'dr-bagus-setiawan',
          pin: '519-834',
          clientType: 'B2B',
          clientOrg: 'Klinik Pratama Sehat Bersama (Koordinator Mitra)',
          serviceType: 'Penerbitan SIP Baru & SIP Faskes Jejaring Dinkes',
          serviceCode: 'srv-sip',
          pipelineStatus: 'completed',
          pipelineLabel: 'Selesai & Izin Terbit',
          pipelineBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          instansiTarget: 'Dinas Kesehatan & DPMPTSP Kota Surabaya',
          instansiRegNo: 'DINKES-SIP-2026-4412',
          picConcierge: 'dr. Dimas Prasetyo (Lead Concierge)',
          picPhone: '0812-1122-3344',
          targetSla: 'Selesai & Dokumen Diserahkan',
          revisionNote: '',
          statusLabel: 'Selesai & Terbit',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: i === 0 ? 'No: 4561239874 • Valid KKI' : 'Dokumen Terverifikasi & Izin Resmi Terbit',
            status: 'valid',
            fileName: `${std.code}_Bagus_Setiawan_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Anestesi Umum & Regional Bedah Mayor', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-james',
          regId: '#MC-2026-8833',
          name: 'Dr. James Chan, Sp.Rad',
          initials: 'JC',
          avatarBg: 'bg-purple-100 text-purple-800',
          specialty: 'Radiologi Diagnostik & Intervensi',
          specialtyCode: 'Sp.Rad',
          deptFilter: 'Radiologi',
          departmentLabel: 'Instalasi Radiologi Terpadu',
          nip: '198411032009021004',
          nik: '3171051280000005',
          isNikUnmasked: false,
          slaStatus: 'WARNING',
          slaNote: 'Sisa 10 Jam Kerja Menuju Batas SLA KKI',
          slaTier: 'REGULER',
          str: '7821940381',
          submittedDate: '08 Nov 2026',
          strExpiry: '03 November 2028',
          validUntilLabel: 'Siklus 5 Thn: Habis 2028',
          email: 'james.chan@gmail.com',
          phone: '0811-3456-7890',
          qrSlug: 'dr-james-chan',
          pin: '612-409',
          clientType: 'B2B',
          clientOrg: 'RS Citra Medika Jaringan Jabar',
          serviceType: 'Pembaruan STR 5 Tahunan & SKP Plataran Sehat',
          serviceCode: 'srv-str',
          pipelineStatus: 'instansi_progress',
          pipelineLabel: 'Verifikasi Kemenkes Berjalan',
          pipelineBadgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          instansiTarget: 'Kemenkes RI & KKI',
          instansiRegNo: 'KMK-REG-2026-55912',
          picConcierge: 'Siti Rahma, S.Farm (Konsultan Senior)',
          picPhone: '0812-9988-7711',
          targetSla: '30 Nov 2026 (5 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Verifikasi Kemenkes',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Diajukan ke portal Kemenkes • Menunggu e-Sign',
            status: i < 7 ? 'valid' : 'psv',
            fileName: `${std.code}_James_Chan_2026.pdf`
          })),
          rkkItems: [
            { title: '1. CT-Scan Dual Energy & MRI Neuro / Abdomen', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-amara',
          regId: '#MC-2026-8818',
          name: 'Dr. Amara Okafor, Sp.PD-KGEH',
          initials: 'AO',
          avatarBg: 'bg-indigo-100 text-indigo-800',
          specialty: 'Penyakit Dalam - Gastroenterohepatologi',
          specialtyCode: 'Sp.PD-KGEH',
          deptFilter: 'PenyakitDalam',
          departmentLabel: 'Pusat Saluran Cerna & Hati',
          nip: '197906182005012002',
          str: '8910472915',
          submittedDate: '05 Nov 2026',
          strExpiry: '18 Juni 2027',
          validUntilLabel: 'Siklus 5 Thn: Habis 2027',
          email: 'amara.okafor@gmail.com',
          phone: '0812-4455-6677',
          qrSlug: 'dr-amara-okafor',
          pin: '784-129',
          clientType: 'B2C',
          clientOrg: 'Praktik Mandiri — Medan, Sumatera Utara',
          serviceType: 'Pemberkasan Kenaikan Jenjang Jabatan Fungsional (Jafung Utama)',
          serviceCode: 'srv-jafung',
          pipelineStatus: 'submitted_instansi',
          pipelineLabel: 'Diajukan ke Kemenkes RI',
          pipelineBadgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          instansiTarget: 'Kemenkes RI & Biro Kepegawaian',
          instansiRegNo: 'KMK-JAFUNG-2026-1188',
          picConcierge: 'dr. Dimas Prasetyo (Lead Concierge)',
          picPhone: '0812-1122-3344',
          targetSla: '10 Des 2026 (15 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Diajukan ke Kemenkes',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Berkas Jafung Utama terkurasi • Dalam proses Kemenkes',
            status: 'valid',
            fileName: `${std.code}_Amara_Okafor_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Endoskopi Terapeutik (ERCP / EUS) Saluran Cerna', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
{
          id: 'doc-hendra',
          regId: '#MC-2026-8812',
          name: 'Dr. Hendra Wijaya, Sp.OT',
          initials: 'HW',
          avatarBg: 'bg-teal-100 text-teal-800',
          specialty: 'Ortopedi & Traumatologi Rekonstruksi',
          specialtyCode: 'Sp.OT',
          deptFilter: 'Bedah',
          departmentLabel: 'Departemen Bedah Ortopedi',
          nip: '198205102008031003',
          str: '3341890214',
          submittedDate: '16 Nov 2026',
          strExpiry: '10 Mei 2029',
          validUntilLabel: 'Siklus 5 Thn: Habis 2029',
          email: 'hendra.wijaya@gmail.com',
          phone: '0812-3490-8812',
          qrSlug: 'dr-hendra-wijaya',
          pin: '451-920',
          clientType: 'B2B',
          clientOrg: 'RS Citra Medika Jaringan Jabar',
          serviceType: 'Pembaruan STR 5 Tahunan & SKP Plataran Sehat',
          serviceCode: 'srv-str',
          pipelineStatus: 'curation',
          pipelineLabel: 'Kurasi Berkas MedCred',
          pipelineBadgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          instansiTarget: 'Kemenkes RI (SatuSehat SDMK)',
          instansiRegNo: 'Menunggu Kurasi Selesai',
          picConcierge: 'Siti Rahma, S.Farm (Konsultan Senior)',
          picPhone: '0812-9988-7711',
          targetSla: '02 Des 2026 (10 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Kurasi Berkas',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Pemeriksaan kelengkapan dokumen perpanjangan STR',
            status: i < 6 ? 'valid' : 'psv',
            fileName: `${std.code}_Hendra_Wijaya_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Artroplasti Panggul & Lutut Total', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-ratna',
          regId: '#MC-2026-8805',
          name: 'Dr. Ratna Dewi Kartika, Sp.OG',
          initials: 'RD',
          avatarBg: 'bg-pink-100 text-pink-800',
          specialty: 'Obstetri & Ginekologi Fetomaternal',
          specialtyCode: 'Sp.OG',
          deptFilter: 'Obstetri',
          departmentLabel: 'Klinik Ibu & Anak',
          nip: '198509122010022004',
          str: '9182304912',
          submittedDate: '14 Nov 2026',
          strExpiry: '12 September 2027',
          validUntilLabel: 'Siklus 5 Thn: Habis 2027',
          email: 'ratna.dewi@kliniksehat.id',
          phone: '0813-8821-4433',
          qrSlug: 'dr-ratna-dewi',
          pin: '318-772',
          clientType: 'B2B',
          clientOrg: 'Klinik Pratama Sehat Bersama',
          serviceType: 'Penerbitan SIP Baru & SIP Faskes Jejaring Dinkes',
          serviceCode: 'srv-sip',
          pipelineStatus: 'submitted_instansi',
          pipelineLabel: 'Diajukan ke Dinkes Kota',
          pipelineBadgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          instansiTarget: 'Dinas Kesehatan & DPMPTSP',
          instansiRegNo: 'DINKES-SIP-2026-8805',
          picConcierge: 'dr. Dimas Prasetyo (Lead Concierge)',
          picPhone: '0812-1122-3344',
          targetSla: '29 Nov 2026 (8 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Diajukan ke Dinkes',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Berkas permohonan SIP telah diajukan ke Dinkes',
            status: i < 8 ? 'valid' : 'pending',
            fileName: `${std.code}_Ratna_Dewi_2026.pdf`
          })),
          rkkItems: [
            { title: '1. USG Fetomaternal & Penanganan Kehamilan Risiko Tinggi', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-bambang',
          regId: '#MC-2026-8798',
          name: 'Dr. Bambang Sutrisno, Sp.JP(K)',
          initials: 'BS',
          avatarBg: 'bg-red-100 text-red-800',
          specialty: 'Kardiologi & Kedokteran Vaskular Intervensi',
          specialtyCode: 'Sp.JP(K)',
          deptFilter: 'Kardiologi',
          departmentLabel: 'Pusat Jantung & Vaskular',
          nip: '197604112002011001',
          str: '5129038471',
          submittedDate: '28 Okt 2026',
          strExpiry: '11 April 2029',
          validUntilLabel: 'Siklus 5 Thn: Habis 2029',
          email: 'bambang.sutrisno@gmail.com',
          phone: '0811-2345-6789',
          qrSlug: 'dr-bambang-sutrisno',
          pin: '883-412',
          clientType: 'B2C',
          clientOrg: 'Praktik Mandiri — Jakarta Pusat, DKI',
          serviceType: 'Pemberkasan Kenaikan Jenjang Jabatan Fungsional (Jafung Utama)',
          serviceCode: 'srv-jafung',
          pipelineStatus: 'completed',
          pipelineLabel: 'Selesai & SK Jafung Terbit',
          pipelineBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          instansiTarget: 'Kemenkes RI & BKN',
          instansiRegNo: 'SK-JAFUNG-2026-0041',
          picConcierge: 'dr. Dimas Prasetyo (Lead Concierge)',
          picPhone: '0812-1122-3344',
          targetSla: 'Selesai & SK Diterbitkan',
          revisionNote: '',
          statusLabel: 'Selesai & Terbit',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Dokumen SK Jafung Utama resmi terverifikasi BKN',
            status: 'valid',
            fileName: `${std.code}_Bambang_Sutrisno_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Intervensi Koroner Perkutan (PCI) Kompleks', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-nadia',
          regId: '#MC-2026-8790',
          name: 'Dr. Nadia Fitria, Sp.THT-BKL',
          initials: 'NF',
          avatarBg: 'bg-orange-100 text-orange-800',
          specialty: 'Telinga Hidung Tenggorok Bedah Kepala Leher',
          specialtyCode: 'Sp.THT-BKL',
          deptFilter: 'THT',
          departmentLabel: 'Klinik Spesialis THT Terpadu',
          nip: '198902182015032002',
          str: '6719283401',
          submittedDate: '11 Nov 2026',
          strExpiry: '18 Februari 2028',
          validUntilLabel: 'Siklus 5 Thn: Habis 2028',
          email: 'nadia.fitria@gmail.com',
          phone: '0813-9088-1277',
          qrSlug: 'dr-nadia-fitria',
          pin: '190-845',
          clientType: 'B2C',
          clientOrg: 'Praktik Mandiri — Jakarta Selatan, DKI',
          serviceType: 'Pembaruan STR 5 Tahunan & SKP Plataran Sehat',
          serviceCode: 'srv-str',
          pipelineStatus: 'need_revision',
          pipelineLabel: 'Perlu Revisi Dokter',
          pipelineBadgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          instansiTarget: 'Kemenkes RI (SatuSehat SDMK)',
          instansiRegNo: 'TICKET-REV-2026-104',
          picConcierge: 'Siti Rahma, S.Farm (Konsultan Senior)',
          picPhone: '0812-9988-7711',
          targetSla: 'Menunggu Perbaikan Berkas SKP',
          revisionNote: 'Sertifikat SKP Ranah A (Pelayanan) kurang 12 poin. Mohon lampirkan sertifikat workshop terakreditasi Kemenkes terbaru.',
          statusLabel: 'Perlu Revisi',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: i === 6 ? 'REVISI: SKP Plataran Sehat belum mencukupi' : 'Dokumen terunggah',
            status: i === 6 ? 'pending' : (i < 6 ? 'valid' : 'psv'),
            fileName: i === 6 ? '' : `${std.code}_Nadia_Fitria_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Bedah Sinus Endoskopi Fungsional (BSEF / FESS)', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-faisal',
          regId: '#MC-2026-8785',
          name: 'Dr. Faisal Rahman, Sp.M',
          initials: 'FR',
          avatarBg: 'bg-cyan-100 text-cyan-800',
          specialty: 'Kesehatan Mata / Vitreoretina',
          specialtyCode: 'Sp.M',
          deptFilter: 'Mata',
          departmentLabel: 'Instalasi Bedah Mata & Vitreoretina',
          nip: '198308222009011002',
          str: '7728190345',
          submittedDate: '25 Okt 2026',
          strExpiry: '22 Agustus 2029',
          validUntilLabel: 'Siklus 5 Thn: Habis 2029',
          email: 'faisal.rahman@matanusantara.id',
          phone: '0812-8877-6655',
          qrSlug: 'dr-faisal-rahman',
          pin: '448-219',
          clientType: 'B2B',
          clientOrg: 'Klinik Utama Mata Nusantara',
          serviceType: 'Penerbitan SIP Baru & SIP Faskes Jejaring Dinkes',
          serviceCode: 'srv-sip',
          pipelineStatus: 'completed',
          pipelineLabel: 'Selesai & Izin Terbit',
          pipelineBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          instansiTarget: 'Dinas Kesehatan Kota Bekasi',
          instansiRegNo: 'DINKES-SIP-2026-3391',
          picConcierge: 'dr. Dimas Prasetyo (Lead Concierge)',
          picPhone: '0812-1122-3344',
          targetSla: 'Selesai & Dokumen Diserahkan',
          revisionNote: '',
          statusLabel: 'Selesai & Terbit',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Dokumen izin SIP resmi telah terbit dari Dinkes',
            status: 'valid',
            fileName: `${std.code}_Faisal_Rahman_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Vitrektomi Pars Plana & Fakoemulsifikasi Katarak', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-clara',
          regId: '#MC-2026-8779',
          name: 'Dr. Clara Stephanie, Sp.D.V.E',
          initials: 'CS',
          avatarBg: 'bg-violet-100 text-violet-800',
          specialty: 'Dermatologi, Venereologi & Estetika',
          specialtyCode: 'Sp.D.V.E',
          deptFilter: 'KulitKelamin',
          departmentLabel: 'Klinik Spesialis Dermatologi',
          nip: '198711042012022005',
          str: '8839201476',
          submittedDate: '09 Nov 2026',
          strExpiry: '04 November 2028',
          validUntilLabel: 'Siklus 5 Thn: Habis 2028',
          email: 'clara.stephanie@gmail.com',
          phone: '0811-7788-9900',
          qrSlug: 'dr-clara-stephanie',
          pin: '761-304',
          clientType: 'B2C',
          clientOrg: 'Praktik Mandiri — Denpasar, Bali',
          serviceType: 'Pengurusan Rekomendasi Kolegium & Sertifikat Kompetensi',
          serviceCode: 'srv-kolegium',
          pipelineStatus: 'submitted_instansi',
          pipelineLabel: 'Diajukan ke Kolegium PERDOSKI',
          pipelineBadgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          instansiTarget: 'Kolegium D.V.E Indonesia (PERDOSKI)',
          instansiRegNo: 'KLG-REC-2026-0921',
          picConcierge: 'Siti Rahma, S.Farm (Konsultan Senior)',
          picPhone: '0812-9988-7711',
          targetSla: '04 Des 2026 (11 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Diajukan ke Kolegium',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Pengajuan Serkom Kolegium PERDOSKI',
            status: i < 7 ? 'valid' : 'psv',
            fileName: `${std.code}_Clara_Stephanie_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Terapi Laser Dermatologi & Bedah Kulit Minor', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-yusuf',
          regId: '#MC-2026-8762',
          name: 'Dr. Yusuf Iskandar, Sp.BS',
          initials: 'YI',
          avatarBg: 'bg-blue-100 text-blue-900',
          specialty: 'Bedah Saraf Onkologi & Vaskular',
          specialtyCode: 'Sp.BS',
          deptFilter: 'Bedah',
          departmentLabel: 'Departemen Bedah Saraf',
          nip: '198103192007011003',
          str: '4920183742',
          submittedDate: '17 Nov 2026',
          strExpiry: '19 Maret 2029',
          validUntilLabel: 'Siklus 5 Thn: Habis 2029',
          email: 'yusuf.iskandar@rsbedah.co.id',
          phone: '0812-4433-2211',
          qrSlug: 'dr-yusuf-iskandar',
          pin: '820-194',
          clientType: 'B2B',
          clientOrg: 'RS Khusus Bedah Regional Jabar',
          serviceType: 'Pemberkasan Kenaikan Jenjang Jabatan Fungsional (Jafung Madya)',
          serviceCode: 'srv-jafung',
          pipelineStatus: 'curation',
          pipelineLabel: 'Kurasi Berkas MedCred',
          pipelineBadgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          instansiTarget: 'Kemenkes RI & BKN',
          instansiRegNo: 'Menunggu Kurasi Selesai',
          picConcierge: 'dr. Dimas Prasetyo (Lead Concierge)',
          picPhone: '0812-1122-3344',
          targetSla: '08 Des 2026 (14 Hari Kerja)',
          revisionNote: '',
          statusLabel: 'Kurasi Berkas',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'Validasi portofolio DUPAK Jafung Madya',
            status: i < 6 ? 'valid' : 'psv',
            fileName: `${std.code}_Yusuf_Iskandar_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Kraniotomi Tumor Saraf & Kliping Aneurisma Serebral', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        },
        {
          id: 'doc-maya',
          regId: '#MC-2026-8750',
          name: 'Dr. Maya Indah Lestari, Sp.KJ',
          initials: 'MI',
          avatarBg: 'bg-emerald-100 text-emerald-800',
          specialty: 'Kedokteran Jiwa (Psikiatri Komunitas)',
          specialtyCode: 'Sp.KJ',
          deptFilter: 'Psikiatri',
          departmentLabel: 'Instalasi Kesehatan Jiwa',
          nip: '198601142011022003',
          str: '9018274635',
          submittedDate: '20 Okt 2026',
          strExpiry: '14 Januari 2029',
          validUntilLabel: 'Siklus 5 Thn: Habis 2029',
          email: 'maya.indah@gmail.com',
          phone: '0813-2211-5544',
          qrSlug: 'dr-maya-indah',
          pin: '654-912',
          clientType: 'B2C',
          clientOrg: 'Praktik Mandiri — Yogyakarta, D.I.Y',
          serviceType: 'Pembaruan STR 5 Tahunan & SKP Plataran Sehat',
          serviceCode: 'srv-str',
          pipelineStatus: 'completed',
          pipelineLabel: 'Selesai & e-STR Terbit',
          pipelineBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          instansiTarget: 'Kemenkes RI (SatuSehat SDMK & KKI)',
          instansiRegNo: 'KMK-STR-2026-88190',
          picConcierge: 'Siti Rahma, S.Farm (Konsultan Senior)',
          picPhone: '0812-9988-7711',
          targetSla: 'Selesai & e-STR Terbit',
          revisionNote: '',
          statusLabel: 'Selesai & Terbit',
          criticalExpiry: false,
          credentials: CREDENTIAL_STANDARDS.map((std, i) => ({
            title: std.title,
            detail: 'e-STR Kemenkes/KKI resmi diperpanjang s/d 2029',
            status: 'valid',
            fileName: `${std.code}_Maya_Indah_2026.pdf`
          })),
          rkkItems: [
            { title: '1. Psikoterapi Intensif & Penanganan Kedaruratan Psikiatri', level: 'Kewenangan Mandiri (Level 4)' }
          ]
        }
      ],
      auditLogs: [
        {
          timestamp: '19 Nov 2026 14:20:12',
          actor: 'Siti Rahma, S.Farm (Konsultan Senior)',
          category: 'Pengajuan Kemenkes RI',
          badgeClass: 'bg-indigo-100 text-indigo-800',
          target: 'Dr. Elena Rostova, Sp.A(K) (#MC-2026-8839)',
          details: 'Mengajukan berkas perpanjangan STR 5 tahunan & SKP Plataran Sehat ke portal SatuSehat SDMK Kemenkes (Resi #KMK-STR-2026-98334).'
        },
        {
          timestamp: '19 Nov 2026 11:45:00',
          actor: 'dr. Dimas Prasetyo (Lead Concierge)',
          category: 'Permintaan Revisi Dokter',
          badgeClass: 'bg-amber-100 text-amber-800',
          target: 'Dr. Sophia Al-Mansoor, Sp.An (#MC-2026-8830)',
          details: 'Mengirimkan catatan kurasi revisi logbook tindakan belum berlegalisir supervisor via notifikasi WhatsApp concierge.'
        },
        {
          timestamp: '19 Nov 2026 09:30:15',
          actor: 'Sistem Sinkronisasi Kemenkes/KKI',
          category: 'Penerbitan Izin Resmi',
          badgeClass: 'bg-emerald-100 text-emerald-800',
          target: 'Dr. Bagus Setiawan, Sp.An (#MC-2026-8824)',
          details: 'Surat Izin Praktik (SIP) baru dari Dinkes Kota Surabaya berhasil terbit & diteruskan ke koordinator Klinik Pratama Sehat Bersama.'
        }
      ]
    };

// State Persistence with localStorage
function loadInitialState() {
  try {
    const saved = localStorage.getItem('MEDCRED_STATE_V3');
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = Object.assign({}, DEFAULT_STATE, parsed);
      if (!merged.settingsData) {
        merged.settingsData = JSON.parse(JSON.stringify(DEFAULT_STATE.settingsData));
      }
      return merged;
    }
  } catch (e) {
    console.warn('Could not load state from localStorage:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

const state = loadInitialState();

function saveState() {
  try {
    localStorage.setItem('MEDCRED_STATE_V3', JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save state to localStorage:', e);
  }
}

function resetAllState() {
  try {
    localStorage.removeItem('MEDCRED_STATE_V3');
    window.location.reload();
  } catch (e) {
    console.warn('Could not reset state:', e);
  }
}

// =============================================================================
// CORE DOMAIN HELPERS
// =============================================================================

function getDocCompletion(doc) {
      if (!doc || !Array.isArray(doc.credentials)) {
        return { total: 9, validCount: 0, psvCount: 0, pendingCount: 9, pct: 0, isComplete: false };
      }
      const total = doc.credentials.length;
      const validCount = doc.credentials.filter(c => c.status === 'valid').length;
      const psvCount = doc.credentials.filter(c => c.status === 'psv').length;
      const pendingCount = doc.credentials.filter(c => c.status === 'pending').length;
      const pct = Math.round((validCount / total) * 100);
      return { total, validCount, psvCount, pendingCount, pct, isComplete: validCount === total };
    }

    function getStatusBadgeHtml(doc) {
      if (doc.pipelineStatus === 'cancelled') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Dibatalkan (Cancelled)
        </span>`;
      }
      if (doc.pipelineStatus === 'completed') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#006948] text-[10px] font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-[#006948]"></span> Selesai &amp; Terbit
        </span>`;
      }
      if (doc.pipelineStatus === 'submitted_instansi') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span> Diajukan ke Kemenkes
        </span>`;
      }
      if (doc.pipelineStatus === 'instansi_progress') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span> Verifikasi Instansi
        </span>`;
      }
      if (doc.pipelineStatus === 'need_revision') {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Perlu Revisi Dokter
        </span>`;
      }
      return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Kurasi Berkas MedCred
      </span>`;
    }

    function generateDeterministicQrSvg(seedText) {
      const str = String(seedText || 'MEDCRED-QR');
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const cells = [];
      for (let r = 0; r < 11; r++) {
        for (let c = 0; c < 11; c++) {
          const inTopLeft = r < 3 && c < 3;
          const inTopRight = r < 3 && c > 7;
          const inBottomLeft = r > 7 && c < 3;
          if (inTopLeft || inTopRight || inBottomLeft) continue;
          const bit = ((Math.abs(hash) >> ((r * 11 + c) % 24)) ^ (r * 7 + c * 13)) & 1;
          if (bit === 1) {
            cells.push(`<rect x="${10 + c * 7.2}" y="${10 + r * 7.2}" width="6" height="6" rx="1" fill="#0f172a" />`);
          }
        }
      }
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full rounded-lg bg-white" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
          <rect x="8" y="8" width="22" height="22" rx="3" fill="none" stroke="#006948" stroke-width="4" />
          <rect x="14" y="14" width="10" height="10" rx="1.5" fill="#006948" />
          <rect x="70" y="8" width="22" height="22" rx="3" fill="none" stroke="#006948" stroke-width="4" />
          <rect x="76" y="14" width="10" height="10" rx="1.5" fill="#006948" />
          <rect x="8" y="70" width="22" height="22" rx="3" fill="none" stroke="#006948" stroke-width="4" />
          <rect x="14" y="76" width="10" height="10" rx="1.5" fill="#006948" />
          ${cells.join('')}
        </svg>
      `;
    }

function addAuditEntry(actor, category, badgeClass, target, details) {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const timestamp = `19 Nov 2026 ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      state.auditLogs.unshift({ timestamp, actor, category, badgeClass, target, details });
    }

    // =========================================================================
    // NAVIGATION, DRAWER, DROPDOWNS & LOGIN/LOGOUT (ANTI-CLICK-BLOCKING)
    // =========================================================================
