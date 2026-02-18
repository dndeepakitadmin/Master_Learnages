import { TransliterationMap } from './types';

export const TELUGU_MAP: TransliterationMap = {
  halant: '్',
  vowels: {
    'a': 'అ', 'aa': 'ఆ', 'i': 'ఇ', 'ii': 'ఈ', 'u': 'ఉ', 'uu': 'ఊ', 
    'e': 'ఎ', 'ee': 'ఏ', 'ai': 'ఐ', 'o': 'ఒ', 'oo': 'ఓ', 'au': 'ఔ'
  },
  matras: {
    'a': '', 'aa': 'ా', 'i': 'ి', 'ii': 'ీ', 'u': 'ు', 'uu': 'ూ', 
    'e': 'ె', 'ee': 'ే', 'ai': 'ై', 'o': 'ొ', 'oo': 'ో', 'au': 'ౌ'
  },
  consonants: {
    'k': 'క', 'kh': 'ఖ', 'g': 'గ', 'gh': 'ఘ',
    'ch': 'చ', 'chh': 'ఛ', 'j': 'జ', 'jh': 'ఝ',
    't': 'త', 'th': 'థ', 'd': 'ద', 'dh': 'ధ',
    'T': 'ట', 'Th': 'ఠ', 'D': 'డ', 'Dh': 'ఢ',
    'n': 'న', 'N': 'ణ', 'p': 'ప', 'ph': 'ఫ', 'b': 'బ', 'bh': 'భ', 'm': 'మ',
    'y': 'య', 'r': 'ర', 'l': 'ల', 'v': 'వ', 'sh': 'శ', 'S': 'ష', 's': 'స', 'h': 'హ'
  }
};