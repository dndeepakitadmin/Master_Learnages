import { TransliterationMap } from './types';

export const TAMIL_MAP: TransliterationMap = {
  halant: '்',
  vowels: {
    'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ii': 'ஈ', 'u': 'உ', 'uu': 'ஊ', 
    'e': 'எ', 'ee': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oo': 'ஓ', 'au': 'ஔ'
  },
  matras: {
    'a': '', 'aa': 'ா', 'i': 'ி', 'ii': 'ீ', 'u': 'ு', 'uu': 'ூ', 
    'e': 'ெ', 'ee': 'ே', 'ai': 'ை', 'o': 'ொ', 'oo': 'ோ', 'au': 'ௌ'
  },
  consonants: {
    'k': 'க', 'g': 'க', 'ch': 'ச', 'j': 'ஜ', 't': 'ட', 'T': 'ட', 'th': 'த', 
    'n': 'ந', 'p': 'ப', 'b': 'ப', 'm': 'ம', 'y': 'ய', 'r': 'ர', 'l': 'ல', 
    'v': 'வ', 'sh': 'ஷ', 's': 'ஸ', 'h': 'ஹ'
  }
};