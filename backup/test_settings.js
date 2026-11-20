
const fs = require('fs');
const path = require('path');

global.window = {
  addEventListener: () => {},
  location: {
    pathname: '/settings.html',
    search: '',
    href: ''
  }
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

// Load state.js into global
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8');
eval(stateCode.replace('const state =', 'global.state =').replace('const CREDENTIAL_STANDARDS =', 'global.CREDENTIAL_STANDARDS =').replace('const DEFAULT_STATE =', 'global.DEFAULT_STATE ='));

// Load app.js into global
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
eval(appCode);

// Now extract script from settings.html
const html = fs.readFileSync(path.join(__dirname, '../settings.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (scriptMatch) {
  try {
    eval(scriptMatch[1]);
    console.log('Script in settings.html evaluated without syntax error');
    
    // Now simulate DOMContentLoaded
    initAppShell('settings');
    console.log('initAppShell succeeded');
    renderSettingsView();
    console.log('renderSettingsView succeeded!');
  } catch (e) {
    console.error('RUNTIME ERROR:', e);
  }
} else {
  console.log('Could not find script in settings.html');
}
