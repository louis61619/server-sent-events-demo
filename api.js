const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = 3000;

// 內部儲存的客戶端
let clients = [];
// 內部儲存的請求隊列
let facts = [];

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`);
});

// 建立連結
// 並將每一個客戶端保存在clients陣列中
// 如果連結中斷將該客戶端id刪除
function eventsHandler(request, response, next) {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify(facts)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response,
  };

  clients.push(newClient);

  request.on("close", () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client) => client.id !== clientId);
  });
}

app.get("/events", eventsHandler);

function sendEventsToAll(newFact) {
  // 獲取每一個客戶端
  clients.forEach((client) =>
    client.response.write(`data: ${JSON.stringify(newFact)}\n\n`)
  );
}

async function addFact(request, respsonse, next) {
  const newFact = request.body;
  facts.push(newFact);
  respsonse.json(newFact);
  return sendEventsToAll(newFact);
}

app.post("/fact", addFact);

app.get("/status", (request, response) => {
  response.json({
    clients: clients.length,
  });
});
