export const THEME_REGISTRY = {
  DEFAULT: {
    key: 'DEFAULT', label: 'Padrão', colors: {'--da-primary':'#ec1c6a','--da-primary-dark':'#c4104f','--da-primary-light':'#ff8fb8','--da-surface':'#fff5f8','--da-border':'#ffd6e4'}, bannerAsset: '/themes/default/banners/', decorations: []
  },
  CHRISTMAS: {
    key: 'CHRISTMAS', label: 'Natal', colors: {'--da-primary':'#b91c1c','--da-primary-dark':'#7f1d1d','--da-primary-light':'#fecaca','--da-surface':'#fff7f0','--da-border':'#fecaca'}, bannerAsset: '/themes/natal/banners/', decorations: ['snow']
  }
};
export function registerTheme(themeDef) { if (themeDef?.key) THEME_REGISTRY[themeDef.key] = themeDef; }
export function listAvailableThemes() { return Object.values(THEME_REGISTRY); }
export function applyTheme(key) {
  const theme = THEME_REGISTRY[key] || THEME_REGISTRY.DEFAULT;
  Object.entries(theme.colors || {}).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
  document.body.dataset.theme = theme.key;
  return theme;
}
