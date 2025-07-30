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
  const [showWinModal, setShowWinModal] = useState(false);
  const [showBadLuckModal, setShowBadLuckModal] = useState(false);
  const [showRematchRequest, setShowRematchRequest] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const boardInstanceRef = useRef(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState([]);
  const [playerColor, setPlayerColor] = useState("white");
  const [betAmount, setBetAmount] = useState(0);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!scriptsReady) return;

    const initializeGame = async () => {
      const colorParam = searchParams.get("color");
      if (colorParam && ["white", "black"].includes(colorParam.toLowerCase())) {
        setPlayerColor(colorParam.toLowerCase());
      } else {
        setStatus("Invalid color parameter");
        return;
      }
      const code = searchParams.get("code");
      if (!code || code.length !== 3) {
        setStatus("Invalid game code");
        return;
      }

      socket = io("https://chess-site-server.onrender.com", { 
        reconnection: true, 
        reconnectionAttempts: 5,
        query: { code, color: playerColor }
      });

      // Check all dependencies
      if (!window.jQuery || !window.Chess || !window.Chessboard || !boardRef.current) {
        console.error("Missing dependencies:", {
          jQuery: !!window.jQuery,
          Chess: !!window.Chess,
          Chessboard: !!window.Chessboard,
          boardRef: !!boardRef.current
        });
        setStatus("Failed to load game dependencies");
        return;
      }

      gameRef.current = new window.Chess();
      console.log("Game initialized with FEN:", gameRef.current.fen());
      const config = {
        draggable: true,
        position: "start",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: "/img/chesspieces/wikipedia/{piece}.png",
        moveSpeed: "fast",
      };
      try {
        boardInstanceRef.current = window.Chessboard(boardRef.current, config);
        if (playerColor === "black") boardInstanceRef.current.flip();
        updateStatus();
      } catch (error) {
        console.error("Chessboard initialization failed:", error);
        setStatus("Failed to initialize chessboard");
      }

      socket.on("connect", () => {
        console.log("Connected to server, socket ID:", socket.id);
        socket.emit("joinGame", { code, color: playerColor });
      });

      socket.on("newMove", (move) => {
        if (gameRef.current && !gameOver) {
          const executedMove = gameRef.current.move(move);
          if (executedMove && move.captured) {
            setCapturedPieces((prev) => [...prev, move.captured]);
          }
          if (boardInstanceRef.current) {
            boardInstanceRef.current.position(gameRef.current.fen());
          }
          checkGameState();
        }
      });

      socket.on("startGame", () => {
        setGameHasStarted(true);
        setIsReconnecting(false);
        updateStatus();
      });

      socket.on("opponentLeft", (data) => {
        if (data.winnerColor !== playerColor && !gameOver) {
          setOpponentLeft(true);
          setGameOver(true);
          setShowWinModal(true);
          updateStatus();
        }
      });

      socket.on("reconnect", () => {
        setIsReconnecting(true);
        const code = searchParams.get("code");
        if (code) socket.emit("joinGame", { code, color: playerColor });
      });

      socket.on("rematchRequest", () => {
        if (!rematchRequested && !gameOver) setShowRematchRequest(true);
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
        setStatus(`Error: ${error.message}`);
      });

      return () => {
        if (socket && gameOver) {
          socket.disconnect();
        }
      };
    };

    initializeGame();
  }, [scriptsReady, router, playerColor]);

