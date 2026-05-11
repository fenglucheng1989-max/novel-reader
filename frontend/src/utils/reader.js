export const readerThemes = {
  DEFAULT: {
    label: '米白',
    background: '#F8F8F6',
    text: '#1F1F1F'
  },
  PARCHMENT: {
    label: '羊皮',
    background: '#F5E6C8',
    text: '#3D2B1F'
  },
  LIGHT_GREEN: {
    label: '浅绿',
    background: '#E8F0E3',
    text: '#2D3A28'
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
    fontSize: `${Math.max(14, Math.min(30, Number(setting.fontSize) || 16))}px`,
    lineHeight: `${setting.lineHeight || 30}px`
  }
}
