const STORAGE_KEY = "momentum-app";

const defaultData = {

  settings: {
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    reminderTime: "21:00"
  },

  habits: [
    {
      key: "gym",
      name: "Gym"
    },
    {
      key: "csPrep",
      name: "CS Prep"
    },
    {
      key: "jobApplications",
      name: "Job Applications",
      type: "counter",
      target: 3
    },
    {
      key: "noDoomscrolling",
      name: "No Doomscrolling / YouTube (max 30 min)"
    },
    {
      key: "readBook",
      name: "Read a Book"
    },
    {
      key: "walk",
      name: "Go for a walk"
    }
  ],

  entries: {}

};

let appData =
  JSON.parse(
    localStorage.getItem(STORAGE_KEY)
  ) || defaultData;

let weeklyChart;
let habitChart;

function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(appData)
  );
}

function parseLocalDate(str) {

  const parts =
    str.split("-");

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );
}

function formatDate(date) {

  const y =
    date.getFullYear();

  const m =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const d =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function getTodayKey() {

  return formatDate(
    new Date()
  );
}

let selectedDate =
  getTodayKey();

function showPage(id) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });

  document
    .getElementById(id)
    .classList.add("active");

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {
      item.classList.remove("active-nav");
    });

  if (id === "dashboardPage") {
    document.querySelectorAll(".nav-item")[0]
      .classList.add("active-nav");
  }

  if (id === "trackerPage") {
    document.querySelectorAll(".nav-item")[1]
      .classList.add("active-nav");
  }

  if (id === "settingsPage") {
    document.querySelectorAll(".nav-item")[2]
      .classList.add("active-nav");
  }
}

function getCurrentChallengeDay() {

  const start =
    parseLocalDate(
      appData.settings.startDate
    );

  const today =
    new Date();

  start.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const diff =
    Math.floor(
      (today - start)
      / (1000 * 60 * 60 * 24)
    );

  return diff + 1;
}

function getChallengeDayFromDate(dateString) {

  const start =
    parseLocalDate(
      appData.settings.startDate
    );

  const current =
    parseLocalDate(dateString);

  start.setHours(0,0,0,0);
  current.setHours(0,0,0,0);

  const diff =
    Math.floor(
      (current - start)
      / (1000 * 60 * 60 * 24)
    );

  return diff + 1;
}

function updateDayHeaders() {

  document.getElementById(
    "dayCounter"
  ).innerText =
    `DAY ${getCurrentChallengeDay()}`;
}

function getEntry(date) {

  if (!appData.entries[date]) {
    appData.entries[date] = {};
  }

  return appData.entries[date];
}

function calculateCompletion(entry) {

  if (!entry) return 0;

  let completed = 0;

  appData.habits.forEach(habit => {

    if (habit.type === "counter") {

      if (
        (entry[habit.key] || 0)
        >= habit.target
      ) {
        completed++;
      }

    } else {

      if (entry[habit.key]) {
        completed++;
      }
    }
  });

  return completed
    / appData.habits.length;
}

function renderTasks(date) {

  selectedDate = date;

  showPage("trackerPage");

  document.getElementById(
    "selectedDateTitle"
  ).innerText =
    `DAY ${
      getChallengeDayFromDate(date)
    }`;

  const container =
    document.getElementById("tasks");

  container.innerHTML = "";

  const entry =
    getEntry(date);

  appData.habits.forEach(habit => {

    const card =
      document.createElement("div");

    card.className = "task-card";

    if (habit.type === "counter") {

      const value =
        entry[habit.key] || 0;

      card.innerHTML = `
        <div class="task-left">
          <h3>${habit.name}</h3>
          <p>${value}/${habit.target}</p>
        </div>

        <div class="counter">
          <button class="minus-btn">−</button>
          <span>${value}</span>
          <button class="plus-btn">+</button>
        </div>
      `;

      const minusBtn =
        card.querySelector(".minus-btn");

      const plusBtn =
        card.querySelector(".plus-btn");

      minusBtn.onclick = () => {

        entry[habit.key] =
          Math.max(0, value - 1);

        saveData();

        renderTasks(date);

        refreshDashboard();
      };

      plusBtn.onclick = () => {

        entry[habit.key] =
          Math.min(
            habit.target,
            value + 1
          );

        saveData();

        renderTasks(date);

        refreshDashboard();
      };

    } else {

      const active =
        entry[habit.key];

      card.innerHTML = `
        <div class="task-left">
          <h3>${habit.name}</h3>
        </div>

        <div class="
          checkbox
          ${active ? "active" : ""}
        "></div>
      `;

      card.onclick = () => {

        entry[habit.key] =
          !entry[habit.key];

        saveData();

        renderTasks(date);

        refreshDashboard();
      };
    }

    container.appendChild(card);
  });
}

