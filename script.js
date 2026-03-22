document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素
  const searchInput = document.getElementById('searchInput')
  const searchBtn = document.getElementById('searchBtn')
  const candidatesContainer = document.getElementById('candidatesContainer')
  const candidatesList = document.getElementById('candidatesList')
  const wordInfoCard = document.getElementById('wordInfoCard')
  const loadingIndicator = document.getElementById('loadingIndicator')
  const wordLoading = document.getElementById('wordLoading')

// 单词信息元素
  const wordTitle = document.getElementById('wordTitle')
  const wordPronunciation = document.getElementById('wordPronunciation')
  const wordMeaning = document.getElementById('wordMeaning')
  const wordSentences = document.getElementById('wordSentences')

  searchBtn.addEventListener('click', performSearch)
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch()
  })

  async function performSearch() {
    const query = searchInput.value.trim()
    if (!query) return

    wordInfoCard.classList.add('hidden')
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
  async function fetchWordInfo(word) {
    wordInfoCard.classList.remove('hidden')
    wordTitle.textContent = word
    wordPronunciation.textContent = ''
    wordMeaning.textContent = ''
    wordSentences.innerHTML = ''

    document.querySelector('.card-body').classList.add('hidden')
    wordLoading.classList.remove('hidden')

    try {
      const resp = await fetch('/api/word_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word })
      })
      const data = await resp.json()

      wordLoading.classList.add('hidden')
      document.querySelector('.card-body').classList.remove('hidden')

      wordTitle.textContent = data.word
      wordPronunciation.textContent = data.pronunciation || '/.../'
      wordMeaning.textContent = data.meaning

      wordSentences.innerHTML = ''
      if (data.sentences && data.sentences.length > 0) {
        data.sentences.forEach((sentence) => {
          const sItem = document.createElement('div')
          sItem.className = 'sentence-item'

          if (sentence.includes(' - ')) {
            const parts = sentence.split(' - ')
            sItem.innerHTML = `<div class="fr-text">${parts[0]}</div><div class="zh-text">${parts[1]}</div>`
          } else {
            sItem.innerHTML = `<div class="fr-text">${sentence}</div>`
          }
          wordSentences.appendChild(sItem)
        })
      } else {
        wordSentences.innerHTML = '<div class="zh-text">暂无例句。</div>'
      }
    } catch (err) {
      console.error(err)
      wordLoading.classList.add('hidden')
      alert('获取单词信息出错。')
    }
  }
})