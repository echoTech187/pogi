// =============================================================================
// MEDCRED CONCIERGE - SHARED APPLICATION SHELL & CONTROLLER (js/app.js)
// =============================================================================

// --- 1. TOAST NOTIFICATION & CLIPBOARD SYSTEM ---
function showToast(title, message, type = 'success') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const borderClass = type === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-950' :
                          type === 'info' ? 'border-blue-200 bg-white text-slate-900' :
                          'border-emerald-300 bg-white text-slate-900';
      const iconName = type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'check_circle';
      const iconColor = type === 'warning' ? 'text-amber-600' : type === 'info' ? 'text-blue-600' : 'text-[#006948]';

      const toast = document.createElement('div');
      toast.className = `pointer-events-auto p-3.5 rounded-2xl border shadow-lg ${borderClass} flex items-start gap-2.5 text-xs transition-all duration-200`;
      toast.innerHTML = `
        <span class="material-symbols-outlined text-lg ${iconColor} shrink-0 mt-0.5 fill">${iconName}</span>
        <div class="min-w-0 flex-1">
          <div class="font-extrabold">${title}</div>
          <div class="text-[11px] text-slate-600 mt-0.5 leading-snug">${message}</div>
        </div>
      `;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 220);
      }, 3600);
    }

    function copyTextSafe(text, label = 'Tautan') {
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast(`${label} Berhasil Disalin`, text, 'success');
      } catch (err) {
        showToast(`Salin ${label}`, text, 'info');
      }
    }

// --- 2. DRAWER & MODAL UI TOGGLES ---
function toggleMobileSidebar(forceState) {
      const sidebar = document.getElementById('appSidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (!sidebar || !overlay) return;

      const isCurrentlyOpen = !sidebar.classList.contains('-translate-x-full');
      const shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;

      if (shouldOpen) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden', 'pointer-events-none');
        document.body.classList.add('overflow-hidden');
      } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden', 'pointer-events-none');
        document.body.classList.remove('overflow-hidden');
      }
    }

    function toggleUserDropdown(forceState) {
      const dd = document.getElementById('userDropdown');
      if (!dd) return;
      const isHidden = dd.classList.contains('hidden');
      const shouldShow = typeof forceState === 'boolean' ? forceState : isHidden;
      if (shouldShow) {
        dd.classList.remove('hidden', 'pointer-events-none');
      } else {
        dd.classList.add('hidden', 'pointer-events-none');
      }
    }

    function toggleMobileSearchBar(forceState) {
      const drawer = document.getElementById('mobileSearchDrawer');
      if (!drawer) return;
      const isHidden = drawer.classList.contains('hidden');
      const shouldShow = typeof forceState === 'boolean' ? forceState : isHidden;
      if (shouldShow) {
        drawer.classList.remove('hidden');
        document.getElementById('mobileGlobalSearchInput')?.focus();
      } else {
        drawer.classList.add('hidden');
      }
    }

function toggleOrgScopeDropdown(forceState = null) {
      const dd = document.getElementById('orgScopeDropdown');
      if (!dd) return;
      if (forceState !== null) {
        if (forceState) dd.classList.remove('hidden');
        else dd.classList.add('hidden');
      } else {
        dd.classList.toggle('hidden');
      }
    }

    function selectOrgScope(scope) {
      toggleOrgScopeDropdown(false);
      const label = document.getElementById('selectedOrgScopeLabel');
      if (scope === 'b2c') {
        state.clientSegmentFilter = 'B2C';
        if (label) label.textContent = 'Jalur B2C Dokter Mandiri (92)';
        showToast('Lingkup Terfilter: B2C', 'Menampilkan permohonan dokter mandiri perorangan di 38 provinsi.', 'info');
      } else if (scope === 'b2b') {
        state.clientSegmentFilter = 'B2B';
        if (label) label.textContent = 'Jalur B2B Mitra Faskes (56)';
        showToast('Lingkup Terfilter: B2B', 'Menampilkan berkas dokter mitra klinik, faskes & RS swasta.', 'info');
      } else {
        state.clientSegmentFilter = 'ALL';
        if (label) label.textContent = 'Semua Wilayah Nasional (148)';
        showToast('Lingkup Nasional', 'Menampilkan seluruh dokter mandiri (B2C) & mitra faskes (B2B).', 'info');
      }
      state.dashboardTablePage = 1;
      renderDashboardTable();
    }

    function selectPartnerScope(partnerId) {
      toggleOrgScopeDropdown(false);
      const partner = state.partners.find(p => p.id === partnerId);
      const label = document.getElementById('selectedOrgScopeLabel');
      if (partner) {
        state.clientSegmentFilter = 'B2B';
        if (label) label.textContent = partner.name;
        showToast('Mitra Dipilih: ' + partner.name, `Memfilter dokter binaan ${partner.name} (${partner.city}).`, 'info');
      }
      state.dashboardTablePage = 1;
      renderDashboardTable();
    }

function toggleNotificationDropdown(forceState = null) {
      const dd = document.getElementById('notificationDropdown');
      if (!dd) return;
      if (forceState !== null) {
        if (forceState) dd.classList.remove('hidden');
        else dd.classList.add('hidden');
      } else {
        dd.classList.toggle('hidden');
      }
    }

    function markAllNotificationsRead() {
      const badge = document.getElementById('headerNotificationBadge');
      if (badge) badge.classList.add('hidden');
      showToast('Notifikasi Ditandai Dibaca', 'Seluruh pemberitahuan operasional concierge telah ditandai.', 'success');
      toggleNotificationDropdown(false);
    }

// --- 3. ROLE SWITCHING & AUTHENTICATION STATE ---
function applyRoleAccessUI(role) {
  const isDoctor = role === 'doctor';
  const isPartner = role === 'partner';
  const user = state.currentUser;

  const brandSub = document.getElementById('sidebarBrandSubtitle');
  if (brandSub) {
    if (isDoctor) brandSub.textContent = 'PORTAL MANDIRI DOKTER (B2C)';
    else if (isPartner) brandSub.textContent = 'PORTAL MITRA KLINIK (B2B)';
    else brandSub.textContent = 'OPERASIONAL CONCIERGE NASIONAL';
  }

  renderSidebarNav();

  const botAvatar = document.getElementById('sidebarBottomAvatar');
  const botName = document.getElementById('sidebarBottomName');
  const botRole = document.getElementById('sidebarBottomRole');
  if (botAvatar && botName && botRole) {
    if (isDoctor && user) {
      botAvatar.textContent = user.initials || 'DR';
      botAvatar.className = `w-9 h-9 rounded-full ${user.avatarBg || 'bg-emerald-100 text-emerald-800'} font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-emerald-100`;
      botName.textContent = user.name;
      botRole.textContent = 'DOKTER MANDIRI (B2C)';
    } else if (isPartner && user) {
      botAvatar.textContent = user.initials || 'KP';
      botAvatar.className = `w-9 h-9 rounded-full ${user.avatarBg || 'bg-amber-100 text-amber-800'} font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-amber-100`;
      botName.textContent = user.name;
      botRole.textContent = 'MITRA KLINIK & FASKES (B2B)';
    } else {
      botAvatar.textContent = 'SR';
      botAvatar.className = 'w-9 h-9 rounded-full bg-[#006948] text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-emerald-100';
      botName.textContent = 'Siti Rahma, S.Farm';
      botRole.textContent = 'LEAD CONCIERGE PERIZINAN';
    }
  }

  const topAvatar = document.getElementById('headerTopAvatar');
  const ddName = document.getElementById('dropdownUserName');
  const ddRole = document.getElementById('dropdownUserRole');
  if (topAvatar && ddName && ddRole) {
    if (isDoctor && user) {
      topAvatar.textContent = user.initials || 'DR';
      topAvatar.className = `w-8 h-8 rounded-full ${user.avatarBg || 'bg-emerald-100 text-emerald-800'} font-bold text-xs flex items-center justify-center shadow-xs`;
      ddName.textContent = user.name;
      ddRole.textContent = user.title || 'Dokter Spesialis';
    } else if (isPartner && user) {
      topAvatar.textContent = user.initials || 'KP';
      topAvatar.className = `w-8 h-8 rounded-full ${user.avatarBg || 'bg-amber-100 text-amber-800'} font-bold text-xs flex items-center justify-center shadow-xs`;
      ddName.textContent = user.name;
      ddRole.textContent = user.title || 'Koordinator Mitra Faskes';
    } else {
      topAvatar.textContent = 'SR';
      topAvatar.className = 'w-8 h-8 rounded-full bg-[#006948] text-white font-bold text-xs flex items-center justify-center shadow-xs';
      ddName.textContent = 'Siti Rahma, S.Farm';
      ddRole.textContent = 'Lead Concierge Perizinan & Kredensial';
    }
  }

  document.querySelectorAll('.dropdown-admin-item').forEach(el => {
    el.classList.toggle('hidden', isDoctor || isPartner);
  });
  document.querySelectorAll('.dropdown-doctor-item').forEach(el => {
    el.classList.toggle('hidden', !isDoctor);
  });
}

