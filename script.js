document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput')
  const searchBtn = document.getElementById('searchBtn')
  const loadingIndicator = document.getElementById('loadingIndicator')
  const results = document.getElementById('results')

  searchBtn.addEventListener('click', performSearch)
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch()
  })

  async function performSearch() {
    const query = searchInput.value.trim()
    if (!query) return

    loadingIndicator.classList.remove('hidden')
    results.innerHTML = ''

    try {
      const resp = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query })
      })
      const data = await resp.json()

      loadingIndicator.classList.add('hidden')

      if (data.candidates && data.candidates.length > 0) {
        results.innerHTML = '<p>找到候选词：' + data.candidates.join('、') + '</p>'
      } else {
        alert('未找到相似发音的单词。')
      }
    } catch (err) {
      console.error(err)
      loadingIndicator.classList.add('hidden')
      alert('查询出错，请检查网络连接。')
    }
  }
})