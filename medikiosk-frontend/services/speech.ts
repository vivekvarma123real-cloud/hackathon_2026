export const speakText = (text: string, lang: string = 'en-US'): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    } else {
      resolve();
    }
  });
};

export const checkRedFlags = (text: string): boolean => {
  const lower = text.toLowerCase();
  const redFlags = ['severe chest pain', 'difficulty breathing', 'faint', 'unconscious', 'blood', 'severe bleeding'];
  return redFlags.some((flag) => lower.includes(flag));
};
