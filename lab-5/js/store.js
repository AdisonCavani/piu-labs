import { getRandomColor } from "./helpers.js";

class Store {
  #state = {
    squares: [],
    circles: [],
  };

  // Map: key = nazwa właściwości, value = Set(callback)
  #subscribers = new Map();

  constructor() {
    const storeData = JSON.parse(localStorage.getItem("store-data"));

    if (storeData) this.#state = storeData;
  }

  get squares() {
    return this.#state.squares;
  }

  get circles() {
    return this.#state.circles;
  }

  addSquare() {
    this.#state.squares.push({
      id: Date.now(),
      color: getRandomColor(),
    });
    this.#saveAndNotify("squares");
  }

  addCircle() {
    this.#state.circles.push({
      id: Date.now(),
      color: getRandomColor(),
    });
    this.#saveAndNotify("circles");
  }

  removeSquare(elementId) {
    this.#state.squares = this.#state.squares.filter(
      ({ id }) => id != elementId
    );

    this.#saveAndNotify("squares");
  }

  removeCircle(elementId) {
    this.#state.circles = this.#state.circles.filter(
      ({ id }) => id != elementId
    );

    this.#saveAndNotify("circles");
  }

  // --- Subskrypcje ---
  subscribe(prop, callback) {
    if (!this.#subscribers.has(prop)) {
      this.#subscribers.set(prop, new Set());
    }
    this.#subscribers.get(prop).add(callback);
    callback(this.#state[prop]); // od razu wywołanie
    return () => this.#subscribers.get(prop).delete(callback);
  }

  // --- Notify dla pojedynczej właściwości ---
  #saveAndNotify(prop) {
    localStorage.setItem("store-data", JSON.stringify(this.#state));

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
