// ─── Google Cloud TTS 전용 ─────────────────────────────────
// Web Speech API 완전 사용 안함
// 모든 음성은 Google TTS Audio 객체로만 재생

const API_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY as string | undefined

const audioCache = new Map<string, string>()
let currentAudio: HTMLAudioElement | null = null

// 현재 재생 중인 오디오 강제 정지
export function stopAll() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

// 텍스트 → base64 오디오 URL
async function fetchAudio(text: string): Promise<string | null> {
  if (!API_KEY) return null
  if (audioCache.has(text)) return audioCache.get(text)!
  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-B', ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 1.5 },
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const url = `data:audio/mp3;base64,${data.audioContent}`
    audioCache.set(text, url)
    return url
  } catch {
    return null
  }
}

// 오디오 URL 재생 → 끝나면 resolve
function playAudio(url: string): Promise<void> {
  return new Promise(resolve => {
    stopAll()
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => { currentAudio = null; resolve() }
    audio.onerror = () => { currentAudio = null; resolve() }
    audio.play().catch(() => { currentAudio = null; resolve() })
  })
}

// 문장 한 개 재생 → 끝날 때까지 await 가능
export async function say(text: string, muted: boolean): Promise<void> {
  if (muted) return
  const url = await fetchAudio(text)
  if (!url) return
  await playAudio(url)
}

// 단어 목록 오디오 미리 다운로드
export async function preloadWords(words: string[]): Promise<(string | null)[]> {
  return Promise.all(words.map(w => fetchAudio(w)))
}

// 미리 다운로드된 오디오로 순차 재생
export function sayWordsCached(
  urls: (string | null)[],
  words: string[],
  muted: boolean,
  onEach: (i: number) => void,
  onDone: () => void
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
    if (!url) { setTimeout(() => { if (!cancelled) playNext(i + 1) }, 600); return }
    stopAll()
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => { currentAudio = null; if (!cancelled) setTimeout(() => playNext(i + 1), 80) }
    audio.onerror = () => { currentAudio = null; if (!cancelled) setTimeout(() => playNext(i + 1), 200) }
    audio.play().catch(() => { currentAudio = null; if (!cancelled) setTimeout(() => playNext(i + 1), 200) })
  }

  stopAll()
  playNext(0)
  return () => { cancelled = true; stopAll() }
}
