const columns = ["todo", "inProgress", "done"];

columns.forEach((column) => {
  document
    .getElementById(`sort-${column}`)
    .addEventListener("click", () => sortTasks(column));

  document
    .getElementById(`col-${column}`)
    .addEventListener("click", () => changeTasksColor(column));

  document
    .getElementById(`add-${column}`)
    .addEventListener("click", () => addTask(column));
});

function getLocalStorageData() {
  let data = JSON.parse(localStorage.getItem("kanban-data"));

  if (data == null)
    data = {
      todo: [],
      inProgress: [],
      done: [],
    };

  return data;
}

function getRandomColor() {
  const colors = [
    "#F8E8E8",
    "#FDE2E4",
    "#FFF1E6",
    "#F9F1F0",
    "#F7F7F7",
    "#E8F6EF",
    "#E3F2FD",
    "#E0F7FA",
    "#E8EAF6",
    "#F3E5F5",
    "#FCE4EC",
    "#FFF8E1",
    "#F1F8E9",
    "#E8F5E9",
    "#E0F2F1",
    "#F9FBE7",
    "#FFFDE7",
    "#F3F4ED",
    "#ECEFF1",
    "#F5F5F5",
    "#FDEBD0",
    "#FAD7A0",
    "#F9E79F",
    "#FCF3CF",
    "#F6DDCC",
    "#D6EAF8",
    "#D1F2EB",
    "#D5F5E3",
    "#E8DAEF",
    "#FADBD8",
  ];

  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx];
}

function addTask(column) {
  let data = getLocalStorageData();

  data[column].push({
    id: Date.now(),
    text: "Nowe zadanie",
    color: getRandomColor(),
  });

  localStorage.setItem("kanban-data", JSON.stringify(data));

  reloadTasks();
}

function changeTask(column, taskId, event) {
  let data = getLocalStorageData();

  data[column] = data[column].map((task) => {
    if (task.id == taskId) task.text = event.textContent;

    return task;
  });

  localStorage.setItem("kanban-data", JSON.stringify(data));
}

function changeTaskColor(column, taskId) {
  let data = getLocalStorageData();

  data[column] = data[column].map((task) => {
    if (task.id == taskId) task.color = getRandomColor();

    return task;
  });

  localStorage.setItem("kanban-data", JSON.stringify(data));

  reloadTasks();
}

function changeTasksColor(column) {
  let data = getLocalStorageData();

  data[column] = data[column].map((task) => {
    task.color = getRandomColor();

    return task;
  });

  localStorage.setItem("kanban-data", JSON.stringify(data));

  reloadTasks();
}

function removeTask(column, taskId) {
  let data = getLocalStorageData();

  data[column] = data[column].filter(({ id }) => id != taskId);
  localStorage.setItem("kanban-data", JSON.stringify(data));

  reloadTasks();
}

function sortTasks(column) {
  let data = getLocalStorageData();
  let sort = localStorage.getItem(`sort-${column}`) ?? "desc";

  data[column] = data[column].sort((taskA, taskB) =>
    sort === "desc" ? taskB.id - taskA.id : taskA.id - taskB.id
  );

  localStorage.setItem("kanban-data", JSON.stringify(data));
  localStorage.setItem(`sort-${column}`, sort === "desc" ? "asc" : "desc");

  reloadTasks();
}

function moveTask(column, newColumn, taskId) {
  let data = getLocalStorageData();

  const task = data[column].find((task) => task.id == taskId);

  data[newColumn].push(task);

  localStorage.setItem("kanban-data", JSON.stringify(data));

  removeTask(column, taskId);
}

function reloadTasks() {
  const data = getLocalStorageData();

  columns.forEach((column) => {
    const columnData = data[column];

    let html = "";

    columnData.forEach(({ id, text, color }) => {
      const right = column != columns[columns.length - 1];
      const left = column != columns[0];

      const nextCol = column === "todo" ? "inProgress" : "done";
      const prevCol = column === "inProgress" ? "todo" : "done";

      const rightHtml = `
        <button id="right-todo" class="right-btn" onclick="moveTask('${column}' , '${nextCol}', '${id}')">→</button>
      `;

      const leftHtml = `
        <button id="left-todo" class="left-btn" onclick="moveTask('${column}' , '${prevCol}', '${id}')">←</button>
      `;

      html += `
        <div id="${id}" class="task" style="background-color: ${color}">
            <div class="header-actions">
              <button id="color-todo" class="color-btn" onclick="changeTaskColor('${column}', '${id}')">🎨</button>
              <button id="remove-todo" class="remove-btn" onclick="removeTask('${column}', '${id}')">X</button>
            </div>

            <div class="task-text" contenteditable="true" onblur="changeTask('${column}', '${id}', this)">
              ${text}
            </div>

            <div class="task-actions">
              ${left ? leftHtml : ""}
              ${right ? rightHtml : ""}
            </div>
          </div>
        `;
    });

    const columnElement = document.getElementById(column);
    columnElement.innerHTML = html;
  });
}

reloadTasks();
