import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import Script from "next/script";
import io from "socket.io-client";
import Pusher from "pusher-js";
import Image from "next/image";

let socket;

export default function BlackGame() {
  const router = useRouter();
  const [status, setStatus] = useState("Waiting for game to start");
  const [pgn, setPgn] = useState("");
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const boardInstanceRef = useRef(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState([]);
  const searchParams = useSearchParams();
  const [whiteTime, setWhiteTime] = useState(1800); // 30 minutes in seconds
  const [blackTime, setBlackTime] = useState(1800); // 30 minutes in seconds
  useEffect(() => {
    if (!gameHasStarted || gameOver || !gameRef.current) return;
  
    const timer = setInterval(() => {
      if (gameRef.current.turn() === "w") {
        setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
  
    return () => clearInterval(timer);
  }, [gameHasStarted, gameOver]);
  
  // Add formatTime helper function inside BlackGame component
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };  

  // useEffect(() => {
  //   if (!scriptsReady) return;
  //   initializeGame();
  //   return () => {
  //     if (socket) {
  //       socket.disconnect();
  //     }
  //   };
  //   // eslint-disable-next-line
  // }, [scriptsReady]);

  useEffect(() => {
    if (!scriptsReady) return;

    const initializeGame = async () => {
      // await fetch("/api/socket");
      // socket = io();
      // const pusher = new Pusher('a4ad42bd9662f1406a19', {
      //   cluster: 'ap2'
      // });
      socket = io("https://chess-site-server.onrender.com", {
        // path: "/socket.io", // Adjust if your backend uses a different path
        // withCredentials: true,
      });

      // Initialize chess game
      if (window.Chess && window.Chessboard && boardRef.current) {
        gameRef.current = new window.Chess();
        const config = {
          draggable: true,
          position: 'start',
          onDragStart: onDragStart,
          onDrop: onDrop,
          onSnapEnd: onSnapEnd,
          pieceTheme: '/img/chesspieces/wikipedia/{piece}.png'
        };
        boardInstanceRef.current = window.Chessboard(boardRef.current, config);
        boardInstanceRef.current.flip();
        updateStatus();
      }

      // Join channel based on game code from URL
      // const gameCode = router.query.code;
      // // if (gameCode) {
      //   const channel = pusher.subscribe('chess-game');

      //   // Pusher event listeners
      //   channel.bind("newMove", (move) => {
      //     if (gameRef.current) {
      //       const executedMove = gameRef.current.move(move);
      //       if (executedMove && move.captured) {
      //         setCapturedPieces((prev) => [...prev, move.captured]);
      //       }
      //       if (boardInstanceRef.current) {
      //         boardInstanceRef.current.position(gameRef.current.fen());
      //       }
      //       updateStatus();
      //     }
      //   });

      //   channel.bind("startGame", () => {
      //     console.log("Game started");
      //     setGameHasStarted(true);
      //     updateStatus();
      //   });

      //   channel.bind("gameOverDisconnect", () => {
      //     setGameOver(true);
      //     updateStatus();
      //     router.push("/win?player1Bool=false");
      //   });

      //   // Trigger joinGame event via API
      //   await fetch("/api/pusher", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ event: "joinGame", data: { code: router.query.code }, channel: 'chess-game' }),
      //   });
      // // }

      // return () => {
      //   if (gameCode && channel) {
      //     channel.unbind("newMove");
      //     channel.unbind("startGame");
      //     channel.unbind("gameOverDisconnect");
      //     channel.unsubscribe();
      //     pusher.disconnect(); // Optional, depending on app lifecycle
      //   }
      // };

      // Socket event listeners
      socket.on('newMove', function(move) {
        debugger
        if (gameRef.current) {
          const executedMove = gameRef.current.move(move);
          if (executedMove && move.captured) {
            setCapturedPieces(prev => [...prev, move.captured]);
          }
          if (boardInstanceRef.current) {
            boardInstanceRef.current.position(gameRef.current.fen());
          }
          updateStatus();
        }
      });

      socket.on('startGame', function() {
        console.log("Game started");
        setGameHasStarted(true);
        updateStatus();
      });

      socket.on('gameOverDisconnect', function() {
        router.push('/win?player1Bool=true');
      });

      const code = searchParams.get("code");
      // Join game with code from URL
      if (code) {
        socket.emit('joinGame', {
          code: code
        });
      }

      return () => {
        if (socket) {
          socket.off('newMove');
          socket.off('startGame');
          socket.off('gameOverDisconnect');
          socket.disconnect();
        }
      };
    };

    initializeGame();
  }, [scriptsReady, router, gameHasStarted]);

  // const initializeGame = async () => {
  //   await fetch("/api/socket");
  //   socket = io();
  //   debugger

  //   // Initialize chess game
  //   if (typeof window !== 'undefined' && window.Chess && window.Chessboard && boardRef.current) {
  //     gameRef.current = new window.Chess();
  //     const config = {
  //       draggable: true,
  //       position: 'start',
  //       onDragStart: onDragStart,
  //       onDrop: onDrop,
  //       onSnapEnd: onSnapEnd,
  //       pieceTheme: '/img/chesspieces/wikipedia/{piece}.png'
  //     };
  //     debugger
  //     boardInstanceRef.current = window.Chessboard(boardRef.current, config);
  //     boardInstanceRef.current.flip();
  //     updateStatus();
  //   }

  //   // Socket event listeners
  //   socket.on('newMove', function(move) {
  //     if (gameRef.current) {
  //       gameRef.current.move(move);
  //       if (boardInstanceRef.current) {
  //         boardInstanceRef.current.position(gameRef.current.fen());
  //       }
  //       updateStatus();
  //     }
  //   });

  //   socket.on('startGame', function() {
  //     setGameHasStarted(true);
  //     updateStatus();
  //   });

  //   socket.on('gameOverDisconnect', function() {
  //     setGameOver(true);
  //     updateStatus();
  //     router.push('/win?player1Bool=false');
  //   });

  //   if (router.query.code) {
  //     socket.emit('joinGame', {
  //       code: router.query.code
  //     });
  //   }
  // };

  const onDragStart = (source, piece, position, orientation) => {
    if (gameRef.current.game_over()) return false;
    if (!gameHasStarted) return false;
    if (gameOver) return false;
    if (piece.search(/^w/) !== -1) return false;
    if (gameRef.current.turn() === 'w') return false;
  };

  const onDrop = (source, target) => {
    let theMove = {
      from: source,
      to: target,
      promotion: 'q'
    };
    var move = gameRef.current.move(theMove);
    if (move === null) return 'snapback';
  
    // fetch("/api/pusher", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     event: "move",
    //     data: { ...theMove, captured: move.captured || null },
    //     channel: router.query.code, // Ensure router is available in scope
    //   }),
    // }).then(() => {
    //   updateStatus();
    // });
    socket.emit('move', {
      ...theMove,
      captured: move.captured || null
    });
  
    updateStatus();
  };
  

  const onSnapEnd = () => {
    if (boardInstanceRef.current && gameRef.current) {
      boardInstanceRef.current.position(gameRef.current.fen());
    }
  };

  const updateStatus = () => {
    // debugger
    if (!gameRef.current) return;
    var status = '';
    var moveColor = 'White';
     console.log("Current turn:", moveColor);
      console.log("Game has started:", gameHasStarted);
    if (gameRef.current.turn() === 'b') moveColor = 'Black';
    if (gameRef.current.in_checkmate()) {
      status = 'Game over, ' + moveColor + ' is in checkmate.';
      // If it's black's turn and checkmate, black is losing
      if (gameRef.current.turn() === 'b') {
        router.push('/lost');
      } else {
        router.push('/win?player1Bool=false');
      }
    }
    else if (gameRef.current.in_draw()) {
      status = 'Game over, drawn position';
    } else if (gameOver) {
      status = 'Opponent disconnected, you win!';
    } else if (!gameHasStarted) {
      status = 'Waiting for game to start';
    } else {
      status = moveColor + ' to move';
      if (gameRef.current.in_check()) {
        status += ', ' + moveColor + ' is in check';
      }
    }
    setStatus(status);
    setPgn(gameRef.current.pgn());
  };

  return (
    <>
      <Head>
        <title>Chess Game - Black Player</title>
        <meta name="description" content="Play chess as black" />
        <link rel="icon" href="/favicon.ico" />
        <link href="/css/chessboard-1.0.0.min.css" rel="stylesheet" />
      </Head>
      <Script
        src="/js/jquery-3.7.0.min.js"
        strategy="beforeInteractive"
        onLoad={() => setScriptsReady(false)}
      />
      <Script
        src="/js/chess-0.10.3.min.js"
        strategy="beforeInteractive"
        onLoad={() => setScriptsReady(false)}
      />
      <Script
        src="/js/chessboard-1.0.0.min.js"
        strategy="beforeInteractive"
        onLoad={() => setScriptsReady(true)}
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
            <h1 className=" uppercase text-2xl md:text-3xl font-bold">
              Player 2
            </h1>
          </div>
        </header>
        <div className="max-w-[1550px] mx-auto">
          <div className="cover-container items-center justify-center flex flex-row p-3 mx-auto h-[90dvh]">
            <div className=" min-h-[60dvh] w-[30%] ">
              <h3
                id="status"
                className="w-full min-h-[4dvh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white"
              >
                Status: {status}
              </h3>
              <div className="w-full min-h-[55dvh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white mt-6 overflow-auto">
                <h5 className="mb-3 font-bold">Move History:</h5>
                {pgn ? (
                  <div className="overflow-auto max-h-[45dvh]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white/10 backdrop-blur">
                        <tr>
                          <th className="p-2 text-left border-b border-white/20">
                            #
                          </th>
                          <th className="p-2 text-left border-b border-white/20">
                            White
                          </th>
                          <th className="p-2 text-left border-b border-white/20">
                            Black
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Parse PGN and extract moves
                          const moves = pgn
                            .split(/\d+\./)
                            .filter((move) => move.trim());
                          return moves.map((moveSet, index) => {
                            const [whiteMove, blackMove] = moveSet
                              .trim()
                              .split(/\s+/);
                            return (
                              <tr key={index + 1} className="hover:bg-white/5">
                                <td className="p-2 border-b border-white/10 font-mono text-gray-400">
                                  {index + 1}
                                </td>
                                <td className="p-2 border-b border-white/10 font-mono">
                                  {whiteMove || "-"}
                                </td>
                                <td className="p-2 border-b border-white/10 font-mono">
                                  {blackMove || "-"}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No moves yet</p>
                )}
              </div>
            </div>
            <main className="p-8 h-[65dvh] aspect-square mx-auto">
              <div
                id="myBoard"
                ref={boardRef}
                style={{ width: "100%", margin: "auto" }}
              ></div>
                {/* Captured queue */}
                {capturedPieces.length > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {capturedPieces.map((piece, index) => (
                            <Image
                                key={index}
                                src={`/img/chesspieces/wikipedia/b${piece.toUpperCase()}.png`}
                                alt={`Captured ${piece}`}
                                width= {50}
                                 height={50}
                            />
                        ))}
                    </div>
                )}
            </main>
            <div className=" min-h-[60dvh] w-[30%]">
            <div className="text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-xl text-white w-fit px-3">
  {formatTime(blackTime)}
</div>
              <div className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl min-h-[350px] text-white">
                <div className=" flex items-center justify-start space-x-3">
                  <div className=" h-3 rounded-full bg-green-100 aspect-square"></div>
                  <h3>Anonymous</h3>
                </div>
                <div></div>
              </div>
            </div>
          </div>
          <footer className="p-6 text-center absolute bottom-0 left-0 right-0">
            <p className="text-gray-400">
              © 2024{" "}
              <a
                href="https://coullax.com/"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
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
