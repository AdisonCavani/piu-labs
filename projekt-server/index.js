const priorities = [
  {
    id: 1,
    name: "Niski",
    icon: "🟢",
  },
  {
    id: 2,
    name: "Średni",
    icon: "🟡",
  },
  {
    id: 3,
    name: "Wysoki",
    icon: "🔴",
  },
];

const boards = [
  {
    id: 1,
    name: "Do zrobienia",
  },
  {
    id: 2,
    name: "W toku",
  },
  {
    id: 3,
    name: "Gotowe",
  },
];

require("http")
  .createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/api/priorities")
      return res.end(JSON.stringify(priorities));

    if (req.url === "/api/boards") return res.end(JSON.stringify(boards));

    res.statusCode = 404;
    res.end();
  })
  .listen(3000);
