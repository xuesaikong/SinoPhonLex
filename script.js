document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput')
  const searchBtn = document.getElementById('searchBtn')
  const candidatesContainer = document.getElementById('candidatesContainer')
  const loadingIndicator = document.getElementById('loadingIndicator')
  const results = document.getElementById('results')

  searchBtn.addEventListener('click', performSearch)
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch()
  })

  async function performSearch() {
    const query = searchInput.value.trim()
    if (!query) return

    candidatesContainer.classList.add('hidden')
    loadingIndicator.classList.remove('hidden')
    candidatesList.innerHTML = ''

    try {
      const resp = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query })
      })
      const data = await resp.json()

      loadingIndicator.classList.add('hidden')

      if (data.candidates && data.candidates.length > 0) {
        renderCandidates(data.candidates)
        candidatesContainer.classList.remove('hidden')
      } else {
        alert('未找到相似发音的单词。')
      }
    } catch (err) {
      console.error(err)
      loadingIndicator.classList.add('hidden')
      alert('查询出错，请检查网络连接。')
    }
  }

  function renderCandidates(candidates) {
    candidates.forEach((word) => {
      const li = document.createElement('li')
      li.textContent = word
      li.addEventListener('click', () => {
        // TODO: 点击后展示单词详情
        alert(`你选择了: ${word}`)
      })
      candidatesList.appendChild(li)
    })
  }
})