function quickLoginAs(roleKey) {
  if (roleKey === 'admin') {
    state.currentUser = {
      id: 'user-siti',
      name: 'Siti Rahma, S.Farm',
      role: 'admin',
      roleLabel: 'LEAD CONCIERGE PERIZINAN & KREDENSIAL',
      badge: 'Admin Concierge Nasional',
      avatarBg: 'bg-[#006948]'
    };
    saveState();
    showToast('Beralih Peran: Admin', 'Masuk sebagai Siti Rahma (Lead Concierge Perizinan).', 'success');
    window.location.href = 'index.html';
  } else if (roleKey === 'doctor') {
    const docElena = state.doctors.find(d => d.id === 'doc-elena') || state.doctors[0];
    state.currentUser = {
      role: 'doctor',
      doctorId: docElena.id,
      name: docElena.name,
      title: docElena.specialty,
      str: docElena.str,
      regId: docElena.regId,
      initials: 'ER',
      avatarBg: 'bg-emerald-100 text-emerald-800'
    };
    state.selectedDoctorId = docElena.id;
    state.qrPortalDoctorId = docElena.id;
    saveState();
    showToast('Beralih Peran: Dokter', `Masuk sebagai ${docElena.name} (Dokter Mandiri B2C).`, 'success');
    window.location.href = 'qr-portal.html';
  } else if (roleKey === 'partner') {
    const docBagus = state.doctors.find(d => d.id === 'doc-bagus') || state.doctors[3];
    state.currentUser = {
      role: 'partner',
      partnerId: 'part-1',
      doctorId: docBagus.id,
      name: 'dr. Bagus Setiawan (PIC Klinik)',
      title: 'Koordinator Klinik Pratama Sehat Bersama',
      str: docBagus.str,
      regId: 'MITRA-B2B-01',
      initials: 'KP',
      avatarBg: 'bg-amber-100 text-amber-800'
    };
    state.selectedDoctorId = docBagus.id;
    state.clientSegmentFilter = 'b2b';
    saveState();
    showToast('Beralih Peran: Mitra Faskes', 'Masuk sebagai PIC Klinik Pratama Sehat Bersama (B2B).', 'success');
    window.location.href = 'partners.html';
  }
}

function performLogout() {
  toggleMobileSidebar(false);
  toggleUserDropdown(false);
  state.currentUser = null;
  saveState();
  window.location.href = 'login.html';
}

function handleBottomProfileClick() {
  const role = state.currentUser?.role || 'admin';
  if (role === 'doctor') {
    quickLoginAs('admin');
  } else if (role === 'admin') {
    quickLoginAs('partner');
  } else {
    quickLoginAs('doctor');
  }
}

// --- 4. MULTI-PAGE NAVIGATION & ROUTING ---
const APP_NAV_CONFIG = [
  { id: 'dashboard', href: 'index.html', icon: 'grid_view', label: 'Ringkasan Utama' },
  { id: 'doctors', href: 'doctors.html', icon: 'group', label: 'Daftar Klien Dokter (B2C & B2B)' },
  { id: 'psv', href: 'curation.html', icon: 'verified_user', label: 'Kurasi Berkas ke Kemenkes' },
  { id: 'compliance', href: 'partners.html', icon: 'folder_shared', label: 'Mitra Klinik & Faskes (B2B)' },
  { id: 'audit', href: 'audit.html', icon: 'receipt_long', label: 'Log Operasional & Instansi' },
  { id: 'committee', href: 'catalog.html', icon: 'clinical_notes', label: 'Katalog Layanan & SPK Instansi' },
  { id: 'invoicing', href: 'invoicing.html', icon: 'payments', label: 'Penagihan & Faktur' },
  { id: 'commissions', href: 'commissions.html', icon: 'account_balance_wallet', label: 'Komisi Agen & PIC' },
  { id: 'settings', href: 'settings.html', icon: 'settings', label: 'Integrasi API Instansi' }
];

function renderSidebarNav(activePage) {
  const container = document.getElementById('sidebarNavContainer');
  if (!container) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const role = state.currentUser?.role || 'admin';
  const isDoctor = role === 'doctor';
  const isPartner = role === 'partner';
  const doc = (isDoctor || isPartner) ? (state.doctors.find(d => d.id === state.currentUser?.doctorId) || state.doctors[0]) : null;

  if (isDoctor && doc) {
    container.innerHTML = `
      <div class="px-3 mb-2.5 text-[10px] font-bold tracking-wider text-[#006948] uppercase flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>PORTAL DOKTER MANDIRI (B2C)</span>
      </div>
      <nav class="space-y-1">
        <a href="qr-portal.html" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'qr-portal.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">
          <span class="material-symbols-outlined text-[18px] pointer-events-none shrink-0">upload_file</span>
          <span class="pointer-events-none truncate whitespace-nowrap">Form Unggah Berkas</span>
        </a>
        <a href="doctor-detail.html?id=${encodeURIComponent(doc.id)}" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'doctor-detail.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">
          <span class="material-symbols-outlined text-[18px] pointer-events-none shrink-0">assignment_turned_in</span>
          <span class="pointer-events-none truncate whitespace-nowrap">Status Pengurusan Saya</span>
        </a>
        <a href="catalog.html?id=${encodeURIComponent(doc.id)}" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'catalog.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">
          <span class="material-symbols-outlined text-[18px] pointer-events-none shrink-0">clinical_notes</span>
          <span class="pointer-events-none truncate whitespace-nowrap">Kewenangan Klinis (SPK/RKK)</span>
        </a>
      </nav>
      <div class="mt-6 pt-4 border-t border-slate-100">
        <div class="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-950 text-[11px] leading-relaxed">
          <div class="font-bold flex items-center gap-1.5 text-[#006948] mb-1">
            <span class="material-symbols-outlined text-sm">support_agent</span>
            <span>Concierge Aktif</span>
          </div>
          Pendampingan berkas Anda sedang ditangani oleh <strong>Siti Rahma, S.Farm</strong>.
        </div>
      </div>
    `;
    return;
  }

  if (isPartner && doc) {
    container.innerHTML = `
      <div class="px-3 mb-2.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span>PORTAL MITRA FASKES (B2B)</span>
      </div>
      <nav class="space-y-1">
        <a href="partners.html" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'partners.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">
          <span class="material-symbols-outlined text-[18px] pointer-events-none shrink-0">corporate_fare</span>
          <span class="pointer-events-none truncate whitespace-nowrap">Dashboard Faskes & Kuota</span>
        </a>
        <a href="doctors.html" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'doctors.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">
          <span class="material-symbols-outlined text-[18px] pointer-events-none shrink-0">group</span>
          <span class="pointer-events-none truncate whitespace-nowrap">Daftar Dokter Faskes</span>
        </a>
        <a href="invoicing.html" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'invoicing.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">
          <span class="material-symbols-outlined text-[18px] pointer-events-none shrink-0">receipt</span>
          <span class="pointer-events-none truncate whitespace-nowrap">Tagihan Kolektif B2B</span>
        </a>
        <a href="catalog.html" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'catalog.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">
          <span class="material-symbols-outlined text-[18px] pointer-events-none shrink-0">clinical_notes</span>
          <span class="pointer-events-none truncate whitespace-nowrap">Katalog Layanan & SPK</span>
        </a>
      </nav>
    `;
    return;
  }

  // Default Admin Concierge Navigation
  let navHtml = `
    <div class="px-3 mb-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
      OPERASIONAL CONCIERGE NASIONAL
    </div>
    <nav class="space-y-1">
  `;

  APP_NAV_CONFIG.forEach(item => {
    const isActive = (activePage && item.id === activePage) || currentPath === item.href;
    const activeClass = isActive 
      ? 'bg-[#006948] text-white shadow-xs font-semibold active' 
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium';
    navHtml += `
      <a href="${item.href}" id="nav-${item.id}" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition ${activeClass}">
        <span class="material-symbols-outlined text-[18px] pointer-events-none">${item.icon}</span>
        <span class="pointer-events-none truncate">${item.label}</span>
      </a>
    `;
  });

  navHtml += `
    </nav>
    <div class="mt-6 pt-4 border-t border-slate-100">
      <div class="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        PORTAL ONBOARDING MANDIRI
      </div>
      <a href="qr-portal.html" id="nav-qr-portal" onclick="toggleMobileSidebar(false)" class="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${currentPath === 'qr-portal.html' ? 'bg-[#006948] text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/70'}">
        <span class="material-symbols-outlined text-[18px] text-[#006948] pointer-events-none">qr_code_2</span>
        <span class="pointer-events-none truncate">Form Registrasi &amp; QR Dokter</span>
      </a>
    </div>
  `;

  container.innerHTML = navHtml;
}

