// A small, editable list of words that auto-hide a condolence.
// Case-insensitive, matched as whole words. Add or remove as needed.
// This is a first-pass filter, not a substitute for the Report link.
export const bannedWords: string[] = [
  // English
  'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit', 'bitch',
  'son of a bitch', 'bastard', 'asshole', 'arsehole', 'idiot', 'stupid',
  'moron', 'imbecile', 'retard', 'cunt', 'dick', 'cock', 'pussy', 'whore',
  'slut', 'skank', 'hoe', 'nigger', 'nigga', 'faggot', 'fag', 'kike',
  'spic', 'chink', 'wetback', 'paki', 'kill yourself', 'kys', 'go die',
  'die bitch', 'rape', 'raped', 'rapist', 'paedophile', 'pedophile',

  // Hausa
  'wawa', 'wawaye', 'wawata', 'shegiya', 'shegiyai', 'dan iska', 'yan iska',
  'karuwa', 'karuwai', 'barawo', 'barayi', 'mahaukaci', 'mahaukata',
  'karya', 'makaryaci', 'shashasha', 'banza', 'banzan', 'zagi',
  'abin kunya', 'kuturu', 'kutura', 'buzu', 'buzuwa',
  'jaki', 'jakai', 'jakin', 'dan jaki', 'yar jaki',
  'banyafe maka', 'banyafe maka ba', 'banyafe ta', 'banyafe ka',
  'uba ka', 'uwar ka', 'dan uwa', 'ya isa', 'kada ka',
  'maras kunya', 'marasa kunya', 'kwikwiyo', 'kwikwiyon',
  'dilo', 'dilolin', 'karen', 'kare ka',
  'shege', 'shegen', 'shashashan', 'kafiri', 'kafirai',
];

// Returns true if the message contains any banned word as a whole word
// or a whole phrase (case-insensitive, diacritics not normalised).
export function containsBannedWord(message: string): boolean {
  const text = ' ' + message.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ') + ' ';
  for (const w of bannedWords) {
    const needle = ` ${w.toLowerCase()} `;
    if (text.includes(needle)) return true;
    // Also catch the word at the start or end of the message
    if (text.startsWith(` ${w.toLowerCase()} `)) return true;
    if (text.endsWith(` ${w.toLowerCase()} `)) return true;
  }
  return false;
}