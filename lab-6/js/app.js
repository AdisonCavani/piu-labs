import { Ajax } from "./ajax.js";

const ajax = new Ajax({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 3500,
});

const loadButton = document.getElementById("load-button");
const errorButton = document.getElementById("error-button");
const resetButton = document.getElementById("reset-button");

const loader = document.getElementById("loader");
const list = document.getElementById("list");
const errorBox = document.getElementById("error");

function showLoader() {
  loader.style.display = "block";
}

function hideLoader() {
  loader.style.display = "none";
}

function showError(err) {
  errorBox.textContent = err.message || String(err);
}

function clearAll() {
  list.innerHTML = "";
  errorBox.textContent = "";
}

loadButton.addEventListener("click", async () => {
  clearAll();
  showLoader();

  try {
    const data = await ajax.get("/posts");
    hideLoader();

    list.innerHTML = data
      .map((item) => `<div class="item">${item.title}</div>`)
      .join("");
  } catch (err) {
    hideLoader();
    showError(err);
  }
});

errorButton.addEventListener("click", async () => {
  clearAll();
  showLoader();

  try {
    const data = await ajax.get("dwjdajdawjdwad");
    hideLoader();
  } catch (err) {
    hideLoader();
    showError(err);
  }
});

resetButton.addEventListener("click", () => {
  clearAll();
});
