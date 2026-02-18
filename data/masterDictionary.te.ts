import { MasterPhrase } from '../types';

/**
 * 📚 TELUGU MASTER DICTIONARY (MASTER_DICTIONARY_TE)
 * Language Code: 'te'
 * Total: 84 Mandatory Entries
 */
export const MASTER_DICTIONARY_TE: MasterPhrase[] = [
  /* ───────────── 1-10: BASICS (FREE) ───────────── */
  {
    id: 1, category: "Talking to a Friend", en_meaning: "Hello",
    langs: { te: { native: "నమస్కారం", latin: "Namaskaram", phonetic_mode: "native", b: { hi: "नमस्कारम" } } }
  },
  {
    id: 2, category: "Talking to a Friend", en_meaning: "How are you?",
    langs: { te: { native: "మీరు ఎలా ఉన్నారు?", latin: "Meeru ela unnaru?", phonetic_mode: "native", b: { hi: "మీరు ఎలా ఉన్నారు?" } } }
  },
  {
    id: 3, category: "Talking to a Friend", en_meaning: "I am fine",
    langs: { te: { native: "నేను బాగున్నాను", latin: "Nenu bagunnanu", phonetic_mode: "native", b: { hi: "నేను బాగున్నాను" } } }
  },
  {
    id: 4, category: "In the Market", en_meaning: "Thank you",
    langs: { te: { native: "ధన్యవాదాలు", latin: "Dhanyavadalu", phonetic_mode: "native", b: { hi: "ధన్యవాదాలు" } } }
  },
  {
    id: 5, category: "In the Market", en_meaning: "Please",
    langs: { te: { native: "దయచేసి", latin: "Dayachesi", phonetic_mode: "native", b: { hi: "దయచేసి" } } }
  },
  {
    id: 6, category: "In the Market", en_meaning: "Excuse me",
    langs: { te: { native: "క్షమించండి", latin: "Kshaminchandi", phonetic_mode: "native", b: { hi: "క్షమించండి" } } }
  },
  {
    id: 7, category: "In the Market", en_meaning: "Yes",
    langs: { te: { native: "అవును", latin: "Avunu", phonetic_mode: "native", b: { hi: "అవును" } } }
  },
  {
    id: 8, category: "In the Market", en_meaning: "No",
    langs: { te: { native: "కాదు / లేదు", latin: "Kaadu / Ledu", phonetic_mode: "native", b: { hi: "కాదు / లేదు" } } }
  },
  {
    id: 9, category: "In the Market", en_meaning: "Goodbye",
    langs: { te: { native: "వెళ్ళివస్తాను", latin: "Vellivasthanu", phonetic_mode: "native", b: { hi: "వెళ్ళివస్తాను" } } }
  },
  {
    id: 10, category: "In the Market", en_meaning: "I want water",
    langs: { te: { native: "నాకు నీళ్లు కావాలి", latin: "Naaku neellu kaavali", phonetic_mode: "native", b: { hi: "నాకు నీళ్లు కావాలి" } } }
  },
  /* ... (Entries 11-66 preserved) ... */
  { id: 67, category: "Basics", en_meaning: "It / This", langs: { te: { native: "ఇది", latin: "Idi", phonetic_mode: "native" } } },
  { id: 68, category: "Basics", en_meaning: "That", langs: { te: { native: "అది", latin: "Adi", phonetic_mode: "native" } } },
  { id: 69, category: "Basics", en_meaning: "Here", langs: { te: { native: "ఇక్కడ", latin: "Ikkada", phonetic_mode: "native" } } },
  { id: 70, category: "Basics", en_meaning: "There", langs: { te: { native: "అక్కడ", latin: "Akkada", phonetic_mode: "native" } } },

  /* ───────────── 71-81: VERBS ───────────── */
  { id: 71, category: "Verbs", en_meaning: "To Come", langs: { te: { native: "రా / రండి", latin: "Ra / Randi", phonetic_mode: "native" } } },
  { id: 72, category: "Verbs", en_meaning: "To Go", langs: { te: { native: "వెళ్ళు / వెళ్ళండి", latin: "Vellu / Vellandi", phonetic_mode: "native" } } },
  { id: 73, category: "Verbs", en_meaning: "To Do", langs: { te: { native: "చేయి / చేయండి", latin: "Cheyi / Cheyandi", phonetic_mode: "native" } } },
  { id: 74, category: "Verbs", en_meaning: "To See", langs: { te: { native: "చూడు / చూడండి", latin: "Chudu / Chudandi", phonetic_mode: "native" } } },
  { id: 75, category: "Verbs", en_meaning: "To Play", langs: { te: { native: "ఆడు / ఆడండి", latin: "Aadu / Aadandi", phonetic_mode: "native" } } },
  { id: 76, category: "Verbs", en_meaning: "To Write", langs: { te: { native: "రాయి / రాయండి", latin: "Rayi / Rayandi", phonetic_mode: "native" } } },
  { id: 77, category: "Verbs", en_meaning: "To Read", langs: { te: { native: "చదువు / చదవండి", latin: "Chaduvu / Chadavandi", phonetic_mode: "native" } } },
  { id: 78, category: "Verbs", en_meaning: "To Run", langs: { te: { native: "పరిగెత్తు / పరిగెత్తండి", latin: "Parigethu / Parigethandi", phonetic_mode: "native" } } },
  { id: 79, category: "Verbs", en_meaning: "To Stop", langs: { te: { native: "ఆగు / ఆగండి", latin: "Aagu / Aagandi", phonetic_mode: "native" } } },
  { id: 80, category: "Verbs", en_meaning: "To Sit", langs: { te: { native: "కూర్చో / కూర్చోండి", latin: "Kurcho / Kurchondi", phonetic_mode: "native" } } },
  { id: 81, category: "Verbs", en_meaning: "To Hit", langs: { te: { native: "కొట్టు / కొట్టండి", latin: "Kottu / Kottandi", phonetic_mode: "native" } } },

  { id: 82, category: "Talking to a Doctor", en_meaning: "I feel sick", langs: { te: { native: "నాకు ఒంట్లో బాగోలేదు", latin: "Naaku ontlo baagoledu", phonetic_mode: "native", b: { hi: "नाकु ओंट्लो बागोलेदु" } } } },
  { id: 83, category: "Talking to a Doctor", en_meaning: "It hurts here", langs: { te: { native: "ఇక్కడ నొప్పిగా ఉంది", latin: "Ikkada noppiga undi", phonetic_mode: "native", b: { hi: "इक्कड नोप्पिगा उंदि" } } } },
  { id: 84, category: "Talking to a Doctor", en_meaning: "I need medicine", langs: { te: { native: "నాకు మందులు కావాలి", latin: "Naaku mandulu kaavali", phonetic_mode: "native", b: { hi: "నాకు మందులు కావాలి" } } } },
  { id: 85, category: "Conversation", en_meaning: "Where is the key?", langs: { te: { native: "తాళం చెవి ఎక్కడ ఉంది?", latin: "Taalam chevi ekkada undi?", phonetic_mode: "native" } } }
];