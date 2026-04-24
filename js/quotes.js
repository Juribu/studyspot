/**
 * Quote Rotation Module
 * Rotates the motivational quote once per hour.
 * Deterministic: the same hour always shows the same quote across refreshes.
 * @module QuoteModule
 */
const QuoteModule = (function () {
  const quotes = [
    'Strive for progress, not perfection',
    'Small steps every day',
    'Discipline is choosing between what you want now and what you want most',
    'The secret of getting ahead is getting started',
    'Done is better than perfect',
    'Focus on being productive instead of busy',
    'You don\'t have to be great to start, but you have to start to be great',
    'Your future is created by what you do today',
    'Motivation gets you going, habit keeps you growing',
    'The expert in anything was once a beginner',
    'One page a day is 365 pages a year',
    'Slow progress is still progress',
    'Work hard in silence, let success make the noise',
    'The best way to predict the future is to create it',
    'Success is the sum of small efforts repeated day in and day out',
    'Deep work beats busy work',
    'Don\'t watch the clock; do what it does. Keep going',
    'You are what you repeatedly do',
    'A little progress each day adds up to big results',
    'The only way to do great work is to love what you do'
  ];

  const elements = {
    quote: document.getElementById('quote')
  };

  const pickQuote = () => {
    const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
    return quotes[hoursSinceEpoch % quotes.length];
  };

  const render = () => {
    if (!elements.quote) return;
    elements.quote.textContent = `"${pickQuote()}"`;
  };

  const scheduleNextRotation = () => {
    const now = new Date();
    const msUntilNextHour =
      (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();

    setTimeout(() => {
      render();
      setInterval(render, 60 * 60 * 1000);
    }, msUntilNextHour);
  };

  return {
    init() {
      render();
      scheduleNextRotation();
      console.log('Quote module initialized');
    }
  };
})();