function switchView(viewName) {
  const map = {
    'dashboard': 'index.html',
    'doctors': 'doctors.html',
    'doctor-detail': 'doctor-detail.html',
    'psv': 'curation.html',
    'compliance': 'partners.html',
    'audit': 'audit.html',
    'committee': 'catalog.html',
    'settings': 'settings.html',
    'invoicing': 'invoicing.html',
    'commissions': 'commissions.html',
    'qr-portal': 'qr-portal.html'
  };
  const target = map[viewName] || 'index.html';
  saveState();
  const current = window.location.pathname.split('/').pop() || 'index.html';
  if (current !== target) {
    window.location.href = target;
  }
}

function openDoctorDetail(doctorId) {
  if (state.currentUser?.role === 'doctor') {
    state.selectedDoctorId = state.currentUser.doctorId;
  } else if (doctorId) {
    state.selectedDoctorId = doctorId;
  }
  saveState();
  window.location.href = `doctor-detail.html?id=${encodeURIComponent(state.selectedDoctorId)}`;
}

function openDoctorRkk(doctorId) {
  if (state.currentUser?.role === 'doctor') {
    state.committeeDoctorId = state.currentUser.doctorId;
  } else if (doctorId) {
    state.committeeDoctorId = doctorId;
  }
  saveState();
  window.location.href = `catalog.html?id=${encodeURIComponent(state.committeeDoctorId)}`;
}

function openPsvForDoctor(doctorId) {
  if (state.currentUser?.role === 'doctor') {
    showToast('Akses Terbatas', 'Fitur PSV adalah wewenang Komite Medik.', 'warning');
    return;
  }
  if (doctorId) state.psvDoctorId = doctorId;
  state.psvMobileTab = 'preview';
  saveState();
  window.location.href = `curation.html?id=${encodeURIComponent(state.psvDoctorId)}`;
}

function openQrSelfPortal(doctorId, mode = 'existing') {
  if (doctorId) state.qrPortalDoctorId = doctorId;
  saveState();
  window.location.href = `qr-portal.html?id=${encodeURIComponent(doctorId || '')}&mode=${encodeURIComponent(mode)}`;
}

// --- 5. SHARED MODALS CONTROLLERS & EVENT BINDINGS ---
function openQrModal(doctorId = null) {
      if (doctorId) {
        state.qrModalDoctorId = doctorId;
      } else if (!state.qrModalDoctorId) {
        state.qrModalDoctorId = state.doctors[1]?.id || state.doctors[0]?.id;
      }
      renderQrModalContent();
      const modal = document.getElementById('qrGeneratorModal');
      if (modal) {
        modal.classList.remove('hidden', 'pointer-events-none');
      }
    }

    function closeQrModal() {
      const modal = document.getElementById('qrGeneratorModal');
      if (modal) {
        modal.classList.add('hidden', 'pointer-events-none');
      }
    }

    function renderQrModalContent() {
      const body = document.getElementById('qrModalBody');
      if (!body) return;
      const doc = state.doctors.find(d => d.id === state.qrModalDoctorId) || state.doctors[0];
      const qrUrl = `https://kredensial.rsud.go.id/unggah/${doc.qrSlug}`;
      const qrSvg = generateDeterministicQrSvg(qrUrl + doc.pin);

      body.innerHTML = `
        <div>
          <label class="block font-bold text-slate-700 mb-1.5">Pilih Dokter Penerima Tautan QR Code:</label>
          <select onchange="state.qrModalDoctorId=this.value; renderQrModalContent();" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#006948]">
            ${state.doctors.map(d => `<option value="${d.id}" ${d.id === doc.id ? 'selected' : ''}>${d.regId} — ${d.name} (${d.specialty})</option>`).join('')}
          </select>
        </div>

        <div class="p-4 rounded-2xl bg-gradient-to-br from-[#022b1f] to-[#006948] text-white flex flex-col sm:flex-row items-center gap-4">
          <div class="bg-white p-3 rounded-xl w-36 shrink-0 text-center">
            <div class="w-30 h-30 mx-auto">${qrSvg}</div>
            <div class="text-[10px] font-bold text-slate-800 mt-1.5">PIN: <span class="font-mono text-[#006948] font-extrabold">${doc.pin}</span></div>
          </div>
          <div class="space-y-2 text-center sm:text-left min-w-0 flex-1">
            <span class="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-emerald-200">TAUTAN QR TERENKRIPSI</span>
            <div class="text-sm font-extrabold">${doc.name}</div>
            <div class="text-[11px] text-emerald-100/85">Kirimkan tautan atau gambar QR Code ini ke WhatsApp/Email dokter bersangkutan untuk pendaftaran &amp; melengkapi dokumen.</div>
            <div class="bg-slate-950/60 border border-emerald-400/30 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-emerald-200 break-all">
              ${qrUrl}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" onclick="copyTextSafe('${qrUrl} (PIN: ${doc.pin})', 'Tautan & PIN QR Dokter')" class="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition">
            <span class="material-symbols-outlined text-sm">content_copy</span> Salin Link &amp; PIN
          </button>
          <button type="button" onclick="closeQrModal(); openMassReminderModal('${doc.id}');" class="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006948] rounded-xl font-bold flex items-center justify-center gap-1.5 transition">
            <span class="material-symbols-outlined text-sm">send</span> Kirim via WhatsApp/Email
          </button>
        </div>
      `;
    }

    function launchQrPortalFromModal() {
      const targetId = state.qrModalDoctorId || state.doctors[0].id;
      closeQrModal();
      openQrSelfPortal(targetId, 'existing');
    }

    // =========================================================================
    // VIEW 2: DETAIL BERKAS & PROFIL DOKTER (#view-doctor-detail)
    // =========================================================================

