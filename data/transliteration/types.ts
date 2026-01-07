
export interface TransliterationMap {
  halant: string;
  vowels: Record<string, string>;      // Independent: अ, आ, ಇ, ಈ
  matras: Record<string, string>;      // Dependent: ा, ి, ಾ, ಿ
  consonants: Record<string, string>;  // Base: क, ख, ಕ, ಖ
}
