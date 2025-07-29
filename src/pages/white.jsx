
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import io from "socket.io-client";
import Pusher from "pusher-js";

let socket;

export default function WhiteGame() {
  const router = useRouter();
  const [status, setStatus] = useState("Waiting for black to join");
  const [pgn, setPgn] = useState("");
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const boardInstanceRef = useRef(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState([]);


  useEffect(() => {
    if (!scriptsReady) return;

    const initializeGame = async () => {
      // debugger
      // await fetch("/api/socket");
      // socket = io();
      // const pusher = new Pusher('a4ad42bd9662f1406a19', {
      //   cluster: 'ap2'
      // });
      socket = io("http://localhost:3001", {
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
        updateStatus();
      }

      //       // Join channel based on game code from URL
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
      //     router.push("/win?player1Bool=true");
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
        // debugger
        console.log("Game started");
        setGameHasStarted(true);
        updateStatus();
      });

      socket.on('gameOverDisconnect', function() {
        router.push('/win?player1Bool=true');
      });

      // Join game with code from URL
      if (router.query.code) {
        socket.emit('joinGame', {
          code: router.query.code
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

  const onDragStart = (source, piece) => {
    if (!gameRef.current || gameRef.current.game_over()) return false;
    if (!gameHasStarted) return false;
    
    // Only allow white pieces to be dragged
    if (piece.search(/^w/) === -1) return false;
    
    // Only allow dragging when it's white's turn
    return gameRef.current.turn() === 'w';
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
    
    let status = '';
    const moveColor = gameRef.current.turn() === 'w' ? 'White' : 'Black';
    console.log("Current turn:", moveColor);
    if (gameRef.current.in_checkmate()) {
      status = 'Game over, ' + moveColor + ' is in checkmate.';
      // If it's black's turn and checkmate, black is losing
      if (gameRef.current.turn() === 'w') {
        router.push('/lost');
      } else {
        router.push('/win?player1Bool=false');
      }
    } else if (gameRef.current.in_draw()) {
      status = 'Game over, drawn position';
    } else if (!gameHasStarted) {
      status = 'Waiting for black to join';
    } else {
      status = `${moveColor} to move`;
      if (gameRef.current.in_check()) {
        status += `, ${moveColor} is in check`;
      }
    }
    
    setStatus(status);
    setPgn(gameRef.current.pgn());
  };

  return (
    <>
      <Head>
        <title>Chess Game - White Player</title>
        <meta name="description" content="Play chess as white" />
        <link rel="icon" href="/favicon.ico" />
        <link href="/css/chessboard-1.0.0.min.css" rel="stylesheet" />
      </Head>

      <Script src="/js/jquery-3.7.0.min.js" strategy="beforeInteractive" />
      <Script src="/js/chess-0.10.3.min.js" strategy="beforeInteractive" />
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
              Player 1
            </h1>
          </div>
        </header>
        <div className="max-w-[1550px] mx-auto">
          <div className="cover-container items-center justify-center flex flex-row p-3 mx-auto h-dvh">
            <div className=" min-h-[60dvh] w-[30%] ">
              <h3
                id="status"
                className="w-full min-h-[4dvh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white"
              >
                Status: {status}
              </h3>
              <div className="w-full min-h-[55dvh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white mt-6 ">
                <h5>PGN:</h5>
                <h5 id="pgn">{pgn}</h5>
              </div>
            </div>

            <main className=" p-8 h-[65dvh] aspect-square mx-auto">
              <div
                id="myBoard"
                ref={boardRef}
                style={{ width: "100%", margin: "auto" }}
              ></div>
                {capturedPieces.length > 0 && (
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {capturedPieces.map((piece, index) => (
                            <img
                                key={index}
                                src={`/img/chesspieces/wikipedia/w${piece}.png`}
                                alt={`Captured ${piece}`}
                                style={{ width: '50px', height: '50px' }}
                            />
                        ))}
                    </div>
                )}
            </main>

            <div className=" min-h-[60dvh] w-[30%]">
              <div className=" text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-xl text-white w-fit px-3">
                05:00:00
              </div>
              <div className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl min-h-[350px] text-white">
                <div className=" flex items-center justify-start space-x-3">
                  <div className=" h-3 rounded-full bg-green-100 aspect-square"></div>
                  <h3>Anonymous</h3>
                </div>
                <div>


                </div>
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