function openMassReminderModal(doctorId = null) {
      state.reminderTargetDoctorId = doctorId;
      document.getElementById('reminderSuccessNotice')?.classList.add('hidden');
      const titleEl = document.getElementById('modalRecipientTitle');
      const subEl = document.getElementById('modalRecipientSubtitle');
      const salutationEl = document.getElementById('modalPreviewSalutation');
      const urlEl = document.getElementById('modalPreviewUrl');

      if (doctorId) {
        const doc = state.doctors.find(d => d.id === doctorId);
        if (doc) {
          if (titleEl) titleEl.textContent = doc.name;
          if (subEl) subEl.textContent = `${doc.phone} • ${doc.email} (PIN QR: ${doc.pin})`;
          if (salutationEl) salutationEl.textContent = `Yth. ${doc.name},`;
          if (urlEl) urlEl.textContent = `https://kredensial.rsud.go.id/unggah/${doc.qrSlug}`;
        }
      } else {
        if (titleEl) titleEl.textContent = '107 Dokter Belum Lengkap';
        if (subEl) subEl.textContent = 'Status berkas kurang dari 100%';
        if (salutationEl) salutationEl.textContent = 'Yth. Teman Sejawat Dokter RSUD Regional,';
        if (urlEl) urlEl.textContent = 'https://kredensial.rsud.go.id/unggah';
      }
      const modal = document.getElementById('massReminderModal');
      if (modal) {
        modal.classList.remove('hidden', 'pointer-events-none');
      }
    }

    function closeMassReminderModal() {
      const modal = document.getElementById('massReminderModal');
      if (modal) {
        modal.classList.add('hidden', 'pointer-events-none');
      }
    }

    function submitMassReminder() {
      const notice = document.getElementById('reminderSuccessNotice');
      const txt = document.getElementById('reminderSuccessText');
      if (state.reminderTargetDoctorId) {
        const doc = state.doctors.find(d => d.id === state.reminderTargetDoctorId);
        if (txt && doc) txt.textContent = `Tautan QR & pengingat berhasil dikirim ke ${doc.name}!`;
      } else if (txt) {
        txt.textContent = 'Notifikasi & tautan QR berhasil disiarkan ke 107 dokter belum lengkap!';
      }
      notice?.classList.remove('hidden');
      setTimeout(() => {
        closeMassReminderModal();
        showToast('Notifikasi Terkirim', txt ? txt.textContent : 'Pengingat berhasil dikirim.', 'success');
      }, 850);
    }

    // =========================================================================
    // INTERACTIVE CONTROLS & MODALS (SCOPE, NOTIFICATION, B2B, RECOVERY, ALERTS)
    // =========================================================================

