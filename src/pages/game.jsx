import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import Script from "next/script";
import io from "socket.io-client";

let socket;

export default function ChessGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Waiting for opponent to join");
  const [pgn, setPgn] = useState("");
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const boardInstanceRef = useRef(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState([]);
  const [playerColor, setPlayerColor] = useState("white");

  useEffect(() => {
    if (!scriptsReady) return;

    const initializeGame = async () => {
      const colorParam = searchParams.get("color");
      if (colorParam && ["white", "black"].includes(colorParam.toLowerCase())) {
        setPlayerColor(colorParam.toLowerCase());
      }

      socket = io("http://localhost:3001");

      if (window.Chess && window.Chessboard && boardRef.current) {
        gameRef.current = new window.Chess();
        console.log("Chess game initialized:", gameRef.current);
        const config = {
          draggable: true,
          position: "start",
          onDragStart: onDragStart,
          onDrop: onDrop,
          onSnapEnd: onSnapEnd,
          pieceTheme: "/img/chesspieces/wikipedia/{piece}.png",
        };
        boardInstanceRef.current = window.Chessboard(boardRef.current, config);
        if (playerColor === "black") boardInstanceRef.current.flip();
        updateStatus();
      } else {
        console.error("Chess or Chessboard not available:", window.Chess, window.Chessboard);
      }

      socket.on("newMove", (move) => {
        if (gameRef.current) {
          const executedMove = gameRef.current.move(move);
          if (executedMove && move.captured) {
            setCapturedPieces((prev) => [...prev, move.captured]);
          }
          if (boardInstanceRef.current) {
            boardInstanceRef.current.position(gameRef.current.fen());
          }
          updateStatus();
        }
      });

      socket.on("startGame", () => {
        console.log("Game started");
        setGameHasStarted(true);
        updateStatus();
      });

      socket.on("gameOverDisconnect", () => {
        router.push(`/win?player1Bool=${playerColor === "white"}`);
      });

      const code = searchParams.get("code");
      if (code) {
        socket.emit("joinGame", { code });
      } else {
        console.warn("No game code provided");
      }

      return () => {
        if (socket) {
          socket.off("newMove");
          socket.off("startGame");
          socket.off("gameOverDisconnect");
          socket.disconnect();
        }
      };
    };

    initializeGame();
  }, [scriptsReady, router, playerColor]);

  const onDragStart = (source, piece) => {
    console.log("Drag start:", source, piece, gameRef.current?.turn(), playerColor);
    if (!gameRef.current || gameRef.current.game_over()) return false;
    if (gameOver) return false;

    const isWhitePiece = piece.search(/^w/) !== -1;
    const isBlackPiece = piece.search(/^b/) !== -1;
    if (playerColor === "white" && !isWhitePiece) return false;
    if (playerColor === "black" && !isBlackPiece) return false;

    return true; // Allow drag initially, turn check can be handled later
  };

  const onDrop = (source, target) => {
    if (!gameRef.current) {
      console.warn("gameRef.current is undefined");
      return;
    }
    const theMove = { from: source, to: target, promotion: "q" };
    const move = gameRef.current.move(theMove);
    if (move === null) return "snapback";

    socket.emit("move", { ...theMove, captured: move.captured || null });
    updateStatus();
  };

  const onSnapEnd = () => {
    if (boardInstanceRef.current && gameRef.current) {
      boardInstanceRef.current.position(gameRef.current.fen());
    }
  };

  const updateStatus = () => {
    if (!gameRef.current) {
      setStatus("Game initialization failed");
      return;
    }
    let status = "";
    const moveColor = gameRef.current.turn() === "w" ? "White" : "Black";
    if (gameRef.current.in_checkmate()) {
      status = "Game over, " + moveColor + " is in checkmate.";
      if (gameRef.current.turn() === (playerColor === "white" ? "w" : "b")) {
        router.push("/lost");
      } else {
        router.push(`/win?player1Bool=${playerColor === "white"}`);
      }
    } else if (gameRef.current.in_draw()) {
      status = "Game over, drawn position";
    } else if (gameOver) {
      status = "Opponent disconnected, you win!";
    } else if (!gameHasStarted) {
      status = `Waiting for ${playerColor === "white" ? "black" : "white"} to join`;
    } else {
      status = moveColor + " to move";
      if (gameRef.current.in_check()) status += ", " + moveColor + " is in check";
    }
    setStatus(status);
    setPgn(gameRef.current.pgn());
  };

  return (
    <>
      <Head>
        <title>Chess Game - {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} Player</title>
        <meta name="description" content={`Play chess as ${playerColor}`} />
        <link rel="icon" href="/favicon.ico" />
        <link href="/css/chessboard-1.0.0.min.css" rel="stylesheet" />
      </Head>
      <Script
        src="/js/jquery-3.7.0.min.js"
        strategy="beforeInteractive"
        onLoad={() => setScriptsReady(false)}
        onError={() => console.error("jQuery failed to load")}
      />
      <Script
        src="/js/chess-0.10.3.min.js"
        strategy="beforeInteractive"
        onLoad={() => setScriptsReady(false)}
        onError={() => console.error("Chess.js failed to load")}
      />
      <Script
        src="/js/chessboard-1.0.0.min.js"
        strategy="beforeInteractive"
        onLoad={() => setScriptsReady(true)}
        onError={() => console.error("Chessboard.js failed to load")}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <header className="p-6">
          <div className="flex justify-between items-center max-w-[1550px] mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">♚</span>
              </div>
              <h1 className="uppercase text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                Royal Chess Arena
              </h1>
            </div>
            <h1 className="uppercase text-2xl md:text-3xl font-bold">
              {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} Player
            </h1>
          </div>
        </header>
        <div className="max-w-[1550px] mx-auto">
          <div className="cover-container items-center justify-center flex flex-row p-3 mx-auto h-dvh">
            <div className="min-h-[60dvh] w-[30%]">
              <h3
                id="status"
                className="w-full min-h-[4dvh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white"
              >
                Status: {status}
              </h3>
              <div className="w-full min-h-[55dvh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white mt-6">
                <h5>PGN:</h5>
                <h5 id="pgn">{pgn}</h5>
              </div>
            </div>
            <main className="p-8 h-[65dvh] aspect-square mx-auto">
              <div id="myBoard" ref={boardRef} style={{ width: "100%", margin: "auto" }}></div>
              {capturedPieces.length > 0 && (
                <div style={{ marginBottom: playerColor === "white" ? "20px" : "0", marginTop: playerColor === "black" ? "20px" : "0", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {capturedPieces.map((piece, index) => (
                    <img
                      key={index}
                      src={`/img/chesspieces/wikipedia/${playerColor.charAt(0)}${piece}.png`}
                      alt={`Captured ${piece}`}
                      style={{ width: "50px", height: "50px" }}
                    />
                  ))}
                </div>
              )}
            </main>
            <div className="min-h-[60dvh] w-[30%]">
              <div className="text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-xl text-white w-fit px-3">
                05:00:00
              </div>
              <div className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl min-h-[350px] text-white">
                <div className="flex items-center justify-start space-x-3">
                  <div className="h-3 rounded-full bg-green-100 aspect-square"></div>
                  <h3>Anonymous</h3>
                </div>
              </div>
            </div>
          </div>
          <footer className="p-6 text-center absolute bottom-0 left-0 right-0">
            <p className="text-gray-400">
              © 2025{" "}
              <a href="https://coullax.com/" className="text-purple-400 hover:text-purple-300 transition-colors">
                Coullax
              </a>{" "}
              All Rights Reserved.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}