//   const onDragStart = (source, piece, position, orientation) => {
//     console.log("Drag attempt:", { source, piece, turn: gameRef.current?.turn(), playerColor, gameHasStarted, gameOver, isReconnecting });
//     if (!gameRef.current || !boardInstanceRef.current || gameRef.current.game_over() || gameOver || !gameHasStarted || isReconnecting) {
//       return false;
//     }
//     const isWhitePiece = piece.search(/^w/) !== -1;
//     const isBlackPiece = piece.search(/^b/) !== -1;
//     if ((playerColor === "white" && !isWhitePiece) || (playerColor === "black" && !isBlackPiece)) {
//       return false;
//     }
//     return gameRef.current.turn() === (playerColor === "white" ? "w" : "b");
//   };
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
    if (!gameRef.current || gameOver || isReconnecting) return;
    const theMove = { from: source, to: target, promotion: "q" };
    const move = gameRef.current.move(theMove);
    if (move === null) return "snapback";

    socket.emit("move", { ...theMove, captured: move.captured || null });
    checkGameState();
  };

  const onSnapEnd = () => {
    if (boardInstanceRef.current && gameRef.current) {
      boardInstanceRef.current.position(gameRef.current.fen());
    }
  };

  const checkGameState = () => {
    if (!gameRef.current) return;
    if (gameRef.current.in_checkmate()) {
      setGameOver(true);
      if (gameRef.current.turn() !== (playerColor === "white" ? "w" : "b")) {
        setShowWinModal(true);
      } else {
        setShowBadLuckModal(true);
      }
    } else if (gameRef.current.in_draw()) {
      setGameOver(true);
      setStatus("Game over, drawn position");
    }
    updateStatus();
  };

  const updateStatus = () => {
    if (!gameRef.current) {
      setStatus("Game initialization failed");
      return;
    }
    let status = "";
    const moveColor = gameRef.current.turn() === "w" ? "White" : "Black";
    if (gameOver) {
      if (opponentLeft) status = "Opponent left, you win!";
      else if (gameRef.current.in_checkmate()) status = `Game over, ${moveColor} is in checkmate.`;
      else if (gameRef.current.in_draw()) status = "Game over, drawn position";
    } else if (!gameHasStarted) {
      status = `Waiting for ${playerColor === "white" ? "black" : "white"} to join`;
    } else {
      status = `${moveColor} to move`;
      if (gameRef.current.in_check()) status += `, ${moveColor} is in check`;
    }
    setStatus(status);
    setPgn(gameRef.current.pgn());
  };

  const requestRematch = () => {
    if (socket && !rematchRequested && gameOver) {
      socket.emit("rematchRequest");
      setRematchRequested(true);
      setStatus("Rematch requested, waiting for opponent...");
    }
  };

  const acceptRematch = () => {
    if (socket && showRematchRequest) {
      socket.emit("acceptRematch");
      setShowRematchRequest(false);
      setRematchRequested(false);
      setGameHasStarted(false);
      setGameOver(false);
      setCapturedPieces([]);
      setOpponentLeft(false);
      gameRef.current = new window.Chess();
      if (boardInstanceRef.current) boardInstanceRef.current.position("start");
      updateStatus();
    }
  };

  const ignoreRematch = () => {
    setShowRematchRequest(false);
    router.push("/");
  };

  const claimBet = () => {
    console.log("Bet claimed:", betAmount);
    setShowWinModal(false);
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>Chess Game - {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} Player</title>
        <meta name="description" content={`Play chess as ${playerColor}`} />
        <link rel="icon" href="/favicon.ico" />
        <link href="/css/chessboard-1.0.0.min.css" rel="stylesheet" />
        <script src="https://code.jquery.com/jquery-3.7.0.min.js" />
      </Head>
      <Script
        src="/js/jquery-3.7.0.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("jQuery loaded");
          setScriptsReady(false); // Reset to ensure next script waits
        }}
        onError={() => console.error("jQuery failed to load")}
      />
      <Script
        src="/js/chess-0.10.3.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("Chess.js loaded");
          setScriptsReady(false); // Reset again
        }}
        onError={() => console.error("Chess.js failed to load")}
      />
      <Script
        src="/js/chessboard-1.0.0.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("Chessboard.js loaded");
          setScriptsReady(true); // Set true only when all are loaded
        }}
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
              <div id="myBoard" ref={boardRef} style={{ width: "100%", height: "100%", margin: "auto" }}></div>
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
                {gameOver && (
                  <button
                    onClick={requestRematch}
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                    disabled={rematchRequested}
                  >
                    Request Rematch
                  </button>
                )}
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

        {/* Win Modal */}
        {showWinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">You Win!</h2>
              <p>Claim your bet of ${betAmount}</p>
              <button
                onClick={claimBet}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Claim Bet
              </button>
              <button
                onClick={() => setShowWinModal(false)}
                className="mt-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Bad Luck Modal */}
        {showBadLuckModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Bad Luck!</h2>
              <p>You lost the game.</p>
              <button
                onClick={() => setShowBadLuckModal(false)}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Rematch Request Modal */}
        {showRematchRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Rematch Request</h2>
              <p>Opponent wants a rematch. Accept?</p>
              <button
                onClick={acceptRematch}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
              >
                Accept
              </button>
              <button
                onClick={ignoreRematch}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ignore
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}