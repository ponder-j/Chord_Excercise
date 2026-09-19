import type { KeyRoot, QualityDefinition } from '../types'

export const KEY_ROOTS: KeyRoot[] = [
  { pitchClass: 0, label: 'C', useFlats: false },
  { pitchClass: 1, label: 'Db', useFlats: true },
  { pitchClass: 2, label: 'D', useFlats: false },
  { pitchClass: 3, label: 'Eb', useFlats: true },
  { pitchClass: 4, label: 'E', useFlats: false },
  { pitchClass: 5, label: 'F', useFlats: true },
  { pitchClass: 6, label: 'Gb', useFlats: true },
  { pitchClass: 7, label: 'G', useFlats: false },
  { pitchClass: 8, label: 'Ab', useFlats: true },
  { pitchClass: 9, label: 'A', useFlats: false },
  { pitchClass: 10, label: 'Bb', useFlats: true },
  { pitchClass: 11, label: 'B', useFlats: false },
]

export const QUALITIES: QualityDefinition[] = [
  { id: 'maj', label: 'maj', name: '大三和弦', intervals: [0, 4, 7], level: 1, description: '明亮、稳定的基础色彩' },
  { id: 'min', label: 'min', name: '小三和弦', intervals: [0, 3, 7], level: 1, description: '柔和、内敛的基础色彩' },
  { id: 'dim', label: 'dim', name: '减三和弦', intervals: [0, 3, 6], level: 2, description: '紧张、不稳定' },
  { id: 'aug', label: 'aug', name: '增三和弦', intervals: [0, 4, 8], level: 2, description: '悬浮、扩张感' },
  { id: 'sus2', label: 'sus2', name: '挂二和弦', intervals: [0, 2, 7], level: 2, description: '开放、没有明确三音倾向' },
  { id: 'sus4', label: 'sus4', name: '挂四和弦', intervals: [0, 5, 7], level: 2, description: '悬而未决、具有解决倾向' },
  { id: 'maj7', label: 'maj7', name: '大七和弦', intervals: [0, 4, 7, 11], level: 3, description: '通透、柔和的大七色彩' },
  { id: 'min7', label: 'min7', name: '小七和弦', intervals: [0, 3, 7, 10], level: 3, description: '流行音乐中常见的小七色彩' },
  { id: '7', label: '7', name: '属七和弦', intervals: [0, 4, 7, 10], level: 3, description: '强烈指向主和弦' },
  { id: 'm7b5', label: 'm7b5', name: '半减七和弦', intervals: [0, 3, 6, 10], level: 3, description: '常用于小调 ii-V-i' },
  { id: 'dim7', label: 'dim7', name: '减七和弦', intervals: [0, 3, 6, 9], level: 3, description: '对称、强烈的紧张色彩' },
  { id: '6', label: '6', name: '大六和弦', intervals: [0, 4, 7, 9], level: 4, description: '温暖、略带复古感' },
  { id: 'm6', label: 'm6', name: '小六和弦', intervals: [0, 3, 7, 9], level: 4, description: '小调中的多利亚色彩' },
  { id: '7sus4', label: '7sus4', name: '属七挂四', intervals: [0, 5, 7, 10], level: 4, description: '延宕解决感的属功能和弦' },
  { id: 'maj9', label: 'maj9', name: '大九和弦', intervals: [0, 4, 7, 11, 14], level: 5, description: '开阔、现代的九和弦色彩' },
  { id: 'min9', label: 'min9', name: '小九和弦', intervals: [0, 3, 7, 10, 14], level: 5, description: '柔和且有延伸感' },
  { id: '9', label: '9', name: '属九和弦', intervals: [0, 4, 7, 10, 14], level: 5, description: '强烈但带有开放感' },
  { id: '69', label: '6/9', name: '六九和弦', intervals: [0, 4, 7, 9, 14], level: 5, description: '明亮、无需解决的流行色彩' },
  { id: 'maj11', label: 'maj11', name: '大十一和弦', intervals: [0, 4, 7, 11, 14, 17], level: 6, description: '宽阔、带有悬浮感的大和弦' },
  { id: 'min11', label: 'min11', name: '小十一和弦', intervals: [0, 3, 7, 10, 14, 17], level: 6, description: '爵士与 R&B 中常见' },
  { id: '11', label: '11', name: '属十一和弦', intervals: [0, 4, 7, 10, 14, 17], level: 6, description: '密集而富有张力的属和弦' },
  { id: '7#11', label: '7#11', name: '属七升十一', intervals: [0, 4, 7, 10, 18], level: 6, description: '利底亚属色彩，空灵而紧张' },
  { id: 'maj13', label: 'maj13', name: '大十三和弦', intervals: [0, 4, 7, 11, 14, 21], level: 7, description: '丰满、开阔的终止色彩' },
  { id: 'min13', label: 'min13', name: '小十三和弦', intervals: [0, 3, 7, 10, 14, 21], level: 7, description: '柔和而复杂的十三和弦色彩' },
  { id: '13', label: '13', name: '属十三和弦', intervals: [0, 4, 7, 10, 14, 21], level: 7, description: '张力充分、色彩浓烈的属和弦' },
]

