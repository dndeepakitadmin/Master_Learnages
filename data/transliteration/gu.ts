
import { TransliterationMap } from './types';

export const GUJARATI_MAP: TransliterationMap = {
  halant: '્',
  vowels: {
    'a': 'અ', 'aa': 'આ', 'i': 'ઇ', 'ii': 'ઈ', 'u': 'ઉ', 'uu': 'ઊ', 
    'e': 'એ', 'ee': 'ઐ', 'ai': 'ઐ', 'o': 'ઓ', 'oo': 'ઓ', 'au': 'ઔ'
  },
  matras: {
    'a': '', 'aa': 'ા', 'i': 'િ', 'ii': 'ી', 'u': 'ુ', 'uu': 'ૂ', 
    'e': 'ે', 'ee': 'ૈ', 'ai': 'ૈ', 'o': 'ો', 'oo': 'ો', 'au': 'ૌ'
  },
  consonants: {
    'k': 'ક', 'kh': 'ખ', 'g': 'ગ', 'gh': 'ઘ',
    'ch': 'ચ', 'chh': 'છ', 'j': 'જ', 'jh': 'ઝ',
    't': 'ત', 'th': 'થ', 'd': 'દ', 'dh': 'ધ',
    'T': 'ટ', 'Th': 'ઠ', 'D': 'ડ', 'Dh': 'ઢ',
    'n': 'ન', 'N': 'ણ', 'p': 'પ', 'ph': 'ફ', 'b': 'બ', 'bh': 'ભ', 'm': 'મ',
    'y': 'ય', 'r': 'ર', 'l': 'લ', 'L': 'ળ', 'v': 'વ', 'w': 'વ', 'sh': 'શ', 'S': 'ષ', 's': 'સ', 'h': 'હ'
  }
};
