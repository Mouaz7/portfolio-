// Stable, application-owned inline scripts are shared with next.config.js so
// the report-only static CSP hashes are always derived from the exact bytes
// rendered by the root layout.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = 'light';
    if (t === 'light') document.documentElement.classList.add('light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', t === 'light' ? '#defaf5' : '#0a0b10');
  } catch (e) {}
})();
`;

const browserExtensionCompatibilityScript = `
(function() {
  var attribute = 'bis_skin_checked';

  function cleanElement(element) {
    if (element && element.nodeType === 1 && element.hasAttribute(attribute)) {
      element.removeAttribute(attribute);
    }
  }

  function cleanCurrentTree() {
    cleanElement(document.documentElement);
    var descendants = document.querySelectorAll('[' + attribute + ']');
    for (var i = 0; i < descendants.length; i += 1) {
      descendants[i].removeAttribute(attribute);
    }
  }

  cleanCurrentTree();
  var observer = new MutationObserver(function(records) {
    for (var i = 0; i < records.length; i += 1) {
      cleanElement(records[i].target);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [attribute],
    subtree: true
  });

  document.addEventListener('DOMContentLoaded', function() {
    cleanCurrentTree();
    window.setTimeout(function() { observer.disconnect(); }, 1000);
  }, { once: true });
})();
`;

const performanceTierInitScript = `
(function() {
  try {
    var memory = Number(navigator.deviceMemory || 0);
    var cores = Number(navigator.hardwareConcurrency || 0);
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var constrained = (memory > 0 && memory <= 4)
      || (cores > 0 && cores <= 4)
      || Boolean(connection && connection.saveData);
    document.documentElement.dataset.performanceTier = constrained ? 'low' : 'standard';
  } catch (e) {}
})();
`;

module.exports = {
  browserExtensionCompatibilityScript,
  performanceTierInitScript,
  themeInitScript,
};
