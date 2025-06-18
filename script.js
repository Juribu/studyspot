const timer = document.getElementById("time");
const start = document.getElementById("start");
const pomodoro = document.getElementById("pomodoro");
const short = document.getElementById("short-break");
const long = document.getElementById("long-break");

let timeLeft = 1500;
let isRunning = false;
let interval;

const updateTimer = () => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timer.innerHTML = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const startTimer = () => {
  if (isRunning) {
    clearInterval(interval);
    start.textContent = "Start";
    isRunning = false;
  } else {
    interval = setInterval(() => {
      timeLeft--;
      updateTimer();

      if (timeLeft === 0) {
        clearInterval(interval);
        isRunning = false;
        start.textContent = "Start";
        alert("times up!");
        timeLeft = 1500;
        updateTimer();
      }
    }, 1000);

    start.textContent = "Pause";
    isRunning = true;
  }
};

const setActiveButton = (activeButton) => {
  document.querySelectorAll(".timer-right button").forEach((button) => {
    button.classList.remove("active");
  });
  activeButton.classList.add("active");

  clearInterval(interval);
  isRunning = false;
  start.textContent = "Start";
};

const setPomodoro = () => {
  timeLeft = 1500;
  updateTimer();
  setActiveButton(pomodoro);
};

const setShortBreak = () => {
  timeLeft = 300;
  updateTimer();
  setActiveButton(short);
};

const setLongBreak = () => {
  timeLeft = 600;
  updateTimer();
  setActiveButton(long);
};

start.addEventListener("click", startTimer);
long.addEventListener("click", setLongBreak);
short.addEventListener("click", setShortBreak);
pomodoro.addEventListener("click", setPomodoro);
