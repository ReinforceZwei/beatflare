let timerID = null;
let interval = 25; // Default interval (ms)

self.onmessage = function(e) {
  if (e.data === 'start') {
    timerID = setInterval(() => self.postMessage('tick'), interval);
  } else if (e.data === 'stop') {
    clearInterval(timerID);
    timerID = null;
  } else if (e.data.interval) {
    interval = e.data.interval;
    if (timerID !== null) {
      // Restart timer with new interval if running
      clearInterval(timerID);
      timerID = setInterval(() => self.postMessage('tick'), interval);
    }
  }
}; 