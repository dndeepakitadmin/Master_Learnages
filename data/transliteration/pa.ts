
import { TransliterationMap } from './types';

export const PUNJABI_MAP: TransliterationMap = {
  halant: '੍',
  vowels: {
    'a': 'ਅ', 'aa': 'ਆ', 'i': 'ਇ', 'ii': 'ਈ', 'u': 'ਉ', 'uu': 'ਊ', 
    'e': 'ਏ', 'ee': 'ਐ', 'ai': 'ਐ', 'o': 'ਓ', 'oo': 'ਓ', 'au': 'ਔ'
  },
  matras: {
    'a': '', 'aa': 'ਾ', 'i': 'ਿ', 'ii': 'ੀ', 'u': 'ੁ', 'uu': 'ੂ', 
    'e': 'ੇ', 'ee': 'ੈ', 'ai': 'ੈ', 'o': 'ੋ', 'oo': 'ੋ', 'au': 'ੌ'
  },
  consonants: {
    'k': 'ਕ', 'kh': 'ਖ', 'g': 'ਗ', 'gh': 'ਘ',
    'ch': 'ਚ', 'chh': 'ਛ', 'j': 'ਜ', 'jh': 'ਝ',
    't': 'ਤ', 'th': 'ਥ', 'd': 'ਦ', 'dh': 'ਧ',
    'T': 'ਟ', 'Th': 'ਠ', 'D': 'ਡ', 'Dh': 'ਢ',
    'n': 'ਨ', 'p': 'ਪ', 'ph': 'ਫ', 'b': 'ਬ', 'bh': 'ਭ', 'm': 'ਮ',
    'y': 'ਯ', 'r': 'ਰ', 'l': 'ਲ', 'v': 'ਵ', 'sh': 'ਸ਼', 's': 'ਸ', 'h': 'ਹ'
  }
};
