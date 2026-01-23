class Store {
  #state = {
    loading: true,

    taskIndex: 1,

    boards: [],
    priorities: [],
    tasks: [],
    users: [],
  };

  // Map: key = nazwa właściwości, value = Set(callback)
  #subscribers = new Map();

  constructor() {
    const taskIndex = JSON.parse(localStorage.getItem("task-index"));
    const tasks = JSON.parse(localStorage.getItem("tasks"));
    const users = JSON.parse(localStorage.getItem("users"));

    if (tasks) this.#state.tasks = tasks;
    if (users) this.#state.users = users;
    if (taskIndex) this.#state.taskIndex = Number(taskIndex);
  }

  get loading() {
    return this.#state.loading;
  }

  get boards() {
    return this.#state.boards;
  }

  get priorities() {
    return this.#state.priorities;
  }

  get tasks() {
    return this.#state.tasks;
  }

  get users() {
    return this.#state.users;
  }

  loadData(boards, priorities) {
    this.#state.loading = false;
    this.#state.boards = boards;
    this.#state.priorities = priorities;

    this.#saveAndNotify("loading");
    this.#saveAndNotify("boards");
    this.#saveAndNotify("priorities");
    this.#saveAndNotify("users");

    this.#saveAndNotify("tasks");
  }

  addUser(name, color) {
    this.#state.users.push({
      id: crypto.randomUUID(),
      name: name,
      color: color
    });
    this.#saveAndNotify("users");
  }

  removeUser(userId) {
    this.#state.users = this.#state.users.filter(({ id }) => id !== userId);

    this.#state.tasks = this.#state.tasks.map(task => {
      if (task.assigneeId === userId) {
        return { ...task, assigneeId: null };
      }
      return task;
    });

    this.#saveAndNotify("users");
    this.#saveAndNotify("tasks");
  }

  addTask(name, priorityId, assigneeId = null) {
    this.#state.tasks.push({
      id: crypto.randomUUID(),
      createdAt: new Date(),

      boardId: 1,
      priorityId: priorityId,
      assigneeId: assigneeId,

      tag: `TASK-${this.#state.taskIndex++}`,
      name: name,
    });

    this.#saveAndNotify("taskIndex");
    this.#saveAndNotify("tasks");
  }

  updateTask(taskId, updates) {
    const taskIndex = this.#state.tasks.findIndex((t) => t.id === taskId);

    if (taskIndex !== -1) {
      this.#state.tasks[taskIndex] = {
        ...this.#state.tasks[taskIndex],
        ...updates
      };
      this.#saveAndNotify("tasks");
    }
  }

  removeTask(taskId) {
    this.#state.tasks = this.#state.tasks.filter(({ id }) => id != taskId);

    this.#saveAndNotify("tasks");
  }

  updateBoardTasks(boardId, orderedTaskIds) {
    const otherTasks = this.#state.tasks.filter(
      (task) => !orderedTaskIds.includes(String(task.id))
    );

    const updatedTasks = orderedTaskIds
      .map((id) => {
        const task = this.#state.tasks.find((t) => t.id == id);
        if (task) {
          task.boardId = Number(boardId);
          return task;
        }
      })
      .filter((task) => task !== undefined);

    this.#state.tasks = [...otherTasks, ...updatedTasks];
    this.#saveAndNotify("tasks");
  }

  // --- Subskrypcje ---
  subscribe(prop, callback) {
    if (!this.#subscribers.has(prop)) {
      this.#subscribers.set(prop, new Set());
    }

    this.#subscribers.get(prop).add(callback);

    if (prop !== "tasks" || !this.#state.loading) {
      callback(this.#state[prop]);
    }

    return () => this.#subscribers.get(prop).delete(callback);
  }

  // --- Notify dla pojedynczej właściwości ---
  #saveAndNotify(prop) {
    if (prop === "taskIndex")
      localStorage.setItem("task-index", JSON.stringify(this.#state.taskIndex));

    if (prop === "tasks")
      localStorage.setItem("tasks", JSON.stringify(this.#state.tasks));

    if (prop === "users")
      localStorage.setItem("users", JSON.stringify(this.#state.users));

    const set = this.#subscribers.get(prop);

    if (set) {
      for (const cb of set) cb(this.#state[prop]);
    }
  }

  // --- Opcjonalnie: zwrócenie całego stanu ---
  getState() {
    return { ...this.#state };
  }
}

// --- Singleton ---
export const store = new Store();
