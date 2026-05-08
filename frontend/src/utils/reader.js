export const readerThemes = {
  DEFAULT: {
    label: '米白',
    background: '#F8F8F6',
    text: '#1F1F1F'
  },
  GRAY: {
    label: '素灰',
    background: '#EBEBE7',
    text: '#2D2D2D'
  },
  NIGHT: {
    label: '夜间',
    background: '#161A1D',
    text: '#D8D1C7'
  }
}

export function themeStyle(setting) {
  const theme = readerThemes[setting.theme] || readerThemes.DEFAULT
  return {
    backgroundColor: theme.background,
    color: theme.text,
    fontSize: `${setting.fontSize || 18}px`,
    lineHeight: `${setting.lineHeight || 32}px`
  }
}
