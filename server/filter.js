'use strict';
/* Uygunsuz kelime filtresi — uygulamadaki (app/data.js) ile aynı kurallar */
const BAD_EXACT = ['amk', 'aq', 'amq', 'amına', 'amina', 'aminakoyim', 'oç', 'siktir', 'sik', 'sikik', 'sikerim', 'sikeyim', 'siktim',
  'göt', 'götveren', 'piç', 'yarak', 'yarrak', 'yarram', 'orospu', 'orosbu', 'kahpe', 'pezevenk', 'yavşak', 'yavsak', 'ibne',
  'amcık', 'amcik', 'ananı', 'anani', 'ananızı', 'şerefsiz', 'serefsiz', 'gavat', 'dalyarak', 'puşt', 'pust',
  'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'motherfucker', 'whore', 'slut', 'dickhead'];
const BAD_STEMS = ['siktir', 'sikerim', 'sikeyim', 'yarrak', 'orospu', 'pezevenk', 'yavşak', 'amcık', 'amınakoy', 'aminakoy', 'fuck', 'motherf', 'bitch', 'asshole'];

function normBad(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')
    .replace(/(.)\1{2,}/g, '$1$1');
}
function hasProfanity(s) {
  if (!s) return false;
  const n = normBad(s);
  const collapsed = n.replace(/(.)\1+/g, '$1');
  const split = x => x.split(/[^a-zçğıöşüâî]+/).filter(Boolean);
  const tokens = [...split(n), ...split(collapsed)];
  if (tokens.some(t => BAD_EXACT.includes(t))) return true;
  const joined = n.replace(/[^a-zçğıöşü]/g, '');
  const joinedC = collapsed.replace(/[^a-zçğıöşü]/g, '');
  return BAD_STEMS.some(st => joined.includes(st) || joinedC.includes(st));
}
module.exports = { hasProfanity };
