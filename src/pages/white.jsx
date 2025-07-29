
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import io from "socket.io-client";

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

  useEffect(() => {
    if (!scriptsReady) return;

    const initializeGame = async () => {
      // debugger
      await fetch("/api/socket");
      socket = io();

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

      // Socket event listeners
      socket.on('newMove', function(move) {
        if (gameRef.current) {
          const executedMove = gameRef.current.move(move);
          if (executedMove && move.captured) {
            const pieceNames = {
              p: 'Pawn',
              n: 'Knight',
              b: 'Bishop',
              r: 'Rook',
              q: 'Queen',
              k: 'King'
            };
            console.log(`Captured piece: ${pieceNames[move.captured]}`);
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
      if (moveColor === 'Black') {
        router.push('/win?player1Bool=true');
      } else {
        router.push('/lost');
      }
      return;
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
        <div className="max-w-[1800px] mx-auto">
          <div className="cover-container items-center justify-center flex flex-row p-3 mx-auto h-dvh">
            <div className=" bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl min-h-[60dvh] w-[30%] ">
              <h3 id="status">Status: {status}</h3>
              {/* <h3 id="status"></h3> */}
            </div>

            <main className=" p-8 h-[65dvh] aspect-square mx-auto">
              <div
                id="myBoard"
                ref={boardRef}
                style={{ width: "100%", margin: "auto" }}
              ></div>
            </main>

            <div className=" bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl min-h-[60dvh] w-[30%]">
              <h5>PGN:</h5>
              <h5 id="pgn">{pgn}</h5>
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
