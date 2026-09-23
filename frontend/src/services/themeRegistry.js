export const THEME_REGISTRY = {
  DEFAULT: {
    key: 'DEFAULT',
    label: 'Padrão',
    colors: {
      '--da-primary': '#ec1c6a',
      '--da-primary-dark': '#c4104f',
      '--da-primary-light': '#ff8fb8',
      '--da-surface': '#fff5f8',
      '--da-border': '#ffd6e4'
    },
    bannerAsset: null,
    decorations: []
  }
};

export function registerTheme(themeDef) {
  if (!themeDef?.key) throw new Error('Tema precisa de key única');
  THEME_REGISTRY[themeDef.key] = themeDef;
}

export function listAvailableThemes() {
  return Object.values(THEME_REGISTRY);
}

export function applyTheme(key) {
  const theme = THEME_REGISTRY[key] || THEME_REGISTRY.DEFAULT;
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([cssVar, value]) => {
    root.style.setProperty(cssVar, value);
  });
  document.body.dataset.theme = theme.key;
  return theme;
}
