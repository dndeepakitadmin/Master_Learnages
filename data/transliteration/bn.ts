
import { TransliterationMap } from './types';

export const BENGALI_MAP: TransliterationMap = {
  halant: '্',
  vowels: {
    'a': 'অ', 'aa': 'আ', 'i': 'ই', 'ii': 'ঈ', 'u': 'উ', 'uu': 'ঊ', 
    'e': 'এ', 'ee': 'ঐ', 'ai': 'ঐ', 'o': 'ও', 'oo': 'ও', 'au': 'ঔ'
  },
  matras: {
    'a': '', 'aa': 'া', 'i': 'ি', 'ii': 'ী', 'u': 'ু', 'uu': 'ূ', 
    'e': 'ে', 'ee': 'ৈ', 'ai': 'ৈ', 'o': 'ো', 'oo': 'ো', 'au': 'ৌ'
  },
  consonants: {
    'k': 'ক', 'kh': 'খ', 'g': 'গ', 'gh': 'ঘ',
    'ch': 'চ', 'chh': 'ছ', 'j': 'জ', 'jh': 'ঝ',
    't': 'ত', 'th': 'থ', 'd': 'দ', 'dh': 'ধ',
    'T': 'ট', 'Th': 'ঠ', 'D': 'ড', 'Dh': 'ঢ',
    'n': 'ন', 'N': 'ণ', 'p': 'প', 'ph': 'ফ', 'b': 'ব', 'bh': 'ভ', 'm': 'ম',
    'y': 'য়', 'r': 'র', 'l': 'ল', 'v': 'ভ', 'sh': 'শ', 's': 'স', 'h': 'হ'
  }
};
