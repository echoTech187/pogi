
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
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
global.location = {
  pathname: '/dashboard.html',
  search: '',
  href: ''
};
global.URLSearchParams = class {
  get() { return null; }
};

// 1. Load state.js
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
eval(stateCode);

// 2. Load app.js
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

console.log('state.js and app.js loaded successfully!');

const pages = [
  'dashboard.html',
  'doctors.html',
  'doctor-detail.html',
  'curation.html',
  'partners.html',
  'catalog.html',
  'audit.html',
  'invoicing.html',
  'commissions.html',
  'settings.html',
  'qr-portal.html',
  'login.html'
];

for (const page of pages) {
  const html = fs.readFileSync(path.join(__dirname, '../', page), 'utf8');
  const matches = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/g)];
  console.log(`Testing page: ${page} (scripts: ${matches.length})`);
  for (let i = 0; i < matches.length; i++) {
    const code = matches[i][1];
    if (!code.trim() || code.includes('tailwindcss')) continue;
    try {
      eval(code);
      console.log(`  -> Script ${i} evaluated OK`);
    } catch (err) {
      console.error(`  -> ERROR in ${page} script ${i}:`, err.message);
    }
  }
}