function renderHeatmap() {

  const heatmap =
    document.getElementById("heatmap");

  heatmap.innerHTML = "";

  const start =
    parseLocalDate(
      appData.settings.startDate
    );

  const end =
    parseLocalDate(
      appData.settings.endDate
    );

  for (
    let d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {

    const key =
      formatDate(d);

    const completion =
      calculateCompletion(
        appData.entries[key]
      );

    const square =
      document.createElement("div");

    square.classList.add("day");

    if (completion > 0) {

      square.classList.add(
        `level-${
          Math.ceil(completion * 4)
        }`
      );
    }

    square.onclick = () => {
      renderTasks(key);
    };

    heatmap.appendChild(square);
  }
}

function calculateStreak() {

  let streak = 0;

  const today =
    new Date();

  today.setHours(0,0,0,0);

  while (true) {

    const key =
      formatDate(today);

    const completion =
      calculateCompletion(
        appData.entries[key]
      );

    if (completion === 1) {

      streak++;

      today.setDate(
        today.getDate() - 1
      );

    } else {
      break;
    }
  }

  return streak;
}

function renderStats() {

  document.getElementById(
    "streakCount"
  ).innerText =
    calculateStreak();

  const entries =
    Object.values(appData.entries);

  const perfectDays =
    entries.filter(
      entry =>
        calculateCompletion(entry)
        === 1
    ).length;

  const completionRate =
    entries.length
      ? Math.round(
          (
            perfectDays
            / entries.length
          ) * 100
        )
      : 0;

  document.getElementById(
    "completionRate"
  ).innerText =
    `${completionRate}%`;
}

function renderCharts() {

  const weeklyCtx =
    document.getElementById(
      "weeklyChart"
    );

  const habitCtx =
    document.getElementById(
      "habitChart"
    );

  const labels = [];
  const weeklyData = [];

  for (let i = 6; i >= 0; i--) {

    const d =
      new Date();

    d.setDate(
      d.getDate() - i
    );

    const key =
      formatDate(d);

    labels.push(
      d.toLocaleDateString(
        "en-US",
        {
          weekday: "short"
        }
      )
    );

    weeklyData.push(
      Math.round(
        calculateCompletion(
          appData.entries[key]
        ) * 100
      )
    );
  }

  if (weeklyChart) {
    weeklyChart.destroy();
  }

  weeklyChart =
    new Chart(weeklyCtx, {

      type: "line",

      data: {

        labels: labels,

        datasets: [{

          data: weeklyData,

          borderColor:
            "#7BF1A8",

          backgroundColor:
            "rgba(123,241,168,0.15)",

          fill: true,

          tension: 0.4,

          pointRadius: 5,

          pointBackgroundColor:
            "#7BF1A8"
        }]
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false
          }
        },

        scales: {

          y: {

            min: 0,
            max: 100,

            ticks: {
              color: "#8B8B93"
            },

            grid: {
              color:
                "rgba(255,255,255,0.05)"
            }
          },

          x: {

            ticks: {
              color: "#8B8B93"
            },

            grid: {
              display: false
            }
          }
        }
      }
    });

  const habitCounts =
    appData.habits.map(habit => {

      let count = 0;

      Object.values(
        appData.entries
      ).forEach(entry => {

        if (
          habit.type === "counter"
        ) {

          if (
            (entry[habit.key] || 0)
            >= habit.target
          ) {
            count++;
          }

        } else {

          if (entry[habit.key]) {
            count++;
          }
        }
      });

      return count;
    });

  if (habitChart) {
    habitChart.destroy();
  }

  habitChart =
    new Chart(habitCtx, {

      type: "bar",

      data: {

        labels:
          appData.habits.map(
            h => h.name
          ),

        datasets: [{

          data: habitCounts,

          backgroundColor:
            "#7BF1A8",

          borderRadius: 12
        }]
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false
          }
        },

        scales: {

          y: {

            ticks: {
              color: "#8B8B93"
            },

            grid: {
              color:
                "rgba(255,255,255,0.05)"
            }
          },

          x: {

            ticks: {
              color: "#8B8B93"
            },

            grid: {
              display: false
            }
          }
        }
      }
    });
}

function renderHabitEditor() {

  const container =
    document.getElementById(
      "habitEditor"
    );

  container.innerHTML = "";

  appData.habits.forEach(
    (habit, index) => {

      const input =
        document.createElement("input");

      input.value =
        habit.name;

      input.oninput = e => {

        appData.habits[index].name =
          e.target.value;

        saveData();

        refreshDashboard();
      };

      container.appendChild(input);
    });
}

function refreshDashboard() {

  updateDayHeaders();

  renderHeatmap();

  renderStats();

  renderCharts();

  renderHabitEditor();
}

function openToday() {

  renderTasks(
    getTodayKey()
  );
}

document.getElementById(
  "addHabitBtn"
).onclick = () => {

  appData.habits.push({

    key:
      "habit"
      + Date.now(),

    name:
      "New Habit"
  });

  saveData();

  renderHabitEditor();

  renderTasks(selectedDate);

  refreshDashboard();
};

document.getElementById(
  "saveSettingsBtn"
).onclick = () => {

  appData.settings.reminderTime =
    document.getElementById(
      "reminderTimeInput"
    ).value;

  saveData();

  alert("Saved");
};

document.getElementById(
  "reminderTimeInput"
).value =
  appData.settings.reminderTime;

refreshDashboard();

openToday();