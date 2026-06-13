// Content script for AI sites like ChatGPT
// Run at document_end to ensure DOM is ready

chrome.storage.sync.get(['aiNoiseInjection'], (result) => {
  try {
    if (result.aiNoiseInjection) {
      const injectNoise = (input) => {
        const noise = ` [PFH_NOISE:${Math.random().toString(36).slice(2)}]`;
        return input + noise;
      };

      const observer = new MutationObserver(() => {
        const textareas = document.querySelectorAll('textarea, input[type="text"]');
        textareas.forEach((ta) => {
          if (!ta.dataset.pfhHooked) {
            ta.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                ta.value = injectNoise(ta.value);
              }
            });
            ta.dataset.pfhHooked = true;
          }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      console.log('AI noise injection enabled');
    }
  } catch (e) {
    console.error('AI noise injection error:', e);
  }
});