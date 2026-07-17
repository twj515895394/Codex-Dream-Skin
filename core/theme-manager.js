// Theme Manager
//
// Unified runtime API for theme lifecycle management.

const { listThemes, registerTheme, removeTheme } = require('./theme-registry');

function install(theme) {
  return registerTheme(theme);
}

function list() {
  return listThemes();
}

function remove(id) {
  return removeTheme(id);
}

module.exports = {
  install,
  list,
  remove
};