export const LEVELS = [
  {
    id: 1,
    title: '调内三和弦',
    short: 'Diatonic triads',
    description: '只使用当前调式的调内三和弦，不引入调外音',
    qualityIds: ['maj', 'min', 'dim'],
    diatonicOnly: true,
    modifiers: [] as string[],
  },
  {
    id: 2,
    title: '调内七和弦',
    short: 'Diatonic sevenths',
    description: '只使用调内七和弦：maj7、min7、属七与 m7b5',
    qualityIds: ['maj7', 'min7', '7', 'm7b5'],
    diatonicOnly: true,
    modifiers: [],
  },
  {
    id: 3,
    title: '调外色彩',
    short: 'Outside color',
    description: '开始加入 aug、sus2、sus4 与减七和弦等调外色彩',
    qualityIds: ['aug', 'sus2', 'sus4', 'dim7'],
    modifiers: [],
  },
  {
    id: 4,
    title: '六和弦与修饰',
    short: 'Color + omit',
    description: '加入 add 与 omit，听辨和弦内部变化',
    qualityIds: ['maj', 'min', 'maj7', 'min7', '7', '6', 'm6', '7sus4'],
    modifiers: ['add:9', 'add:11', 'omit:3', 'omit:5'],
  },
  {
    id: 5,
    title: '九和弦',
    short: 'Ninth',
    description: '辨认 maj9、min9、属九与 6/9',
    qualityIds: ['maj9', 'min9', '9', '69'],
    modifiers: ['add:11', 'omit:3', 'omit:5', 'omit:7'],
  },
  {
    id: 6,
    title: '十一和弦',
    short: 'Eleventh',
    description: '加入 11 音、升十一和省略音',
    qualityIds: ['maj11', 'min11', '11', '7#11'],
    modifiers: ['add:9', 'omit:3', 'omit:5', 'omit:9'],
  },
  {
    id: 7,
    title: '十三和弦',
    short: 'Thirteenth',
    description: '加入 maj13、min13、属十三与省略音',
    qualityIds: ['maj13', 'min13', '13'],
    modifiers: ['add:9', 'omit:5', 'omit:9', 'omit:11'],
  },
]

export const QUALITY_BY_ID = new Map(QUALITIES.map((quality) => [quality.id, quality]))
export const LEVEL_BY_ID = new Map(LEVELS.map((level) => [level.id, level]))

export function getLevelDefinition(level: number) {
  return LEVEL_BY_ID.get(level) ?? LEVELS[0]
}

export function getQuality(qualityId: string) {
  return QUALITY_BY_ID.get(qualityId) ?? QUALITIES[0]
}
