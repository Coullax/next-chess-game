import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import io from "socket.io-client";

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

  useEffect(() => {
    if (!scriptsReady) return;
    initializeGame();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line
  }, [scriptsReady]);

  const initializeGame = async () => {
    await fetch("/api/socket");
    socket = io();
    debugger

    // Initialize chess game
    if (typeof window !== 'undefined' && window.Chess && window.Chessboard && boardRef.current) {
      gameRef.current = new window.Chess();
      const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: '/img/chesspieces/wikipedia/{piece}.png'
      };
      debugger
      boardInstanceRef.current = window.Chessboard(boardRef.current, config);
      boardInstanceRef.current.flip();
      updateStatus();
    }

    // Socket event listeners
    socket.on('newMove', function(move) {
      if (gameRef.current) {
        gameRef.current.move(move);
        if (boardInstanceRef.current) {
          boardInstanceRef.current.position(gameRef.current.fen());
        }
        updateStatus();
      }
    });

    socket.on('startGame', function() {
      setGameHasStarted(true);
      updateStatus();
    });

    socket.on('gameOverDisconnect', function() {
      setGameOver(true);
      updateStatus();
      router.push('/win?player1Bool=false');
    });

    if (router.query.code) {
      socket.emit('joinGame', {
        code: router.query.code
      });
    }
  };

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
    socket.emit('move', theMove);
    updateStatus();
  };

  const onSnapEnd = () => {
    if (boardInstanceRef.current && gameRef.current) {
      boardInstanceRef.current.position(gameRef.current.fen());
    }
  };

  const updateStatus = () => {
    if (!gameRef.current) return;
    var status = '';
    var moveColor = 'White';
    if (gameRef.current.turn() === 'b') moveColor = 'Black';
    if (gameRef.current.in_checkmate()) {
      status = 'Game over, ' + moveColor + ' is in checkmate.';
      router.push('/win?player1Bool=false');
    } else if (gameRef.current.in_draw()) {
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
      <Script src="/js/jquery-3.7.0.min.js" strategy="beforeInteractive" onLoad={() => setScriptsReady(false)} />
      <Script src="/js/chess-0.10.3.min.js" strategy="beforeInteractive" onLoad={() => setScriptsReady(false)} />
      <Script src="/js/chessboard-1.0.0.min.js" strategy="beforeInteractive" onLoad={() => setScriptsReady(true)} />
      <div className="d-flex h-100 text-center text-bg-dark bg-dark">
        <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <div>
            <h3>Status:</h3>
            <h3 id="status">{status}</h3>
          </div>
          <main className="px-3">
            <div id="myBoard" ref={boardRef} style={{ width: '700px', margin: 'auto' }}></div>
          </main>
          <div>
            <h5>PGN:</h5>
            <h5 id="pgn">{pgn}</h5>
          </div>
          <footer className="mt-auto text-white-50">
            <p>© 2024 <a href="https://coullax.com/" className="text-white">Coullax</a> All Rights Reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
} 