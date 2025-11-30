import { WordItem } from './jsonSchema';

function ensureVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  return voices.find(v => v.lang.startsWith('en')) ?? voices[0];
}

export function speakWord(word: WordItem, withMeaning: boolean) {
  if (!('speechSynthesis' in window)) {
    alert('目前瀏覽器不支援語音朗讀，請改用其他瀏覽器。');
    return;
  }
  speechSynthesis.cancel();
  const wordUtter = new SpeechSynthesisUtterance(word.word);
  wordUtter.voice = ensureVoice();
  speechSynthesis.speak(wordUtter);
  if (withMeaning) {
    const meaningUtter = new SpeechSynthesisUtterance(word.meaningZh);
    speechSynthesis.speak(meaningUtter);
  }
}
