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

  // 设置元素
  const settingsBtn = document.getElementById('settingsBtn')
  const settingsModal = document.getElementById('settingsModal')
  const saveSettingsBtn = document.getElementById('saveSettingsBtn')
  const closeSettingsBtn = document.getElementById('closeSettingsBtn')
  const apiKeyInput = document.getElementById('apiKeyInput')

  // 设置逻辑
  let apiKey = localStorage.getItem('deepseek_api_key') || ''
  apiKeyInput.value = apiKey

  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden')
  })

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden')
  })

  saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim()
    localStorage.setItem('deepseek_api_key', apiKey)
    settingsModal.classList.add('hidden')
  })

  // 缓存与预加载
  const wordCache = {}
  const wordPromises = {}

  // 查询逻辑
  searchBtn.addEventListener('click', performSearch)
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch()
  })

  async function performSearch() {
    const query = searchInput.value.trim()
    if (!query) return

    // 重置 UI
    wordInfoCard.classList.add('hidden')
    candidatesContainer.classList.add('hidden')
    loadingIndicator.classList.remove('hidden')
    candidatesList.innerHTML = ''

    try {
      const resp = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, api_key: apiKey })
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
      alert('查询出错，请检查后段服务是否运行。')
    }
  }

  function renderCandidates(candidates) {
    // 每次渲染前可能不需要清空缓存，但我们需要触发预加载
    candidates.forEach((word) => {
      // 预加载详情信息
      if (!wordCache[word] && !wordPromises[word]) {
        wordPromises[word] = fetch('/api/word_info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: word, api_key: apiKey })
        })
          .then((res) => res.json())
          .then((data) => {
            wordCache[word] = data
            return data
          })
          .catch((err) => {
            console.error('预加载出错:', word, err)
            delete wordPromises[word] // 允许重试
          })
      }

      const li = document.createElement('li')
      li.textContent = word
      li.addEventListener('click', () => {
        fetchWordInfo(word)
      })
      candidatesList.appendChild(li)
    })
  }

  async function fetchWordInfo(word) {
    // 显示加载状态中的信息卡片
    wordInfoCard.classList.remove('hidden')
    wordTitle.textContent = word
    wordPronunciation.textContent = ''
    wordMeaning.textContent = ''
    wordSentences.innerHTML = ''

    document.querySelector('.card-body').classList.add('hidden')
    wordLoading.classList.remove('hidden')

    try {
      let data
      if (wordCache[word]) {
        data = wordCache[word]
      } else if (wordPromises[word]) {
        data = await wordPromises[word]
        wordCache[word] = data
      } else {
        const resp = await fetch('/api/word_info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: word, api_key: apiKey })
        })
        data = await resp.json()
        wordCache[word] = data
      }

      wordLoading.classList.add('hidden')
      document.querySelector('.card-body').classList.remove('hidden')

      wordTitle.textContent = data.word
      wordPronunciation.textContent = data.pronunciation || '/.../'
      wordMeaning.textContent = data.meaning

      wordSentences.innerHTML = ''
      if (data.sentences && data.sentences.length > 0) {
        data.sentences.forEach((sentence) => {
          // 如果法文和中文由一些常见字符分隔，则进行拆分，或者将其作为一个整体显示。
          // 为了显示稳定，假设它们可能使用常见的格式，或者直接显示。
          const sItem = document.createElement('div')
          sItem.className = 'sentence-item'

          if (sentence.includes(' - ')) {
            const parts = sentence.split(' - ')
            sItem.innerHTML = `<div class="fr-text">${parts[0]}</div><div class="zh-text">${parts[1]}</div>`
          } else if (sentence.includes('：')) {
            const parts = sentence.split('：')
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
