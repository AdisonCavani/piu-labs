import { store } from "./store.js";

const indicator = document.createElement("div");
indicator.classList.add("drop-indicator");

export function initialize() {
  const loadingEl = document.getElementById("loader");
  const mainLayout = document.querySelector("main");

  const taskDialog = document.getElementById("task-dialog");
  const usersDialog = document.getElementById("users-dialog");
  const editAssigneeDialog = document.getElementById("edit-assignee-dialog");
  const statsDialog = document.getElementById("stats-dialog");

  const cancelButton = document.getElementById("cancel-btn");
  const closeUsersBtn = document.getElementById("close-users-btn");
  const manageUsersBtn = document.getElementById("manage-users-btn");
  const closeEditBtn = document.getElementById("close-edit-btn");
  const statsBtn = document.getElementById("stats-btn");
  const closeStatsBtn = document.getElementById("close-stats-btn");

  const taskForm = document.getElementById("task-form");
  const userForm = document.getElementById("user-form");
  const editAssigneeForm = document.getElementById("edit-assignee-form");

  const searchInput = document.getElementById("search-input");

  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  setInterval(() => checkDeadlines(), 10000);

  cancelButton.addEventListener("click", () => {
    taskDialog.close();
  });

  closeUsersBtn.addEventListener("click", () => {
    usersDialog.close();
  });

  manageUsersBtn.addEventListener("click", () => {
    usersDialog.showModal();
  });

  closeEditBtn.addEventListener("click", () => {
    editAssigneeDialog.close()
  });

  closeStatsBtn.addEventListener("click", () => {
    statsDialog.close()
  });

  statsBtn.addEventListener("click", () => {
    drawChart();
    statsDialog.showModal();
  });

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(taskForm);
    const { name, priorityId, assigneeId, deadline } = Object.fromEntries(formData.entries());

    store.addTask(String(name), Number(priorityId), assigneeId || null, deadline || null);

    taskDialog.close();
    taskForm.reset();
    resetSelectColor(document.getElementById("assignee-select"));
  });

  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(userForm);
    const { name, color } = Object.fromEntries(formData.entries());

    store.addUser(String(name), String(color));
    userForm.reset();
  });

  editAssigneeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(editAssigneeForm);
    const { taskId, assigneeId } = Object.fromEntries(formData.entries());

    store.updateTask(taskId, { assigneeId: assigneeId || null });

    editAssigneeDialog.close();
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const allTasks = document.querySelectorAll('.task');

      allTasks.forEach(taskEl => {
        const taskName = taskEl.querySelector('.task-name').textContent.toLowerCase();
        const taskTag = taskEl.querySelector('.task-tag').textContent.toLowerCase();

        const assigneeTitle = taskEl.querySelector('.task-assignee').title.toLowerCase();

        if (taskName.includes(query) || taskTag.includes(query) || assigneeTitle.includes(query)) {
          taskEl.style.display = "";
        } else {
          taskEl.style.display = "none";
        }
      });
    });
  }

  store.subscribe("loading", (loading) => {
    if (loading) loadingEl.style.display = undefined;
    else loadingEl.style.display = "none";
  });

  store.subscribe("boards", (boards) => {
    mainLayout.innerHTML = "";
    boards.forEach((board) => {
      const { id, name } = board;
      const tasks = store.tasks.filter((task) => task.boardId === id);

      mainLayout.appendChild(createBoardEl(id, name, tasks.length));
    });
  });

  store.subscribe("priorities", (priorities) => {
    const prioritiesSelectEl = document.getElementById("priority-select");
    prioritiesSelectEl.innerHTML = "";

    priorities.forEach((priority) => {
      const option = document.createElement("option");

      option.value = priority.id;
      option.textContent = `${priority.icon} ${priority.name}`;

      prioritiesSelectEl.appendChild(option);
    });
  });

  store.subscribe("users", (users) => {
    const assigneeSelect = document.getElementById("assignee-select");
    const editAssigneeSelect = document.getElementById("edit-assignee-select");

    const fillSelect = (selectElement) => {
      selectElement.innerHTML = '<option value="">-- Brak --</option>';
      users.forEach(user => {
        const opt = document.createElement("option");
        opt.value = user.id;
        opt.textContent = user.name;
        opt.style.backgroundColor = user.color;
        opt.style.color = "#fff";

        selectElement.appendChild(opt);
      });

      selectElement.onchange = function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.style.backgroundColor) {
          this.style.backgroundColor = selectedOption.style.backgroundColor;
          this.style.color = "#fff";
          this.style.textShadow = "0px 0px 2px #000";
        } else {
          resetSelectColor(this);
        }
      };
    };

    fillSelect(assigneeSelect);
    fillSelect(editAssigneeSelect);

    const usersList = document.getElementById("users-list");
    usersList.innerHTML = "";

    users.forEach(user => {
      const li = document.createElement("li");
      li.className = "user-item";
      li.innerHTML = `
            <div class="user-info">
                <div class="avatar" style="background-color: ${user.color}">${user.name[0]}</div>
                <span>${user.name}</span>
            </div>
            <button class="delete-user-btn" data-id="${user.id}">🗑️</button>
        `;

      li.querySelector("button").addEventListener("click", () => {
        if(confirm("Usunąć?")) store.removeUser(user.id);
      });

      usersList.appendChild(li);
    });
  });

  store.subscribe("tasks", (tasks) => {
    store.boards.forEach(({ id }) => {
      const count = tasks.filter((task) => task.boardId === id).length;

      const countEl = document.querySelector(
        `[data-board-id="${id}"][data-role="count"]`
      );

      if (countEl) countEl.textContent = count;
    });

    tasks.forEach((task) => {
      const taskExists = document.querySelector(`[data-task-id="${task.id}"]`);

      if (taskExists) {
        const newEl = createTaskEl(task);
        taskExists.replaceWith(newEl);
        return;
      }

      const boardEl = document.querySelector(
        `[data-board-id="${task.boardId}"][data-role="tasks"]`
      );

      const taskEl = createTaskEl(task);

      if (boardEl) boardEl.appendChild(taskEl);
    });

    const renderedTasks = document.querySelectorAll('[data-role="task"]');

    renderedTasks.forEach((renderedTask) => {
      const taskId = renderedTask.dataset.taskId;

      if (!tasks.some((task) => task.id == taskId)) renderedTask.remove();
    });
  });

  const themeCheckbox = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    themeCheckbox.checked = true;
  }

  themeCheckbox.addEventListener("change", () => {
    if (themeCheckbox.checked) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

function drawChart() {
  const canvas = document.getElementById("stats-canvas");
  const legend = document.getElementById("stats-legend");

  if (!canvas || !legend) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const radius = Math.min(width, height) / 2;

  ctx.clearRect(0, 0, width, height);
  legend.innerHTML = "";

  const tasks = store.tasks;
  const boards = store.boards;
  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#e0e0e0";
    ctx.fill();
    legend.innerHTML = "<div>Brak zadań do wyświetlenia</div>";
    return;
  }

  const boardColors = {
    1: "#4b7bec",
    2: "#fed330",
    3: "#26de81",
  };
  const defaultColor = "#a5b1c2";

  let startAngle = 0;

  boards.forEach(board => {
    const count = tasks.filter(t => t.boardId === board.id).length;
    if (count === 0) return;

    // obliczanie wycinka koła
    const sliceAngle = (count / totalTasks) * 2 * Math.PI;
    const color = boardColors[board.id] || defaultColor;

    // wycinek
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2); // Środek
    ctx.arc(width / 2, height / 2, radius, startAngle, startAngle + sliceAngle);
    ctx.fillStyle = color;
    ctx.fill();

    // legenda
    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";
    legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${color}"></div>
            <span>${board.name}: <strong>${count}</strong> (${Math.round(count/totalTasks*100)}%)</span>
        `;
    legend.appendChild(legendItem);

    startAngle += sliceAngle;
  });
}

function checkDeadlines() {
  const now = new Date();
  const tasks = store.tasks;

  tasks.forEach(task => {
    if (!task.deadline || task.notified || task.boardId === 3) return;

    const deadlineDate = new Date(task.deadline);

    if (now >= deadlineDate) {
      if (Notification.permission === "granted") {
        new Notification(`⏰ Zadanie przeterminowane!`, {
          body: `Zadanie "${task.name}" powinno być już zrobione.`,
          icon: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png"
        });
      } else {
        alert(`⏰ Zadanie przeterminowane: ${task.name}`);
      }

      store.updateTask(task.id, { notified: true });
    }
  });
}

function resetSelectColor(selectElement) {
  selectElement.style.backgroundColor = "";
  selectElement.style.color = "";
  selectElement.style.textShadow = "";
}

const createBoardEl = (id, name, tasksCount) => {
  const board = document.createElement("div");
  board.classList.add("board");

  const header = document.createElement("div");
  header.classList.add("board-header");

  const headerText = document.createElement("span");
  headerText.classList.add("board-header-text");
  headerText.textContent = name;

  const headerIcon = document.createElement("div");
  headerIcon.dataset.boardId = id;
  headerIcon.dataset.role = "count";
  headerIcon.classList.add("board-header-icon");
  headerIcon.textContent = tasksCount;

  const tasks = document.createElement("div");
  tasks.dataset.boardId = id;
  tasks.dataset.role = "tasks";
  tasks.classList.add("board-tasks");

  tasks.addEventListener("dragover", (e) => {
    e.preventDefault();
    tasks.classList.add("drag-over");

    const afterElement = getDragAfterElement(tasks, e.clientY);

    if (afterElement == null) {
      tasks.appendChild(indicator);
    } else {
      tasks.insertBefore(indicator, afterElement);
    }
  });

  tasks.addEventListener("dragleave", (e) => {
    if (!tasks.contains(e.relatedTarget)) {
      tasks.classList.remove("drag-over");
      indicator.remove();
    }
  });

  tasks.addEventListener("drop", (e) => {
    e.preventDefault();

    tasks.classList.remove("drag-over");

    const draggable = document.querySelector(".dragging");
    if (draggable) {
      tasks.insertBefore(draggable, indicator);
      indicator.remove();
      const taskElements = [...tasks.querySelectorAll(".task")];
      const orderedIds = taskElements.map((el) => el.dataset.taskId);
      store.updateBoardTasks(id, orderedIds);
    }
  });

  header.appendChild(headerText);
  header.appendChild(headerIcon);

  board.appendChild(header);
  board.appendChild(tasks);

  if (id === 1) {
    board.appendChild(createAddButtonEl());
  }

  return board;
};

const createAddButtonEl = () => {
  const button = document.createElement("button");
  button.id = "create-task";
  button.textContent = "+ Utwórz";

  button.addEventListener("click", () => {
    const dialog = document.getElementById("task-dialog");

    if (dialog) dialog.showModal();
  });

  return button;
};

const createTaskEl = ({ id, tag, name, priorityId, assigneeId, deadline }) => {
  const priority = store.priorities.find(
    (priority) => priority.id === priorityId
  );
  const assignee = store.users.find(u => u.id === assigneeId);

  const task = document.createElement("div");
  task.dataset.taskId = id;
  task.dataset.role = "task";
  task.classList.add("task");
  task.setAttribute("draggable", "true");

  task.addEventListener("dragstart", (e) => {
    task.classList.add("dragging");
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  });

  task.addEventListener("dragend", () => {
    task.classList.remove("dragging");
  });

  const taskHeader = document.createElement("div");
  taskHeader.classList.add("task-header");

  const taskName = document.createElement("span");
  taskName.classList.add("task-name");
  taskName.textContent = name;

  const removeBtn = document.createElement("button");
  removeBtn.classList.add("task-remove-btn");
  removeBtn.textContent = "x";
  removeBtn.addEventListener("click", () => {
      if (confirm("Czy na pewno chcesz usunąć to zadanie?")) {
          store.removeTask(id);
      }
  });

  taskHeader.appendChild(taskName);
  taskHeader.appendChild(removeBtn);

  const taskContent = document.createElement("div");
  taskContent.classList.add("task-content");

  const taskMeta = document.createElement("div");
  taskMeta.style.display = "flex";
  taskMeta.style.flexDirection = "column";
  taskMeta.style.gap = "4px";

  const taskTag = document.createElement("span");
  taskTag.classList.add("task-tag");
  taskTag.textContent = `📝 ${tag}`;
  taskMeta.appendChild(taskTag);

  if (deadline) {
    const date = new Date(deadline);
    const isOverdue = new Date() > date;

    const dateEl = document.createElement("div");
    dateEl.classList.add("task-deadline");
    if (isOverdue) dateEl.classList.add("overdue");

    // Formatowanie: np. 12 paź, 14:00
    const formattedDate = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) +
      ", " + date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    dateEl.innerHTML = `🕒 ${formattedDate}`;
    taskMeta.appendChild(dateEl);
  }

  const taskDetails = document.createElement("div");
  taskDetails.classList.add("task-details");

  const taskPriority = document.createElement("div");
  taskPriority.classList.add("task-priority");

  if (priority) taskPriority.textContent = priority.icon;

  const taskAssignee = document.createElement("div");
  taskAssignee.classList.add("task-assignee");

  taskAssignee.title = "Kliknij, aby zmienić osobę";
  taskAssignee.addEventListener("click", (e) => {
    e.stopPropagation();

    const editDialog = document.getElementById("edit-assignee-dialog");
    const editSelect = document.getElementById("edit-assignee-select");
    const editTaskIdInput = document.getElementById("edit-task-id");

    editTaskIdInput.value = id;
    editSelect.value = assigneeId || "";

    editSelect.dispatchEvent(new Event('change'));
    editDialog.showModal();
  });

  if (assignee) {
    taskAssignee.innerHTML = `<div class="avatar" style="background-color:${assignee.color}">${assignee.name[0]}</div>`;
    taskAssignee.title = `Przypisany: ${assignee.name}`;
    taskAssignee.style.backgroundColor = "transparent";
  } else {
    taskAssignee.innerHTML = createUnassignedIcon();
    taskAssignee.title = "Brak przypisania";
  }

  // składamy task-details
  taskDetails.appendChild(taskPriority);
  taskDetails.appendChild(taskAssignee);

  // składamy task-content
  taskContent.appendChild(taskMeta);
  taskContent.appendChild(taskDetails);

  // składamy cały task
  task.appendChild(taskHeader);
  task.appendChild(taskContent);

  return task;
};

const createUnassignedIcon = () => {
  return `<svg fill="none" viewBox="-4 -4 24 24" style="width:100%; height:100%; color:#6b6e76"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M8 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4 4a4 4 0 1 1 8 0 4 4 0 0 1-8 0m-2 9a3.75 3.75 0 0 1 3.75-3.75h4.5A3.75 3.75 0 0 1 14 13v2h-1.5v-2a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 3.5 13v2H2z"></path></svg>`;
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}