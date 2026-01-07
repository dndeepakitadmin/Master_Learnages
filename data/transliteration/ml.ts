
import { TransliterationMap } from './types';

export const MALAYALAM_MAP: TransliterationMap = {
  halant: '്',
  vowels: {
    'a': 'അ', 'aa': 'ആ', 'i': 'ഇ', 'ii': 'ഈ', 'u': 'ഉ', 'uu': 'ഊ', 
    'e': 'എ', 'ee': 'ഏ', 'ai': 'ഐ', 'o': 'ഒ', 'oo': 'ഓ', 'au': 'ഔ'
  },
  matras: {
    'a': '', 'aa': 'ാ', 'i': 'ി', 'ii': 'ീ', 'u': 'ു', 'uu': 'ൂ', 
    'e': 'െ', 'ee': 'േ', 'ai': 'ൈ', 'o': 'ൊ', 'oo': 'ോ', 'au': 'ൗ'
  },
  consonants: {
    'k': 'ക', 'kh': 'ഖ', 'g': 'ഗ', 'gh': 'ഘ',
    'ch': 'ച', 'chh': 'ഛ', 'j': 'ജ', 'jh': 'ഝ',
    't': 'ട', 'th': 'ഠ', 'd': 'ഡ', 'dh': 'ഢ',
    'T': 'ത', 'Th': 'ഥ', 'D': 'ദ', 'Dh': 'ധ',
    'n': 'ന', 'N': 'ണ', 'p': 'പ', 'ph': 'ഫ', 'b': 'ബ', 'bh': 'ഭ', 'm': 'മ',
    'y': 'യ', 'r': 'ര', 'l': 'ല', 'v': 'വ', 'sh': 'ശ', 'S': 'ഷ', 's': 'സ', 'h': 'ഹ'
  }
};
