
import { TransliterationMap } from './types';

export const ARABIC_MAP: TransliterationMap = {
  halant: '',
  vowels: {
    'a': 'ا', 'i': 'ي', 'u': 'و'
  },
  matras: {},
  consonants: {
    'b': 'ب', 't': 'ت', 'th': 'ث', 'j': 'ج', 'h': 'ح', 'kh': 'خ', 'd': 'د', 'dh': 'ذ', 'r': 'ر', 'z': 'ز',
    's': 'س', 'sh': 'ش', 'f': 'ف', 'q': 'ق', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'y': 'ي'
  }
};
