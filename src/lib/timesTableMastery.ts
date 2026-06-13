const STUDY_KEY = 'dm_times_table_mastery'
const TEST_KEY  = 'dm_times_table_tested'

export function getTimesTableStudyMastery(): Set<number> {
  try {
    const raw = localStorage.getItem(STUDY_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch { return new Set() }
}

export function saveTimesTableStudyMastery(dan: number) {
  try {
    const s = getTimesTableStudyMastery()
    s.add(dan)
    localStorage.setItem(STUDY_KEY, JSON.stringify([...s]))
  } catch {}
}

export function getTimesTableTestMastery(): Set<number> {
  try {
    const raw = localStorage.getItem(TEST_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch { return new Set() }
}

export function saveTimesTableTestMastery(dan: number) {
  try {
    const s = getTimesTableTestMastery()
    s.add(dan)
    localStorage.setItem(TEST_KEY, JSON.stringify([...s]))
  } catch {}
}
