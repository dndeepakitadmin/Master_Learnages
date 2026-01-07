
import { TransliterationMap } from './types';

export const HINDI_MAP: TransliterationMap = {
  halant: '्',
  vowels: {
    'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ', 
    'e': 'ए', 'ee': 'ऐ', 'ai': 'ऐ', 'o': 'ओ', 'oo': 'ओ', 'au': 'औ'
  },
  matras: {
    'a': '', // Implicit schwa
    'aa': 'ा', 'i': 'ि', 'ii': 'ी', 'u': 'ु', 'uu': 'ू', 
    'e': 'े', 'ee': 'ै', 'ai': 'ै', 'o': 'ो', 'oo': 'ो', 'au': 'ौ'
  },
  consonants: {
    'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ',
    'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध',
    'T': 'ट', 'Th': 'ठ', 'D': 'ड', 'Dh': 'ढ',
    'n': 'न', 'N': 'ण', 'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
    'y': 'ಯ', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व', 'sh': 'श', 'S': 'ष', 's': 'स', 'h': 'ह'
  }
};