function openUrgentExpiryModal() {
      const alert = document.getElementById('urgentSuccessAlert');
      if (alert) alert.classList.add('hidden');
      const btn = document.getElementById('btnExecuteUrgentAlerts');
      if (btn) btn.disabled = false;
      const modal = document.getElementById('urgentExpiryModal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeUrgentExpiryModal() {
      const modal = document.getElementById('urgentExpiryModal');
      if (modal) modal.classList.add('hidden');
    }

    function executeSendUrgentAlerts() {
      const btn = document.getElementById('btnExecuteUrgentAlerts');
      const alert = document.getElementById('urgentSuccessAlert');
      if (btn) btn.disabled = true;

      addAuditEntry(
        'Siti Rahma, S.Farm (Lead Concierge)',
        'Peringatan Mendesak STR/SIP (<30 Hari)',
        'bg-amber-100 text-amber-800',
        '7 Dokter Masa Berlaku Kritis',
        'Disiarkan otomatis via WhatsApp Blast & Email Pengingat beserta tautan QR mandiri.'
      );

      if (alert) alert.classList.remove('hidden');
      setTimeout(() => {
        closeUrgentExpiryModal();
        showToast('Peringatan Berhasil Disiarkan', 'Notifikasi WhatsApp & email tautan QR terkirim ke 7 dokter masa berlaku kritis.', 'success');
      }, 1000);
    }

    // =========================================================================
    // EVENT DELEGATION & INITIALIZATION
    // =========================================================================

    document.addEventListener('click', (e) => {
      // Event delegation for sidebar navigation items using data-nav-view
      const navTrigger = e.target.closest('[data-nav-view]');
      if (navTrigger) {
        const targetView = navTrigger.getAttribute('data-nav-view');
        if (targetView === 'qr-portal') {
          openQrSelfPortal('doc-elena', 'existing');
        } else if (targetView) {
          switchView(targetView);
        }
        return;
      }

      // Close user dropdown if clicking outside
      const dd = document.getElementById('userDropdown');
      const trigger = dd?.parentElement;
      if (trigger && !trigger.contains(e.target) && dd && !dd.classList.contains('hidden')) {
        toggleUserDropdown(false);
      }

      // Close notification dropdown if clicking outside
      const notifDd = document.getElementById('notificationDropdown');
      const notifTrigger = notifDd?.parentElement;
      if (notifTrigger && !notifTrigger.contains(e.target) && notifDd && !notifDd.classList.contains('hidden')) {
        toggleNotificationDropdown(false);
      }

      // Close org scope dropdown if clicking outside
      const scopeDd = document.getElementById('orgScopeDropdown');
      const scopeTrigger = scopeDd?.parentElement;
      if (scopeTrigger && !scopeTrigger.contains(e.target) && scopeDd && !scopeDd.classList.contains('hidden')) {
        toggleOrgScopeDropdown(false);
      }
    });


    // =========================================================================
    // MODUL 6: PENAGIHAN & INVOICING (B2C & B2B)
    // =========================================================================

function openUnmaskNikModal(docId) {
      state.unmaskingDoctorId = docId;
      const doc = state.doctors.find(d => d.id === docId);
      if (!doc) return;

      const nikValEl = document.getElementById('unmaskedNikValue');
      const docNameEl = document.getElementById('unmaskedDocName');
      if (nikValEl) nikValEl.textContent = doc.nik || '3273240888000001';
      if (docNameEl) docNameEl.textContent = `${doc.name} (${doc.specialty})`;

      // Catat ke Auth Audit Logs sesuai UU PDP
      addAuditEntry(
        'Siti Rahma, S.Farm (Konsultan)',
        'SENSITIVE_NIK_VIEW',
        'bg-amber-100 text-amber-900',
        `${doc.name} (NIK: ${doc.nik || '3273240888000001'})`,
        'Membuka data NIK terdekripsi dengan izin docs:view_sensitive_nik sesuai UU PDP No. 27/2022.'
      );

      doc.isNikUnmasked = true;

      const modal = document.getElementById('unmaskNikModal');
      if (modal) modal.classList.remove('hidden', 'pointer-events-none');
    }

    function closeUnmaskNikModal() {
      const doc = state.doctors.find(d => d.id === state.unmaskingDoctorId);
      if (doc) doc.isNikUnmasked = false;
      state.unmaskingDoctorId = null;

      const modal = document.getElementById('unmaskNikModal');
      if (modal) modal.classList.add('hidden', 'pointer-events-none');

      if (state.currentView === 'doctor-detail') renderDoctorDetailView();
    }

    // 3. Presigned Object Storage URL (15 Menit) Refresh

function openCancelTicketModal(docId) {
      state.cancellingDoctorId = docId;
      const doc = state.doctors.find(d => d.id === docId);
      if (!doc) return;

      const infoEl = document.getElementById('cancelModalDocInfo');
      if (infoEl) infoEl.textContent = `${doc.regId} — ${doc.name} (${doc.serviceType})`;

      const modal = document.getElementById('cancelTicketModal');
      if (modal) modal.classList.remove('hidden', 'pointer-events-none');
    }

    function closeCancelTicketModal() {
      state.cancellingDoctorId = null;
      const modal = document.getElementById('cancelTicketModal');
      if (modal) modal.classList.add('hidden', 'pointer-events-none');
    }

    function submitCancelTicket(e) {
      e.preventDefault();
      const doc = state.doctors.find(d => d.id === state.cancellingDoctorId);
      if (!doc) return;

      const reason = document.getElementById('cancelReasonSelect')?.value || 'Dibatalkan oleh pemohon';
      const notes = document.getElementById('cancelReasonNotes')?.value.trim() || 'Pembatalan disetujui operasional';
      const triggerRefund = document.getElementById('cancelTriggerRefund')?.checked || false;

      doc.pipelineStatus = 'cancelled';
      doc.pipelineLabel = 'Dibatalkan (Cancelled)';
      doc.pipelineBadgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
      doc.cancelReason = reason;
      doc.cancelNotes = notes;

      addAuditEntry(
        'Siti Rahma, S.Farm (Lead Concierge)',
        'Pembatalan Tiket Pengurusan',
        'bg-rose-100 text-rose-800',
        `${doc.name} (${doc.regId})`,
        `Alasan: ${reason}. Catatan: ${notes} (Ticket State Machine RULES.md Bagian 2)`
      );

      // Jika ada refund & komisi terkait, catat Clawback
      if (triggerRefund) {
        state.commissions.push({
          id: 'COM-2026-' + Math.floor(200 + Math.random() * 100),
          date: new Date().toLocaleDateString('id-ID'),
          agentName: 'Koordinator Wilayah / Mitra Lapangan',
          agentRole: 'REFERRAL_AGENT',
          agentArea: 'Penyesuaian Nasional',
          doctorName: `${doc.name} (Tiket Dibatalkan)`,
          ticketRef: doc.regId,
          grossAmount: -500000,
          taxPph: -25000,
          netAmount: -475000,
          bankAccount: 'Penyesuaian Kas Internal',
          status: 'CLAWBACK',
          payoutDate: 'Hari ini (Penyesuaian Debit)'
        });
      }

      closeCancelTicketModal();
      showToast('Tiket Berhasil Dibatalkan', `Tiket ${doc.regId} telah dibatalkan resmi dan dicatat di riwayat audit.`, 'warning');

      // Update badge counter if exists
      const counterEl = document.getElementById('countDashCancelled');
      if (counterEl) {
        counterEl.textContent = state.doctors.filter(d => d.pipelineStatus === 'cancelled').length;
      }

      if (state.currentView === 'doctor-detail') {
        renderDoctorDetailView();
      } else {
        renderDashboardTable();
      }
    }

    // 2. Kepatuhan UU PDP No. 27/2022 (Data Masking & Unmasking NIK)

function openAddCustomDocModal() {
      const modal = document.getElementById('addCustomDocModal');
      const inputTitle = document.getElementById('inputNewDocTitle');
      const inputLabel = document.getElementById('newDocFileLabel');
      const inputFile = document.getElementById('inputNewDocFile');
      if (inputTitle) inputTitle.value = '';
      if (inputFile) inputFile.value = '';
      if (inputLabel) inputLabel.textContent = 'Klik untuk pilih file PDF / Foto';
      if (modal) modal.classList.remove('hidden', 'pointer-events-none');
    }

    function closeAddCustomDocModal() {
      const modal = document.getElementById('addCustomDocModal');
      if (modal) modal.classList.add('hidden', 'pointer-events-none');
    }

    function handleNewDocFileChange(input) {
      const label = document.getElementById('newDocFileLabel');
      if (input && input.files && input.files[0]) {
        if (label) label.textContent = `File dipilih: ${input.files[0].name}`;
      }
    }

    function submitNewCustomDoc(e) {
      e.preventDefault();
      const title = document.getElementById('inputNewDocTitle')?.value.trim();
      const category = document.getElementById('selectNewDocCategory')?.value || 'Sertifikat Tambahan';
      const fileInput = document.getElementById('inputNewDocFile');
      if (!title) return;

      const { doc } = getActiveQrPortalTarget();
      if (!doc) return;

      const uploadedFile = fileInput?.files?.[0];
      const fileName = uploadedFile ? uploadedFile.name : `${title.replace(/\\s+/g, '_')}_2026.pdf`;
      const fileSize = uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';

      doc.credentials.push({
        title: title,
        detail: `${category} • Diunggah mandiri via QR`,
        status: 'psv',
        fileName: fileName,
        fileSize: fileSize,
        uploadedAt: '19 Nov 2026',
        isCustom: true
      });

      closeAddCustomDocModal();
      showToast('Dokumen Ditambahkan', `${title} (${fileName}) berhasil ditambahkan ke berkas kredensial.`, 'success');
      renderQrPortalView();
    }

    function previewCredentialDocument(title, fileName) {
      const modal = document.getElementById('previewDocModal');
      const titleEl = document.getElementById('previewDocModalTitle');
      const fileEl = document.getElementById('previewDocFileName');
      if (titleEl) titleEl.textContent = title || 'Pratinjau Dokumen';
      if (fileEl) fileEl.textContent = fileName || 'salinan_dokumen.pdf';
      if (modal) modal.classList.remove('hidden', 'pointer-events-none');
    }

    function closePreviewDocModal() {
      const modal = document.getElementById('previewDocModal');
      if (modal) modal.classList.add('hidden', 'pointer-events-none');
    }

function previewCredentialDocument(title, fileName) {
      const modal = document.getElementById('previewDocModal');
      const titleEl = document.getElementById('previewDocModalTitle');
      const fileEl = document.getElementById('previewDocFileName');
      if (titleEl) titleEl.textContent = title || 'Pratinjau Dokumen';
      if (fileEl) fileEl.textContent = fileName || 'salinan_dokumen.pdf';
      if (modal) modal.classList.remove('hidden', 'pointer-events-none');
    }

    function closePreviewDocModal() {
      const modal = document.getElementById('previewDocModal');
      if (modal) modal.classList.add('hidden', 'pointer-events-none');
    }

// --- 6. INJECT SHARED MODALS INTO DOM ---
const SHARED_MODALS_HTML = "<div id=\"qrGeneratorModal\" class=\"fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden pointer-events-none flex items-center justify-center p-3 sm:p-4\">\n    <div class=\"bg-white rounded-2xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden\">\n      <div class=\"p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80 shrink-0\">\n        <div class=\"flex items-center gap-2.5 min-w-0\">\n          <div class=\"w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0\">\n            <span class=\"material-symbols-outlined text-xl\">qr_code_2</span>\n          </div>\n          <div class=\"min-w-0\">\n            <h3 class=\"text-sm font-extrabold text-slate-900 truncate\">Generator Tautan &amp; QR Code Dokter</h3>\n            <p class=\"text-[10px] text-slate-500 truncate\">Kirimkan QR Code terenkripsi ke dokter untuk pendaftaran &amp; unggah berkas</p>\n          </div>\n        </div>\n        <button type=\"button\" onclick=\"closeQrModal()\" class=\"text-slate-400 hover:text-slate-600 p-2 rounded-lg\">\n          <span class=\"material-symbols-outlined text-lg\">close</span>\n        </button>\n      </div>\n\n      <div id=\"qrModalBody\" class=\"p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1\"></div>\n\n      <div class=\"p-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0\">\n        <button type=\"button\" onclick=\"closeQrModal()\" class=\"px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 text-center\">\n          Tutup\n        </button>\n        <button type=\"button\" onclick=\"launchQrPortalFromModal()\" class=\"px-4 py-2.5 bg-[#006948] hover:bg-[#005137] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5\">\n          <span class=\"material-symbols-outlined text-sm\">smartphone</span>\n          <span>Simulasi Scan QR (Form Dokter)</span>\n        </button>\n      </div>\n    </div>\n  </div>\n<div id=\"massReminderModal\" class=\"fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden pointer-events-none flex items-center justify-center p-3 sm:p-4\">\n    <div class=\"bg-white rounded-2xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden\">\n      <div class=\"p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70 shrink-0\">\n        <div class=\"flex items-center gap-2.5 min-w-0\">\n          <div class=\"w-8 h-8 rounded-lg bg-emerald-100 text-[#006948] flex items-center justify-center shrink-0\">\n            <span class=\"material-symbols-outlined text-lg\">outgoing_mail</span>\n          </div>\n          <div class=\"min-w-0\">\n            <h3 class=\"text-sm font-bold text-slate-900 truncate\">Konfirmasi Pengiriman Pengingat &amp; Tautan QR</h3>\n            <p class=\"text-[10px] text-slate-500 truncate\">Notifikasi WhatsApp &amp; Email Terdaftar SIMRS</p>\n          </div>\n        </div>\n        <button type=\"button\" onclick=\"closeMassReminderModal()\" class=\"text-slate-400 hover:text-slate-600 p-2 rounded-lg\">\n          <span class=\"material-symbols-outlined text-lg\">close</span>\n        </button>\n      </div>\n\n      <div class=\"p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1\">\n        <div class=\"bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2\">\n          <div>\n            <div class=\"text-[10px] text-[#006948] font-bold uppercase\">Sasaran Penerima</div>\n            <div id=\"modalRecipientTitle\" class=\"text-base font-black text-emerald-950\">107 Dokter Belum Lengkap</div>\n            <div id=\"modalRecipientSubtitle\" class=\"text-[10px] text-emerald-800\">Status berkas kurang dari 100%</div>\n          </div>\n          <div class=\"sm:text-right\">\n            <div class=\"text-[10px] text-slate-500\">Saluran Resmi</div>\n            <div class=\"text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5 sm:justify-end\">\n              <span class=\"w-2 h-2 rounded-full bg-emerald-600\"></span> WhatsApp &amp; Email RS\n            </div>\n          </div>\n        </div>\n\n        <div>\n          <label class=\"block text-slate-700 font-bold text-xs mb-1\">Pratinjau Pesan &amp; Tautan QR:</label>\n          <div class=\"p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1 leading-relaxed\">\n            <div id=\"modalPreviewSalutation\" class=\"font-semibold text-slate-800\">Yth. Teman Sejawat Dokter RSUD Regional,</div>\n            <div>Mohon melengkapi berkas kredensial STR/SIP Anda melalui tautan QR mandiri aman berikut: <span id=\"modalPreviewUrl\" class=\"text-[#006948] font-mono underline break-all\">https://kredensial.rsud.go.id/unggah</span>. Terima kasih atas kepatuhan standar akreditasi KARS.</div>\n          </div>\n        </div>\n\n        <div id=\"reminderSuccessNotice\" class=\"hidden p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2\">\n          <span class=\"material-symbols-outlined text-[#006948] shrink-0\">check_circle</span>\n          <span id=\"reminderSuccessText\">Notifikasi berhasil dikirimkan!</span>\n        </div>\n      </div>\n\n      <div class=\"p-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0\">\n        <button type=\"button\" onclick=\"closeMassReminderModal()\" class=\"px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 text-center\">\n          Batal\n        </button>\n        <button id=\"btnSubmitReminder\" type=\"button\" onclick=\"submitMassReminder()\" class=\"px-5 py-2.5 bg-[#006948] hover:bg-[#005137] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5\">\n          <span class=\"material-symbols-outlined text-sm\">send</span> Konfirmasi &amp; Kirim Notifikasi\n        </button>\n      </div>\n    </div>\n  </div>\n<div id=\"urgentExpiryModal\" class=\"hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity\">\n    <div class=\"bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200\">\n      <div class=\"p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50\">\n        <div class=\"flex items-center gap-2.5\">\n          <div class=\"w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs\">\n            <span class=\"material-symbols-outlined text-xl\">warning</span>\n          </div>\n          <div>\n            <h3 class=\"text-sm font-extrabold text-amber-950\">Siarkan 7 Peringatan Mendesak (&lt; 30 Hari)</h3>\n            <p class=\"text-[10px] text-amber-800\">Otomatisasi pengingat STR &amp; SIP mendekati kedaluwarsa beserta tautan QR mandiri</p>\n          </div>\n        </div>\n        <button type=\"button\" onclick=\"closeUrgentExpiryModal()\" class=\"text-amber-800 hover:text-amber-950 p-1.5 rounded-lg\">\n          <span class=\"material-symbols-outlined text-lg\">close</span>\n        </button>\n      </div>\n      <div class=\"p-5 space-y-4 text-xs overflow-y-auto flex-1\">\n        <div class=\"p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed\">\n          <strong>Pemberitahuan Sistem Otomatis:</strong> Terdapat 7 dokter dengan masa berlaku izin yang akan habis dalam waktu kurang dari 30 hari. Sistem akan mengirimkan notifikasi prioritas melalui WhatsApp &amp; Email resmi dengan menyertakan tautan langsung ke formulir unggah perpanjangan.\n        </div>\n        <div>\n          <label class=\"block font-bold text-slate-800 mb-1.5\">Daftar 7 Dokter Masa Berlaku Kritis:</label>\n          <div class=\"border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto\">\n            <div class=\"p-2.5 hover:bg-slate-50 flex items-center justify-between\">\n              <div>\n                <div class=\"font-bold text-slate-900\">Dr. Elena Rostova, Sp.A(K)</div>\n                <div class=\"text-[10px] text-slate-500\">STR Spesialis Anak \u2022 Habis: 15 Des 2026</div>\n              </div>\n              <span class=\"px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold\">14 Hari Lagi</span>\n            </div>\n            <div class=\"p-2.5 hover:bg-slate-50 flex items-center justify-between\">\n              <div>\n                <div class=\"font-bold text-slate-900\">dr. Hendra Wijaya, Sp.JP</div>\n                <div class=\"text-[10px] text-slate-500\">SIP Faskes 1 Utama \u2022 Habis: 22 Des 2026</div>\n              </div>\n              <span class=\"px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold\">21 Hari Lagi</span>\n            </div>\n            <div class=\"p-2.5 hover:bg-slate-50 flex items-center justify-between\">\n              <div>\n                <div class=\"font-bold text-slate-900\">Dr. Sophia Al-Mansoor, Sp.An</div>\n                <div class=\"text-[10px] text-slate-500\">SIP Jejaring Klinik 2 \u2022 Habis: 18 Des 2026</div>\n              </div>\n              <span class=\"px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold\">17 Hari Lagi</span>\n            </div>\n            <div class=\"p-2.5 hover:bg-slate-50 flex items-center justify-between\">\n              <div>\n                <div class=\"font-bold text-slate-900\">dr. Amara Okafor, Sp.PD-KGEH</div>\n                <div class=\"text-[10px] text-slate-500\">STR Konsultan Subspesialis \u2022 Habis: 27 Des 2026</div>\n              </div>\n              <span class=\"px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold\">26 Hari Lagi</span>\n            </div>\n            <div class=\"p-2.5 hover:bg-slate-50 flex items-center justify-between\">\n              <div>\n                <div class=\"font-bold text-slate-900\">dr. Maya Indah, Sp.OG</div>\n                <div class=\"text-[10px] text-slate-500\">SIP Faskes Jejaring \u2022 Habis: 12 Des 2026</div>\n              </div>\n              <span class=\"px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold\">11 Hari Lagi</span>\n            </div>\n            <div class=\"p-2.5 hover:bg-slate-50 flex items-center justify-between\">\n              <div>\n                <div class=\"font-bold text-slate-900\">dr. Rudi Hartono, Sp.B</div>\n                <div class=\"text-[10px] text-slate-500\">STR Bedah Umum \u2022 Habis: 10 Des 2026</div>\n              </div>\n              <span class=\"px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold\">9 Hari Lagi</span>\n            </div>\n            <div class=\"p-2.5 hover:bg-slate-50 flex items-center justify-between\">\n              <div>\n                <div class=\"font-bold text-slate-900\">dr. James Chan, Sp.Rad</div>\n                <div class=\"text-[10px] text-slate-500\">SIP Rumah Sakit \u2022 Habis: 29 Des 2026</div>\n              </div>\n              <span class=\"px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold\">28 Hari Lagi</span>\n            </div>\n          </div>\n        </div>\n        <div>\n          <label class=\"block font-bold text-slate-800 mb-1\">Saluran Pengiriman Peringatan:</label>\n          <div class=\"grid grid-cols-2 gap-2 text-xs\">\n            <label class=\"flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold cursor-pointer\">\n              <input type=\"checkbox\" checked class=\"text-[#006948] rounded focus:ring-[#006948]\">\n              <span class=\"flex items-center gap-1\"><span class=\"material-symbols-outlined text-sm text-[#006948]\">chat</span> WhatsApp Broadcast</span>\n            </label>\n            <label class=\"flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold cursor-pointer\">\n              <input type=\"checkbox\" checked class=\"text-[#006948] rounded focus:ring-[#006948]\">\n              <span class=\"flex items-center gap-1\"><span class=\"material-symbols-outlined text-sm text-blue-600\">mail</span> Email Pengingat</span>\n            </label>\n          </div>\n        </div>\n        <div id=\"urgentSuccessAlert\" class=\"hidden p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006948] text-xs font-bold flex items-center gap-2\">\n          <span class=\"material-symbols-outlined text-base\">check_circle</span>\n          <span>7 Peringatan &amp; tautan QR mandiri sukses disiarkan ke WhatsApp &amp; Email dokter!</span>\n        </div>\n      </div>\n      <div class=\"p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2\">\n        <button type=\"button\" onclick=\"closeUrgentExpiryModal()\" class=\"px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs\">Batal</button>\n        <button type=\"button\" id=\"btnExecuteUrgentAlerts\" onclick=\"executeSendUrgentAlerts()\" class=\"px-4 py-2 bg-[#7c4d03] hover:bg-[#633c02] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5\">\n          <span class=\"material-symbols-outlined text-sm\">send</span> Kirim 7 Peringatan Sekarang\n        </button>\n      </div>\n    </div>\n  </div>\n<div id=\"unmaskNikModal\" class=\"fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden pointer-events-none flex items-center justify-center p-3 sm:p-4\">\n    <div class=\"bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden\">\n      <div class=\"p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-amber-50/80\">\n        <div class=\"flex items-center gap-2.5\">\n          <div class=\"w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0\">\n            <span class=\"material-symbols-outlined text-lg\">security</span>\n          </div>\n          <div>\n            <h3 class=\"text-sm font-bold text-slate-900\">Verifikasi Izin Akses NIK</h3>\n            <p class=\"text-[10px] text-slate-500\">Kepatuhan UU PDP No. 27/2022</p>\n          </div>\n        </div>\n        <button type=\"button\" onclick=\"closeUnmaskNikModal()\" class=\"text-slate-400 hover:text-slate-600 p-2 rounded-lg\">\n          <span class=\"material-symbols-outlined text-lg\">close</span>\n        </button>\n      </div>\n\n      <div class=\"p-5 space-y-4 text-xs\">\n        <div class=\"p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] leading-relaxed space-y-1\">\n          <div class=\"font-bold flex items-center gap-1 text-amber-900\">\n            <span class=\"material-symbols-outlined text-sm\">info</span> Peringatan Data Sensitif Terenkripsi\n          </div>\n          <p>NIK adalah data pribadi terlindungi. Membuka data NIK membutuhkan hak akses <code>docs:view_sensitive_nik</code>. Pembacaan ini dicatat di <code>auth_audit_logs</code> dengan event <strong>SENSITIVE_NIK_VIEW</strong>.</p>\n        </div>\n\n        <div class=\"p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1 font-mono\">\n          <div class=\"text-[10px] text-slate-400 uppercase font-sans font-bold\">NIK Terdekripsi (AES-256):</div>\n          <div id=\"unmaskedNikValue\" class=\"text-base font-extrabold text-[#006948] tracking-wider\">3273240888000001</div>\n          <div id=\"unmaskedDocName\" class=\"text-[10px] text-slate-500 font-sans mt-0.5\">Dr. Elena Rostova, Sp.A(K)</div>\n        </div>\n\n        <div class=\"flex items-center justify-end gap-2 pt-2 border-t border-slate-100\">\n          <button type=\"button\" onclick=\"closeUnmaskNikModal()\" class=\"w-full py-2 bg-[#006948] hover:bg-[#005137] text-white rounded-xl font-bold transition\">\n            Tutup &amp; Sensor Kembali\n          </button>\n        </div>\n      </div>\n    </div>\n  </div>\n<div id=\"cancelTicketModal\" class=\"fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden pointer-events-none flex items-center justify-center p-3 sm:p-4\">\n    <div class=\"bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden\">\n      <div class=\"p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-rose-50/80\">\n        <div class=\"flex items-center gap-2.5\">\n          <div class=\"w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0\">\n            <span class=\"material-symbols-outlined text-lg\">cancel</span>\n          </div>\n          <div>\n            <h3 class=\"text-sm font-bold text-slate-900\">Pembatalan Tiket Pengurusan</h3>\n            <p id=\"cancelModalDocInfo\" class=\"text-[10px] text-slate-500\">Pencatatan Alasan Resmi Pembatalan Tiket</p>\n          </div>\n        </div>\n        <button type=\"button\" onclick=\"closeCancelTicketModal()\" class=\"text-slate-400 hover:text-slate-600 p-2 rounded-lg\">\n          <span class=\"material-symbols-outlined text-lg\">close</span>\n        </button>\n      </div>\n\n      <form onsubmit=\"submitCancelTicket(event)\" class=\"p-5 space-y-4 text-xs\">\n        <div class=\"p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] leading-relaxed\">\n          <strong>Kepatuhan Regulasi:</strong> Sesuai <em>Ticket State Machine (RULES.md Bagian 2)</em>, pembatalan tiket wajib menyertakan alasan resmi yang dicatat di tabel <code>ticket_stage_histories</code>.\n        </div>\n\n        <div>\n          <label class=\"block font-bold text-slate-700 mb-1\">Alasan Pembatalan Tiket *</label>\n          <select id=\"cancelReasonSelect\" class=\"w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-600\" required>\n            <option value=\"Dokter Mengundurkan Diri / Tidak Melanjutkan\">Dokter Mengundurkan Diri / Tidak Melanjutkan</option>\n            <option value=\"Syarat KKI / Kolegium Tidak Terpenuhi\">Syarat KKI / Kolegium Tidak Terpenuhi</option>\n            <option value=\"Pembatalan Permohonan oleh Mitra Faskes\">Pembatalan Permohonan oleh Mitra Faskes</option>\n            <option value=\"Duplikasi Pengajuan Berkas\">Duplikasi Pengajuan Berkas</option>\n            <option value=\"Lainnya\">Lainnya (Tuliskan di catatan riwayat)</option>\n          </select>\n        </div>\n\n        <div>\n          <label class=\"block font-bold text-slate-700 mb-1\">Catatan Tambahan untuk Riwayat Audit</label>\n          <textarea id=\"cancelReasonNotes\" rows=\"2\" placeholder=\"Tuliskan catatan detail kendala pembatalan berkas dokter...\" class=\"w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-600\"></textarea>\n        </div>\n\n        <div class=\"p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5\">\n          <label class=\"flex items-start gap-2 cursor-pointer\">\n            <input type=\"checkbox\" id=\"cancelTriggerRefund\" class=\"mt-0.5 rounded text-rose-600 focus:ring-rose-500\" checked>\n            <div>\n              <span class=\"font-bold text-slate-900 block text-xs\">Memicu Pengembalian Dana &amp; Penyesuaian Clawback Komisi</span>\n              <span class=\"text-[10px] text-slate-500 block\">Sesuai RULES.md Bagian 4.3, pembatalan pasca-bayar otomatis menerbitkan entri debit pembalik (CLAWBACK) pada Buku Besar Komisi Agen tanpa menghapus riwayat historis.</span>\n            </div>\n          </label>\n        </div>\n\n        <div class=\"flex items-center justify-end gap-2 pt-2 border-t border-slate-100\">\n          <button type=\"button\" onclick=\"closeCancelTicketModal()\" class=\"px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition\">\n            Batal\n          </button>\n          <button type=\"submit\" class=\"px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5\">\n            <span class=\"material-symbols-outlined text-sm\">block</span> Konfirmasi Batalkan Tiket\n          </button>\n        </div>\n      </form>\n    </div>\n  </div>\n<div id=\"addCustomDocModal\" class=\"fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden pointer-events-none flex items-center justify-center p-3 sm:p-4\">\n    <div class=\"bg-white rounded-2xl max-w-md w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden\">\n      <div class=\"p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70 shrink-0\">\n        <div class=\"flex items-center gap-2.5 min-w-0\">\n          <div class=\"w-8 h-8 rounded-lg bg-emerald-100 text-[#006948] flex items-center justify-center shrink-0\">\n            <span class=\"material-symbols-outlined text-lg\">note_add</span>\n          </div>\n          <div class=\"min-w-0\">\n            <h3 class=\"text-sm font-bold text-slate-900 truncate\">Tambah Dokumen / Sertifikat Tambahan</h3>\n            <p class=\"text-[10px] text-slate-500 truncate\">Lampirkan bukti kompetensi, sertifikat, atau rekomendasi klinis</p>\n          </div>\n        </div>\n        <button type=\"button\" onclick=\"closeAddCustomDocModal()\" class=\"text-slate-400 hover:text-slate-600 p-2 rounded-lg\">\n          <span class=\"material-symbols-outlined text-lg\">close</span>\n        </button>\n      </div>\n\n      <form onsubmit=\"submitNewCustomDoc(event)\" class=\"p-4 sm:p-5 space-y-4 text-xs\">\n        <div>\n          <label class=\"block font-bold text-slate-700 mb-1\">Nama / Judul Dokumen *</label>\n          <input id=\"inputNewDocTitle\" type=\"text\" required placeholder=\"Contoh: Sertifikat Pelatihan ACLS / ATLS\" class=\"w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#006948]\" />\n        </div>\n\n        <div>\n          <label class=\"block font-bold text-slate-700 mb-1\">Kategori Dokumen *</label>\n          <select id=\"selectNewDocCategory\" class=\"w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#006948]\">\n            <option value=\"Sertifikat Pelatihan / Kompetensi\">Sertifikat Pelatihan / Kompetensi Klinis</option>\n            <option value=\"Surat Rekomendasi / Mitra Bestari\">Surat Rekomendasi Organisasi / Mitra Bestari</option>\n            <option value=\"Surat Izin / Keterangan Faskes\">Surat Izin / Keterangan Praktik Tambahan</option>\n            <option value=\"Bukti Penunjang Medis Lainnya\">Bukti Penunjang Medis / Log Tindakan</option>\n          </select>\n        </div>\n\n        <div>\n          <label class=\"block font-bold text-slate-700 mb-1\">Unggah Berkas (PDF, JPG, PNG) *</label>\n          <div class=\"border-2 border-dashed border-slate-300 hover:border-[#006948] rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition relative\">\n            <input id=\"inputNewDocFile\" type=\"file\" required accept=\".pdf,.png,.jpg,.jpeg\" onchange=\"handleNewDocFileChange(this)\" class=\"absolute inset-0 opacity-0 cursor-pointer w-full h-full\" />\n            <div id=\"newDocFilePreview\" class=\"space-y-1\">\n              <span class=\"material-symbols-outlined text-3xl text-slate-400\">upload_file</span>\n              <div id=\"newDocFileLabel\" class=\"font-bold text-slate-700 text-xs\">Klik untuk pilih file PDF / Foto</div>\n              <div class=\"text-[10px] text-slate-500\">Maksimal 10 MB (Format PDF / JPG / PNG)</div>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"pt-3 border-t border-slate-100 flex items-center justify-end gap-2\">\n          <button type=\"button\" onclick=\"closeAddCustomDocModal()\" class=\"px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600\">\n            Batal\n          </button>\n          <button type=\"submit\" class=\"px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs\">\n            <span class=\"material-symbols-outlined text-sm\">add_circle</span> Simpan Dokumen\n          </button>\n        </div>\n      </form>\n    </div>\n  </div>\n<div id=\"previewDocModal\" class=\"fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden pointer-events-none flex items-center justify-center p-3 sm:p-4\">\n    <div class=\"bg-white rounded-2xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden\">\n      <div class=\"p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80 shrink-0\">\n        <div class=\"flex items-center gap-2.5 min-w-0\">\n          <div class=\"w-8 h-8 rounded-lg bg-emerald-100 text-[#006948] flex items-center justify-center shrink-0\">\n            <span class=\"material-symbols-outlined text-lg\">visibility</span>\n          </div>\n          <div class=\"min-w-0\">\n            <h3 id=\"previewDocModalTitle\" class=\"text-sm font-bold text-slate-900 truncate\">Pratinjau Dokumen</h3>\n            <p id=\"previewDocModalSubtitle\" class=\"text-[10px] text-slate-500 truncate\">Salinan digital berkas kredensial</p>\n          </div>\n        </div>\n        <button type=\"button\" onclick=\"closePreviewDocModal()\" class=\"text-slate-400 hover:text-slate-600 p-2 rounded-lg\">\n          <span class=\"material-symbols-outlined text-lg\">close</span>\n        </button>\n      </div>\n      <div class=\"p-5 flex-1 overflow-y-auto space-y-4\">\n        <div class=\"p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2\">\n          <div class=\"w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-[#006948] flex items-center justify-center shadow-xs\">\n            <span class=\"material-symbols-outlined text-3xl\">picture_as_pdf</span>\n          </div>\n          <div id=\"previewDocFileName\" class=\"font-bold text-slate-900 text-xs break-all\">dokumen.pdf</div>\n          <div class=\"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006948] text-[10px] font-bold\">\n            <span class=\"w-1.5 h-1.5 rounded-full bg-emerald-600\"></span> Siap Diverifikasi PSV Kemenkes / KKI\n          </div>\n        </div>\n        <div class=\"p-3.5 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1.5\">\n          <div class=\"text-emerald-400 font-bold text-[10px] uppercase\">Forensik Metadata Dokumen:</div>\n          <div>Integritas: <span class=\"text-white\">SHA-256 Valid &amp; Untampered</span></div>\n          <div>Status OCR: <span class=\"text-white\">Teks Terbaca 100% (High Confidence)</span></div>\n          <div>Sinkronisasi: <span class=\"text-white\">API SatuSehat SDMK \u2022 KKI Kemenkes</span></div>\n        </div>\n\n        <!-- Kepatuhan UU PDP No. 27/2022: Presigned Object Storage URL (Max 15 Menit) -->\n        <div class=\"p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5\">\n          <div class=\"flex items-center justify-between font-bold text-emerald-950\">\n            <span class=\"flex items-center gap-1.5 text-xs text-[#006948]\">\n              <span class=\"material-symbols-outlined text-sm\">lock</span>\n              Presigned Object Storage URL (AES-256 GCM)\n            </span>\n            <span id=\"presignedExpiryBadge\" class=\"px-2 py-0.5 rounded-full bg-emerald-100 text-[#006948] font-mono text-[10px]\">Sisa 14:48 Menit</span>\n          </div>\n          <p class=\"text-[10.5px] text-emerald-800 leading-relaxed\">Sesuai RULES.md Bagian 1.2 &amp; UU PDP No. 27/2022, berkas sensitif dokter diakses melalui token presigned S3 berbatas waktu maksimal 15 menit dan dilarang disimpan sebagai URL publik statis.</p>\n          <div class=\"pt-1 flex items-center justify-between border-t border-emerald-200/60\">\n            <span id=\"presignedTokenDisplay\" class=\"font-mono text-[10px] text-slate-500 truncate max-w-[250px]\">Token: s3-medcred-v3-exp8921-presigned</span>\n            <button type=\"button\" onclick=\"refreshPresignedUrl()\" class=\"text-[11px] font-bold text-[#006948] hover:text-[#005137] flex items-center gap-1\">\n              <span class=\"material-symbols-outlined text-sm\">refresh</span> Perbarui Tautan\n            </button>\n          </div>\n        </div>\n      </div>\n      <div class=\"p-3.5 bg-slate-50 border-t border-slate-100 flex justify-end\">\n        <button type=\"button\" onclick=\"closePreviewDocModal()\" class=\"px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700\">\n          Tutup Pratinjau\n        </button>\n      </div>\n    </div>\n  </div>";

function injectSharedModals() {
  if (!document.getElementById('qrGeneratorModal')) {
    const container = document.createElement('div');
    container.id = 'sharedModalsContainer';
    container.innerHTML = SHARED_MODALS_HTML;
    document.body.appendChild(container);
  }
  if (!document.getElementById('toastContainer')) {
    const toastDiv = document.createElement('div');
    toastDiv.id = 'toastContainer';
    toastDiv.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(toastDiv);
  }
}

// --- 7. GLOBAL INITIALIZATION ON LOAD ---
function initAppShell(activePage) {
  if (!state.currentUser) {
    state.currentUser = {
      id: 'user-siti',
      name: 'Siti Rahma, S.Farm',
      role: 'admin',
      roleLabel: 'LEAD CONCIERGE PERIZINAN & KREDENSIAL',
      badge: 'Admin Concierge Nasional',
      avatarBg: 'bg-[#006948]'
    };
    saveState();
  }

  injectSharedModals();
  applyRoleAccessUI(state.currentUser.role);
  renderSidebarNav(activePage);

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    const userDropdown = document.getElementById('userDropdown');
    const orgScopeDropdown = document.getElementById('orgScopeDropdown');
    const notifDropdown = document.getElementById('notificationDropdown');

    if (userDropdown && !e.target.closest('#userDropdown') && !e.target.closest('button[onclick*="toggleUserDropdown"]')) {
      userDropdown.classList.add('hidden', 'pointer-events-none');
    }
    if (orgScopeDropdown && !e.target.closest('#orgScopeDropdown') && !e.target.closest('#headerOrgScopeBtn')) {
      orgScopeDropdown.classList.add('hidden');
    }
    if (notifDropdown && !e.target.closest('#notificationDropdown') && !e.target.closest('button[onclick*="toggleNotificationDropdown"]')) {
      notifDropdown.classList.add('hidden');
    }
  });
}
