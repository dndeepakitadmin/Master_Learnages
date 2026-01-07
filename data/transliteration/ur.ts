
import { TransliterationMap } from './types';

export const URDU_MAP: TransliterationMap = {
  halant: '', // Urdu is not an Indic syllabic script in the same Unicode way
  vowels: {
    'a': 'ا', 'aa': 'آ', 'i': 'ی', 'ii': 'ی', 'u': 'و', 'uu': 'و', 'e': 'ے', 'o': 'و'
  },
  matras: {},
  consonants: {
    'k': 'ک', 'kh': 'کھ', 'g': 'گ', 'ch': 'چ', 'j': 'ج', 't': 'ت', 'T': 'ٹ', 'p': 'پ', 'b': 'ب', 'm': 'م',
    'y': 'ی', 'r': 'ر', 'l': 'ل', 'w': 'و', 'sh': 'ش', 's': 'س', 'h': 'ہ'
  }
};
