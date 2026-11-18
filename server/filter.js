'use strict';
/* Profanity filter + ban durations — same rules as the app's (app/data.js)
   Two severities: "mild" (swearing) and "severe" (insults aimed at people / family, slurs).
   Ban length: base days for the severity, doubled on every repeat of the same severity. */
const SEVERE_EXACT = ['orospu', 'orosbu', 'kahpe', 'pezevenk', 'piç', 'ibne', 'ananı', 'anani', 'ananızı', 'gavat', 'puşt', 'pust', 'amına', 'amina', 'aminakoyim',
  'cunt', 'motherfucker', 'whore', 'slut'];
const MILD_EXACT = ['amk', 'aq', 'amq', 'oç', 'siktir', 'sik', 'sikik', 'sikerim', 'sikeyim', 'siktim', 'göt', 'götveren', 'yarak', 'yarrak', 'yarram',
  'yavşak', 'yavsak', 'amcık', 'amcik', 'şerefsiz', 'serefsiz', 'dalyarak', 'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'bastard', 'dickhead'];
const SEVERE_STEMS = ['orospu', 'pezevenk', 'amınakoy', 'aminakoy', 'motherf'];
const MILD_STEMS = ['siktir', 'sikerim', 'sikeyim', 'yarrak', 'yavşak', 'amcık', 'fuck', 'bitch', 'asshole'];
const BAN_BASE_DAYS = { mild: 1, severe: 3 };
const BAN_MAX_DAYS = 365;

function normBad(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')
    .replace(/(.)\1{2,}/g, '$1$1');
}
/** Returns null, "mild" or "severe" */
function profanityLevel(s) {
  if (!s) return null;
  const n = normBad(s);
  const collapsed = n.replace(/(.)\1+/g, '$1');
  const split = x => x.split(/[^a-zçğıöşüâî]+/).filter(Boolean);
  const tokens = [...split(n), ...split(collapsed)];
  const joined = n.replace(/[^a-zçğıöşü]/g, ''), joinedC = collapsed.replace(/[^a-zçğıöşü]/g, '');
  const stem = list => list.some(st => joined.includes(st) || joinedC.includes(st));
  if (tokens.some(t => SEVERE_EXACT.includes(t)) || stem(SEVERE_STEMS)) return 'severe';
  if (tokens.some(t => MILD_EXACT.includes(t)) || stem(MILD_STEMS)) return 'mild';
  return null;
}
const hasProfanity = s => !!profanityLevel(s);
/** count = how many times this severity was committed, including this one (1 = first) */
const banDays = (level, count) => Math.min(BAN_MAX_DAYS, (BAN_BASE_DAYS[level] || 1) * 2 ** Math.max(0, count - 1));

module.exports = { hasProfanity, profanityLevel, banDays };
