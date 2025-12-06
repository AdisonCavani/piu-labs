import { store } from "./store.js";

export function initialize() {
  // Pobranie elementów z DOM
  const container = document.getElementById("container");

  const counterSquaresEl = document.querySelector("#squares-count");
  const counterCirclesEl = document.querySelector("#circles-count");

  const addSquareBtn = document.querySelector("#add-square");
  const addCircleBtn = document.querySelector("#add-circle");

  // Subskrypcja zmian stanu
  store.subscribe("squares", (squares) => {
    counterSquaresEl.textContent = squares.length;

    squares.forEach((square) => {
      const exists = container.querySelector(`[data-id="${square.id}"]`);

      if (exists) return;

      container.appendChild(createShapeEl("square", square));
    });
  });

  store.subscribe("circles", (circles) => {
    counterCirclesEl.textContent = circles.length;

    circles.forEach((circle) => {
      const exists = container.querySelector(`[data-id="${circle.id}"]`);

      if (exists) return;

      container.appendChild(createShapeEl("circle", circle));
    });
  });

  // Obsługa kliknięć
  addSquareBtn.addEventListener("click", () => store.addSquare());
  addCircleBtn.addEventListener("click", () => store.addCircle());

  container.addEventListener("click", (e) => {
    const target = e.target.closest(".shape");

    if (!target) return;

    const id = target.dataset.id;
    const type = target.dataset.type;

    if (id && type == "square") store.removeSquare(id);
    else if (id && type == "circle") store.removeCircle(id);

    target.remove();
  });
}

function createShapeEl(type, data) {
  const el = document.createElement("div");

  el.className = `shape ${type}`;
  el.style.backgroundColor = data.color;

  el.dataset.id = data.id;
  el.dataset.type = type;

  return el;
}
