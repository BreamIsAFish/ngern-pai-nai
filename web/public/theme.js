// Blocking startup script: apply the saved palette before styles or app content paint.
(() => {
  let saved = null
  try { saved = localStorage.getItem('paper-butter-theme') } catch { /* Storage can be unavailable in a webview. */ }
  document.documentElement.dataset.theme = saved === 'light' || saved === 'dark'
    ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
})()
