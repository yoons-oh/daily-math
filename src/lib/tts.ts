import { getStoredLanguage, SupportedLanguage, TTS_LANGUAGE_MAP } from './language'

// ─── Google Cloud TTS 전용 ─────────────────────────────────
// Web Speech API 완전 사용 안함
// 모든 음성은 Google TTS Audio 객체로만 재생

const API_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY as string | undefined

const audioCache = new Map<string, string>()
let currentAudio: HTMLAudioElement | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null
let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null
let sharedAudio: HTMLAudioElement | null = null
let audioUnlocked = false

function getSharedAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.preload = 'auto'
    sharedAudio.setAttribute('playsinline', 'true')
  }
  return sharedAudio
}

// 현재 재생 중인 오디오 강제 정지
export function stopAll() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

// 텍스트 → base64 오디오 URL
function getTtsLang(language: SupportedLanguage = getStoredLanguage()) {
  return TTS_LANGUAGE_MAP[language] ?? TTS_LANGUAGE_MAP.ko
}

async function fetchAudio(text: string, language: SupportedLanguage = getStoredLanguage()): Promise<string | null> {
  if (!API_KEY) return null
  const languageCode = getTtsLang(language)
  const cacheKey = `${languageCode}:${text}`
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!
  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode, ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const url = `data:audio/mp3;base64,${data.audioContent}`
    audioCache.set(cacheKey, url)
    return url
  } catch {
    return null
  }
}

// 오디오 URL 재생 → 끝나면 resolve
function playAudio(url: string): Promise<boolean> {
  return new Promise(resolve => {
    stopAll()
    const audio = getSharedAudio() ?? new Audio()
    currentAudio = audio
    audio.src = url
    audio.currentTime = 0
    audio.onended = () => { currentAudio = null; resolve(true) }
    audio.onerror = () => { currentAudio = null; resolve(false) }
    audio.play().catch(() => { currentAudio = null; resolve(false) })
  })
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([])
  const voices = window.speechSynthesis.getVoices()
  if (voices.length) return Promise.resolve(voices)
  if (voicesReady) return voicesReady

  voicesReady = new Promise(resolve => {
    const done = () => {
      window.speechSynthesis.onvoiceschanged = null
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.onvoiceschanged = done
    window.setTimeout(done, 600)
  })
  return voicesReady
}

export async function unlockTts() {
  if (typeof window === 'undefined') return

  const audio = getSharedAudio()
  if (audio && !audioUnlocked) {
    try {
      audio.muted = true
      audio.src = 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgP/7kMQAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
      await audio.play()
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.muted = false
      audioUnlocked = true
    } catch {
      if (audio) audio.muted = false
    }
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    window.speechSynthesis.resume()
  }
}

async function speakWithBrowser(text: string, language: SupportedLanguage = getStoredLanguage()): Promise<void> {
  const voices = await loadVoices()
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) {
      resolve()
      return
    }

    stopAll()
    const utterance = new SpeechSynthesisUtterance(text)
    const languageCode = getTtsLang(language)
    const languagePrefix = languageCode.split('-')[0]
    const matchedVoice =
      voices.find(v => v.lang === languageCode && /female|google|microsoft|heami|sunhi|zira|helena/i.test(v.name)) ||
      voices.find(v => v.lang === languageCode) ||
      voices.find(v => v.lang.toLowerCase().startsWith(languagePrefix.toLowerCase()))

    if (matchedVoice) utterance.voice = matchedVoice
    utterance.lang = languageCode
    utterance.rate = 0.92
    utterance.pitch = 1.22
    utterance.volume = 1
    let done = false
    const finish = () => {
      if (done) return
      done = true
      currentUtterance = null
      resolve()
    }
    utterance.onend = finish
    utterance.onerror = finish
    currentUtterance = utterance
    window.speechSynthesis.cancel()
    window.setTimeout(() => {
      try {
        window.speechSynthesis.resume()
        window.speechSynthesis.speak(utterance)
      } catch {
        finish()
      }
    }, 40)
    window.setTimeout(finish, Math.max(2500, text.length * 180))
  })
}

// 문장 한 개 재생 → 끝날 때까지 await 가능
export async function say(text: string, muted: boolean, language: SupportedLanguage = getStoredLanguage()): Promise<void> {
  if (muted) return
  const url = await fetchAudio(text, language)
  if (url) {
    const played = await playAudio(url)
    if (played) return
  }
  await speakWithBrowser(text, language)
}

// 단어 목록 오디오 미리 다운로드
export async function preloadWords(words: string[], language: SupportedLanguage = getStoredLanguage()): Promise<(string | null)[]> {
  return Promise.all(words.map(w => fetchAudio(w, language)))
}

// 미리 다운로드된 오디오로 순차 재생
export function sayWordsCached(
  urls: (string | null)[],
  words: string[],
  muted: boolean,
  onEach: (i: number) => void,
  onDone: () => void,
  language: SupportedLanguage = getStoredLanguage(),
): () => void {
  let cancelled = false

  if (muted) {
    const timers: ReturnType<typeof setTimeout>[] = []
    words.forEach((_, i) => {
      timers.push(setTimeout(() => { if (!cancelled) onEach(i) }, i * 700))
    })
    timers.push(setTimeout(() => { if (!cancelled) onDone() }, words.length * 700 + 200))
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }

  function playNext(i: number) {
    if (cancelled) return
    if (i >= words.length) { if (!cancelled) onDone(); return }
    onEach(i)
    const url = urls[i]
    if (!url) {
      speakWithBrowser(words[i], language).then(() => {
        if (!cancelled) setTimeout(() => playNext(i + 1), 80)
      })
      return
    }
    stopAll()
    const audio = getSharedAudio() ?? new Audio()
    currentAudio = audio
    audio.src = url
    audio.currentTime = 0
    audio.onended = () => { currentAudio = null; if (!cancelled) setTimeout(() => playNext(i + 1), 80) }
    audio.onerror = () => { currentAudio = null; if (!cancelled) setTimeout(() => playNext(i + 1), 200) }
    audio.play().catch(() => { currentAudio = null; if (!cancelled) setTimeout(() => playNext(i + 1), 200) })
  }

  stopAll()
  playNext(0)
  return () => { cancelled = true; stopAll() }
}
