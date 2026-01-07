
import { TransliterationMap } from './types';

export const ODIA_MAP: TransliterationMap = {
  halant: '୍',
  vowels: {
    'a': 'ଅ', 'aa': 'ଆ', 'i': 'ଇ', 'ii': 'ଈ', 'u': 'ଉ', 'uu': 'ଊ', 
    'e': 'ଏ', 'ee': 'ଐ', 'ai': 'ଐ', 'o': 'ଓ', 'oo': 'ଓ', 'au': 'ଔ'
  },
  matras: {
    'a': '', 'aa': 'ା', 'i': 'ି', 'ii': 'ୀ', 'u': 'ୁ', 'uu': 'ୂ', 
    'e': 'େ', 'ee': 'ୈ', 'ai': 'ୈ', 'o': 'ୋ', 'oo': 'ୋ', 'au': 'ୌ'
  },
  consonants: {
    'k': 'କ', 'kh': 'ଖ', 'g': 'ଗ', 'gh': 'ଘ',
    'ch': 'ଚ', 'chh': 'ଛ', 'j': 'ଜ', 'jh': 'ଝ',
    't': 'ତ', 'th': 'ଥ', 'd': 'ଦ', 'dh': 'ଧ',
    'T': 'ଟ', 'Th': 'ଠ', 'D': 'ଡ', 'Dh': 'ଢ',
    'n': 'ନ', 'p': 'ପ', 'ph': 'ଫ', 'b': 'ବ', 'bh': 'ଭ', 'm': 'ମ',
    'y': 'ୟ', 'r': 'ର', 'l': 'ଲ', 'v': 'ଭ', 'sh': 'ଶ', 's': 'ସ', 'h': 'ହ'
  }
};
