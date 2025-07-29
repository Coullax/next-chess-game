
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
      debugger
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
          gameRef.current.move(move);
          if (boardInstanceRef.current) {
            boardInstanceRef.current.position(gameRef.current.fen());
          }
          updateStatus();
        }
      });

      socket.on('startGame', function() {
        debugger
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
    if (!gameRef.current) return 'snapback';
    
    const move = gameRef.current.move({
      from: source,
      to: target,
      promotion: 'q'
    });

    if (move === null) return 'snapback';
    
    socket.emit('move', move);
    updateStatus();
    return move;
  };

  const onSnapEnd = () => {
    if (boardInstanceRef.current && gameRef.current) {
      boardInstanceRef.current.position(gameRef.current.fen());
    }
  };

  const updateStatus = () => {
    debugger
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
      
      <Script 
        src="/js/jquery-3.7.0.min.js" 
        strategy="beforeInteractive" 
      />
      <Script 
        src="/js/chess-0.10.3.min.js" 
        strategy="beforeInteractive" 
      />
      <Script 
        src="/js/chessboard-1.0.0.min.js" 
        strategy="beforeInteractive" 
        onLoad={() => setScriptsReady(true)}
      />
      
      <div className="d-flex h-100 text-center text-bg-dark bg-dark">
        <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <div>
            <h3>Status:</h3>
            <h3 id="status">{status}</h3>
          </div>
          
          <main className="px-3">
            <div 
              id="myBoard" 
              ref={boardRef} 
              style={{ width: '100%', maxWidth: '700px', margin: 'auto' }}
            ></div>
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