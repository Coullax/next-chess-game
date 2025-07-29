import Pusher from "pusher";

const pusher = new Pusher({
  appId: "2029276",
  key: "a4ad42bd9662f1406a19",
  secret: "c9b0a51686380f659af3",
  cluster: "ap2",
  useTLS: true
});

let games = {};

export default function handler(req, res) {
  if (req.method === "POST") {
    const { event, data, channel } = req.body;

    if (event === "move") {
      pusher.trigger(channel, "newMove", data);
      res.status(200).json({ message: "Move triggered" });
    } else if (event === "joinGame") {
      const { code } = data;
      if (!games[code]) {
        games[code] = true;
        res.status(200).json({ message: "Game created" });
      } else {
        pusher.trigger(code, "startGame", {});
        res.status(200).json({ message: "Game started" });
      }
    } else if (event === "disconnect") {
      const { code } = data;
      if (code) {
        pusher.trigger(code, "gameOverDisconnect", {});
        delete games[code];
        res.status(200).json({ message: "Game disconnected" });
      }
    } else {
      res.status(400).json({ message: "Unknown event" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}