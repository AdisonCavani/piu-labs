import { Ajax } from "./ajax.js";
import { initialize } from "./ui.js";
import { store } from "./store.js";

initialize();

const ajax = new Ajax({
  baseURL: "http://localhost:3000/api",
});

const boards = await ajax.get("/boards");
const priorities = await ajax.get("/priorities");

store.loadData(boards, priorities);
