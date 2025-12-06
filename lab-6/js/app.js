import { Ajax } from "./ajax.js";

const ajax = new Ajax({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 3500,
  headers: {
    Authorization: "Bearer my-token",
  },
});

const posts = await ajax.get("/posts");

console.log(posts);
