export const readerThemes = {
  DEFAULT: {
    label: '米白',
    background: '#F6F0E6',
    text: '#2A2520'
  },
  GREEN: {
    label: '清绿',
    background: '#EAF3E8',
    text: '#22332B'
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
