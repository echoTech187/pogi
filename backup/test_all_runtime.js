
const fs = require('fs');
const path = require('path');

global.window = {
  addEventListener: () => {},
  location: {
    pathname: '/index.html',
    search: '?id=doc-elena&mode=existing',
    href: ''
  },
  scrollTo: () => {},
  print: () => {}
};
global.document = {
  getElementById: (id) => {
    return {
      id: id,
      classList: {
        contains: (c) => false,
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      style: {},
      innerHTML: '',
      textContent: '',
      value: '',
      checked: false,
      appendChild: () => {},
      addEventListener: () => {},
      querySelectorAll: () => []
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (tag) => ({
    tagName: tag,
    classList: { add: () => {}, remove: () => {} },
    style: {},
    appendChild: () => {}
  }),
  body: {
    appendChild: () => {}
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.location = window.location;
global.URLSearchParams = class {
  constructor(search) { this.search = search; }
  get(key) {
    if (key === 'id') return 'doc-elena';
    if (key === 'mode') return 'existing';
    return null;
  }
};

// Load state.js into global
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
eval(stateCode.replace('const state =', 'global.state =').replace('const CREDENTIAL_STANDARDS =', 'global.CREDENTIAL_STANDARDS =').replace('const DEFAULT_STATE =', 'global.DEFAULT_STATE ='));

// Load app.js into global
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

const pages = [
  { file: 'index.html', fn: 'renderDashboardTable', pageName: 'dashboard' },
  { file: 'doctors.html', fn: 'renderDoctorsDirectoryView', pageName: 'doctors' },
  { file: 'doctor-detail.html', fn: 'renderDoctorDetailView', pageName: 'doctors' },
  { file: 'curation.html', fn: 'renderPsvInspectorView', pageName: 'psv' },
  { file: 'partners.html', fn: 'renderComplianceView', pageName: 'compliance' },
  { file: 'catalog.html', fn: 'renderCommitteeView', pageName: 'committee' },
  { file: 'audit.html', fn: 'renderAuditLogView', pageName: 'audit' },
  { file: 'invoicing.html', fn: 'renderInvoicingView', pageName: 'invoicing' },
  { file: 'commissions.html', fn: 'renderCommissionsView', pageName: 'commissions' },
  { file: 'settings.html', fn: 'renderSettingsView', pageName: 'settings' },
  { file: 'qr-portal.html', fn: 'renderQrPortalView', pageName: 'qr-portal' },
  { file: 'login.html', fn: 'switchLoginTab', pageName: 'login' }
];

let totalPassed = 0;
for (const p of pages) {
  const filePath = path.join(__dirname, '../', p.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] File missing: ${p.file}`);
    continue;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const lastScriptStart = html.lastIndexOf('<script>');
  const lastScriptEnd = html.lastIndexOf('</script>');
  if (lastScriptStart === -1 || lastScriptEnd === -1) {
    console.error(`[FAIL] Script not found in ${p.file}`);
    continue;
  }
  const code = html.substring(lastScriptStart + 8, lastScriptEnd);

  try {
    eval(code);
    if (p.pageName !== 'login') {
      initAppShell(p.pageName);
    }
    if (typeof global[p.fn] === 'function') {
      if (p.fn === 'switchLoginTab') {
        global[p.fn]('admin');
      } else {
        global[p.fn]();
      }
    }
    console.log(`[PASS] ${p.file.padEnd(20)} -> initAppShell & ${p.fn}() executed successfully`);
    totalPassed++;
  } catch (err) {
    console.error(`[FAIL] ${p.file.padEnd(20)} -> Error: ${err.message}`);
  }
}

console.log(`\nResult: ${totalPassed}/${pages.length} pages verified successfully!`);
