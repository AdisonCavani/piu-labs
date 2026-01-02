import { store } from "./store.js";

const indicator = document.createElement("div");
indicator.classList.add("drop-indicator");

export function initialize() {
  const loadingEl = document.getElementById("loader");
  const mainLayout = document.querySelector("main");

  const dialog = document.querySelector("dialog");

  const cancelButton = document.getElementById("cancel-btn");
  const form = document.querySelector("form");

  cancelButton.addEventListener("click", () => {
    dialog.close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const { name, priorityId } = Object.fromEntries(formData.entries());

    store.addTask(String(name), Number(priorityId));

    dialog.close();
    form.reset();
  });

  store.subscribe("loading", (loading) => {
    if (loading) loadingEl.style.display = undefined;
    else loadingEl.style.display = "none";
  });

  store.subscribe("boards", (boards) => {
    boards.forEach((board) => {
      const { id, name } = board;
      const tasks = store.tasks.filter((task) => task.boardId === id);

      mainLayout.appendChild(createBoardEl(id, name, tasks.length));
    });
  });

  store.subscribe("priorities", (priorities) => {
    const prioritiesSelectEl = document.getElementById("priority-select");

    priorities.forEach((priority) => {
      const option = document.createElement("option");

      option.value = priority.id;
      option.textContent = `${priority.icon} ${priority.name}`;

      prioritiesSelectEl.appendChild(option);
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
        const boardId = taskExists.parentElement.dataset.boardId;

        if (task.boardId !== boardId) taskExists.remove();
        else return;
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
    tasks.insertBefore(draggable, indicator);
    indicator.remove();

    const taskElements = [...tasks.querySelectorAll(".task")];
    const orderedIds = taskElements.map((el) => el.dataset.taskId);
    store.updateBoardTasks(id, orderedIds);
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
    const dialog = document.querySelector("dialog");

    if (dialog) dialog.showModal();
  });

  return button;
};

const createTaskEl = ({ id, tag, name, priorityId }) => {
  const priority = store.priorities.find(
    (priority) => priority.id === priorityId
  );

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

  const taskTag = document.createElement("span");
  taskTag.classList.add("task-tag");
  taskTag.textContent = `📝 ${tag}`;

  const taskDetails = document.createElement("div");
  taskDetails.classList.add("task-details");

  const taskPriority = document.createElement("div");
  taskPriority.classList.add("task-priority");

  if (priority) taskPriority.textContent = priority.icon;

  const taskAssignee = document.createElement("div");
  taskAssignee.classList.add("task-assignee");

  const avatarIcon = createAvatarEl();
  taskAssignee.appendChild(avatarIcon);

  // składamy task-details
  taskDetails.appendChild(taskPriority);
  taskDetails.appendChild(taskAssignee);

  // składamy task-content
  taskContent.appendChild(taskTag);
  taskContent.appendChild(taskDetails);

  // składamy cały task
  task.appendChild(taskHeader);
  task.appendChild(taskContent);

  return task;
};

const createAvatarEl = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttribute("fill", "none");
  svg.setAttribute("viewBox", "-4 -4 24 24");
  svg.setAttribute("role", "presentation");
  svg.classList.add(
    "_1reo15vq",
    "_18m915vq",
    "_syaz1r31",
    "_lcxvglyw",
    "_s7n4yfq0",
    "_vc881r31",
    "_1bsb1ejb",
    "_4t3i1ejb"
  );

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "currentcolor");
  path.setAttribute("fill-rule", "evenodd");
  path.setAttribute(
    "d",
    "M8 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4 4a4 4 0 1 1 8 0 4 4 0 0 1-8 0m-2 9a3.75 3.75 0 0 1 3.75-3.75h4.5A3.75 3.75 0 0 1 14 13v2h-1.5v-2a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 3.5 13v2H2z"
  );
  path.setAttribute("clip-rule", "evenodd");

  svg.appendChild(path);

  return svg;
};

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