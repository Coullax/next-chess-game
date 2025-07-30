import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import Script from "next/script";
import io from "socket.io-client";

// Remove global socket variable and manage it within the component
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
  const socketRef = useRef(null); // Use ref instead of global variable
  const gameParamsRef = useRef(null); // Store game parameters
  const [scriptsReady, setScriptsReady] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState({
    jquery: false,
    chess: false,
    chessboard: false
  });
  const [isInitializing, setIsInitializing] = useState(false); // Add initialization flag

  // Initialize game parameters once on mount
  useEffect(() => {
    gameParamsRef.current = {
      color: searchParams.get("color"),
      code: searchParams.get("code"),
      bet: searchParams.get("bet")
    };
    console.log("🔧 Game parameters initialized:", gameParamsRef.current);

    // Also set the player color immediately if available
    const colorParam = searchParams.get("color");
    if (colorParam && ["white", "black"].includes(colorParam.toLowerCase())) {
      console.log("🔧 Setting initial player color:", colorParam.toLowerCase());
      setPlayerColor(colorParam.toLowerCase());
    }
  }, []); // Only run once on mount

  // Check for already loaded scripts on component mount
  useEffect(() => {
    console.log("Checking for already loaded scripts...");
    const checkExistingScripts = () => {
      const scriptsStatus = {
        jquery: !!window.jQuery,
        chess: !!window.Chess,
        chessboard: !!window.Chessboard
      };

      console.log("Existing scripts found:", scriptsStatus);
      setScriptsLoaded(scriptsStatus);
    };

    // Check immediately
    checkExistingScripts();

    // Also check after a short delay in case scripts are still loading
    const timeout = setTimeout(checkExistingScripts, 100);

    return () => clearTimeout(timeout);
  }, []); // Empty dependency array - only run on mount

  // Fallback script loader
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only try to load scripts if they're not already available
      if ((!scriptsLoaded.chess && !window.Chess) || (!scriptsLoaded.chessboard && !window.Chessboard)) {
        console.log("Some essential scripts failed to load, trying CDN fallbacks...");

        if (!scriptsLoaded.chess && !window.Chess) {
          console.log("Loading Chess.js from CDN...");
          const chessScript = document.createElement('script');
          chessScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js';
          chessScript.onload = () => {
            console.log("Chess.js CDN fallback loaded");
            setScriptsLoaded(prev => ({ ...prev, chess: true }));
          };
          document.head.appendChild(chessScript);
        }

        if (!scriptsLoaded.chessboard && !window.Chessboard) {
          console.log("Loading Chessboard.js from CDN...");
          const chessboardScript = document.createElement('script');
          chessboardScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/chessboard.min.js';
          chessboardScript.onload = () => {
            console.log("Chessboard.js CDN fallback loaded");
            setScriptsLoaded(prev => ({ ...prev, chessboard: true }));
          };
          document.head.appendChild(chessboardScript);
        }

        // Try to load jQuery but don't block on it
        if (!scriptsLoaded.jquery && !window.jQuery) {
          console.log("Loading jQuery from CDN...");
          const jqueryScript = document.createElement('script');
          jqueryScript.src = 'https://code.jquery.com/jquery-3.7.0.min.js';
          jqueryScript.onload = () => {
            console.log("jQuery CDN fallback loaded");
            setScriptsLoaded(prev => ({ ...prev, jquery: true }));
          };
          jqueryScript.onerror = () => {
            console.log("jQuery fallback failed, continuing without it");
          };
          document.head.appendChild(jqueryScript);
        }
      } else {
        console.log("All essential scripts already available, no fallback needed");
      }
    }, 1000); // Reduced timeout to 1 second

    return () => clearTimeout(timeout);
  }, [scriptsLoaded]);
  const [capturedPieces, setCapturedPieces] = useState([]);
  const [playerColor, setPlayerColor] = useState("white");
  const [betAmount, setBetAmount] = useState(0);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [whiteTime, setWhiteTime] = useState(1800); // 30 minutes in seconds
const [blackTime, setBlackTime] = useState(1800); // 30 minutes in seconds


  // Check if all scripts are loaded
  useEffect(() => {
    console.log("Scripts loaded state:", scriptsLoaded);
    console.log("Window objects available:", {
      Chess: !!window.Chess,
      Chessboard: !!window.Chessboard,
      jQuery: !!window.jQuery
    });

    // Chess and Chessboard are the essential ones, check both state and window objects
    const chessReady = scriptsLoaded.chess || !!window.Chess;
    const chessboardReady = scriptsLoaded.chessboard || !!window.Chessboard;

    if (chessReady && chessboardReady) {
      console.log("Essential scripts loaded, setting scriptsReady to true");
      setScriptsReady(true);
    } else {
      console.log("Waiting for scripts...", { chessReady, chessboardReady });
    }
  }, [scriptsLoaded]);


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

// Add formatTime helper function inside ChessGame component
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

  useEffect(() => {
    console.log("useEffect triggered - scriptsReady:", scriptsReady);
    if (!scriptsReady || isInitializing) return;

    const initializeGame = async () => {
      console.log("Initializing game...");
      setIsInitializing(true);

      // Clean up previous socket connection more thoroughly
      if (socketRef.current) {
        console.log("Cleaning up previous socket");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        // Wait a bit to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const colorParam = gameParamsRef.current?.color;
      const code = gameParamsRef.current?.code;
      const betParam = gameParamsRef.current?.bet;

      console.log("🔧 INITIALIZATION - Raw params:", gameParamsRef.current);
      console.log("🔧 INITIALIZATION - Color param:", colorParam);
      console.log("🔧 INITIALIZATION - Current playerColor state:", playerColor);

      if (colorParam && ["white", "black"].includes(colorParam.toLowerCase())) {
        console.log("🔧 INITIALIZATION - Setting player color to:", colorParam.toLowerCase());
        setPlayerColor(colorParam.toLowerCase());
      } else {
        console.error("🔧 INITIALIZATION - Invalid color parameter:", colorParam);
        setStatus("Invalid color parameter");
        setIsInitializing(false);
        return;
      }

      if (!code ) {
        setStatus("Invalid game code");
        setIsInitializing(false);
        return;
      }

      if (betParam && !isNaN(betParam)) {
        setBetAmount(parseInt(betParam));
      } else {
        setStatus("Invalid bet amount");
        setIsInitializing(false);
        return;
      }

      console.log("Checking dependencies...");
      // Wait a bit for scripts to be fully available
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check all dependencies
      if (
        !window.Chess ||
        !window.Chessboard ||
        !boardRef.current
      ) {
        console.error("Missing dependencies:", {
          Chess: !!window.Chess,
          Chessboard: !!window.Chessboard,
          boardRef: !!boardRef.current,
        });
        setStatus("Failed to load game dependencies");
        setIsInitializing(false);
        return;
      }

      console.log("All dependencies available, initializing socket...");

      // Create new socket connection
      socketRef.current = io("https://chess-site-server.onrender.com", {
        reconnection: true,
        reconnectionAttempts: 5,
        forceNew: true, // Force a new connection
        query: { code, color: colorParam.toLowerCase() },
      });

      // Clean up previous game instance
      if (gameRef.current) {
        gameRef.current = null;
      }

      // Clean up previous board instance
      if (boardInstanceRef.current && typeof boardInstanceRef.current.destroy === 'function') {
        console.log("Destroying previous board instance");
        boardInstanceRef.current.destroy();
        boardInstanceRef.current = null;
      }

      console.log("Creating new Chess game...");
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
        onMoveEnd: () => {
          console.log("Move animation ended");
        },
        onDragEnd: () => {
          console.log("Drag ended");
        }
      };

      try {
        console.log("Creating chessboard...");
        boardInstanceRef.current = window.Chessboard(boardRef.current, config);
        console.log("Chessboard created successfully");

        if (colorParam.toLowerCase() === "black") {
          console.log("Flipping board for black player");
          boardInstanceRef.current.flip();
        }

        // Test board configuration
        console.log("🔧 Board config test:");
        console.log("🔧 Board draggable:", boardInstanceRef.current.config?.draggable);
        console.log("🔧 Board orientation:", boardInstanceRef.current.orientation());

        updateStatus();
      } catch (error) {
        console.error("Chessboard initialization failed:", error);
        setStatus("Failed to initialize chessboard");
        setIsInitializing(false);
        return;
      }

      // Set up socket event listeners
      socketRef.current.on("connect", () => {
        console.log("Connected to server, socket ID:", socketRef.current.id);
        setIsInitializing(false); // Mark initialization as complete
        // Add a small delay to ensure previous connections are cleaned up
        setTimeout(() => {
          if (socketRef.current) {
            const code = gameParamsRef.current?.code;
            const color = gameParamsRef.current?.color;
            if (code && color) {
              socketRef.current.emit("joinGame", { code, color: color.toLowerCase() });
            }
          }
        }, 500);
      });

      socketRef.current.on("newMove", (move) => {
        console.log("📦 RECEIVED MOVE:", move, "Current player:", playerColor);
        if (gameRef.current && !gameOver) {
          console.log("📦 Before move - FEN:", gameRef.current.fen());
          console.log("📦 Before move - Turn:", gameRef.current.turn());

          const executedMove = gameRef.current.move(move);

          console.log("📦 After move - FEN:", gameRef.current.fen());
          console.log("📦 After move - Turn:", gameRef.current.turn());
          console.log("📦 Executed move:", executedMove);

          if (executedMove && move.captured) {
            setCapturedPieces((prev) => [...prev, move.captured]);
          }
          if (boardInstanceRef.current) {
            boardInstanceRef.current.position(gameRef.current.fen());
            console.log("📦 Board position updated");
          }
          checkGameState();
        }
      });

      socketRef.current.on("startGame", () => {
        setGameHasStarted(true);
        setIsReconnecting(false);
        updateStatus();
      });

      socketRef.current.on("opponentLeft", (data) => {
        const playerColor = gameParamsRef.current?.color?.toLowerCase();
        if (data.winnerColor !== playerColor && !gameOver) {
          setOpponentLeft(true);
          setGameOver(true);
          updateStatus();
          router.push(`/win`);
        }
      });

      socketRef.current.on("reconnect", () => {
        setIsReconnecting(true);
        const code = gameParamsRef.current?.code;
        const color = gameParamsRef.current?.color;
        if (code && color) socketRef.current.emit("joinGame", { code, color: color.toLowerCase() });
      });

      socketRef.current.on("rematchRequest", () => {
        if (!rematchRequested && !gameOver) setShowRematchRequest(true);
      });

      socketRef.current.on("error", (error) => {
        console.error("Socket error:", error);
        if (error.message === "Color already taken") {
          console.log("Color already taken - showing error message");
          setStatus("This color is already taken in this game. Please go back and try a different game or color.");
          // Don't auto-redirect, let user decide what to do
        } else {
          setStatus(`Error: ${error.message}`);
        }
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsInitializing(false); // Reset initialization flag on disconnect
      });
    };

    initializeGame().catch((error) => {
      console.error("Game initialization failed:", error);
      setStatus("Game initialization failed");
      setIsInitializing(false);
    });

    // Cleanup function - this runs when the component unmounts or dependencies change
    return () => {
      console.log("⚠️ CLEANUP: useEffect cleanup triggered - this could indicate unexpected re-initialization");
      setIsInitializing(false);
      if (socketRef.current) {
        // Notify server that we're leaving the game
        const code = gameParamsRef.current?.code;
        const colorParam = gameParamsRef.current?.color;
        if (code && colorParam) {
          console.log("Sending leaveGame event:", { code, color: colorParam.toLowerCase() });
          socketRef.current.emit("leaveGame", { code, color: colorParam.toLowerCase() });
        }
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [scriptsReady]); // Removed router and searchParams dependencies

  // Cleanup on component unmount
  useEffect(() => {
    // Clean up when user navigates away or closes tab
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        const code = gameParamsRef.current?.code;
        const colorParam = gameParamsRef.current?.color;
        if (code && colorParam) {
          socketRef.current.emit("leaveGame", { code, color: colorParam.toLowerCase() });
        }
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log("⚠️ COMPONENT UNMOUNT: Final cleanup - this should only happen when leaving the game page");
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (socketRef.current) {
        const code = gameParamsRef.current?.code;
        const colorParam = gameParamsRef.current?.color;
        if (code && colorParam) {
          console.log("Final leaveGame event:", { code, color: colorParam.toLowerCase() });
          socketRef.current.emit("leaveGame", { code, color: colorParam.toLowerCase() });
        }
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (boardInstanceRef.current && typeof boardInstanceRef.current.destroy === 'function') {
        boardInstanceRef.current.destroy();
        boardInstanceRef.current = null;
      }
      if (gameRef.current) {
        gameRef.current = null;
      }
    };
  }, []);

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
  // const onDragStart = (source, piece) => {
  //   console.log(
  //     "Drag start:",
  //     source,
  //     piece,
  //     gameRef.current?.turn(),
  //     playerColor
  //   );
  //   if (!gameRef.current || gameRef.current.game_over()) return false;
  //   if (gameOver || !gameHasStarted) return false;

  //   const isWhitePiece = piece.search(/^w/) !== -1;
  //   const isBlackPiece = piece.search(/^b/) !== -1;
  //   const currentTurn = gameRef.current.turn();

  //   // Check if it's the player's turn and they're moving their own pieces
  //   if (playerColor === "white") {
  //     return currentTurn === "w" && isWhitePiece;
  //   } else {
  //     return currentTurn === "b" && isBlackPiece;
  //   }
  // };
  const onDragStart = (source, piece) => {
    const currentTurn = gameRef.current?.turn();
    const isWhitePiece = piece.search(/^w/) !== -1;
    const isBlackPiece = piece.search(/^b/) !== -1;

    console.log("🔍 DRAG START DEBUG:", {
      source,
      piece,
      currentTurn,
      playerColor,
      isWhitePiece,
      isBlackPiece,
      gameHasStarted,
      gameOver,
      gameExists: !!gameRef.current,
      gameOverCheck: gameRef.current?.game_over()
    });

    if (!gameRef.current || gameRef.current.game_over()) {
      console.log("❌ BLOCKED: Game not available or game over");
      return false;
    }

    if (gameOver) {
      console.log("❌ BLOCKED: Game state shows game over");
      return false;
    }

    // Check if it's the player's turn and they're moving their own pieces
    if (playerColor === "white") {
      const canMove = currentTurn === "w" && isWhitePiece;
      console.log("🔍 WHITE PLAYER CHECK:", { currentTurn, isWhitePiece, canMove });
      return canMove;
    } else {
      const canMove = currentTurn === "b" && isBlackPiece;
      console.log("🔍 BLACK PLAYER CHECK:", { currentTurn, isBlackPiece, canMove });
      return canMove;
    }
  };
  const onDrop = (source, target) => {
    console.log("📤 DROP ATTEMPT:", source, "->", target, "gameOver:", gameOver, "isReconnecting:", isReconnecting);

    if (!gameRef.current || gameOver || isReconnecting) return;

    const theMove = { from: source, to: target, promotion: "q" };
    const move = gameRef.current.move(theMove);

    if (move === null) {
      console.log("❌ INVALID MOVE, returning snapback");
      return "snapback";
    }

    console.log("✅ VALID MOVE executed:", move);
    console.log("📤 Sending move to server:", { ...theMove, captured: move.captured || null });

    if (socketRef.current) {
      socketRef.current.emit("move", { ...theMove, captured: move.captured || null });
    }
    checkGameState();
  };

  const onSnapEnd = () => {
    if (boardInstanceRef.current && gameRef.current) {
      boardInstanceRef.current.position(gameRef.current.fen());
    }
  };

  const checkGameState = () => {
    if (!gameRef.current) return;

    // Don't check for game end conditions if the game just started
    if (gameRef.current.history().length < 2) {
      console.log("Game just started, skipping end game checks");
      updateStatus();
      return;
    }

    if (gameRef.current.in_checkmate()) {
      console.log("Checkmate detected!");
      setGameOver(true);
      const currentTurn = gameRef.current.turn();
      const playerTurn = playerColor === "white" ? "w" : "b";

      console.log("Current turn:", currentTurn, "Player turn:", playerTurn);

      if (currentTurn !== playerTurn) {
        console.log("Player wins! Redirecting to /win");
        setTimeout(() => router.push(`/win`), 1000); // Add delay
      } else {
        console.log("Player loses! Redirecting to /lost");
        setTimeout(() => router.push("/lost"), 1000); // Add delay
      }
    } else if (gameRef.current.in_draw()) {
      console.log("Draw detected!");
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
      else if (gameRef.current.in_checkmate())
        status = `Game over, ${moveColor} is in checkmate.`;
      else if (gameRef.current.in_draw()) status = "Game over, drawn position";
    } else if (!gameHasStarted) {
      status = `Waiting for ${
        playerColor === "white" ? "black" : "white"
      } to join`;
    } else {
      status = `${moveColor} to move`;
      if (gameRef.current.in_check()) status += `, ${moveColor} is in check`;
    }
    setStatus(status);
    setPgn(gameRef.current.pgn());
  };

  const requestRematch = () => {
    if (socketRef.current && !rematchRequested && gameOver) {
      socketRef.current.emit("rematchRequest");
      setRematchRequested(true);
      setStatus("Rematch requested, waiting for opponent...");
    }
  };

  const acceptRematch = () => {
    if (socketRef.current && showRematchRequest) {
      socketRef.current.emit("acceptRematch");
      setShowRematchRequest(false);
      setRematchRequested(false);
      setGameHasStarted(false);
      setGameOver(false);
      setCapturedPieces([]);
      setOpponentLeft(false);
      setWhiteTime(60);
      setBlackTime(60);

      if (gameRef.current) {
        gameRef.current = new window.Chess();
      }
      if (boardInstanceRef.current) {
        boardInstanceRef.current.position("start");
      }
      updateStatus();
    }
  };

  const ignoreRematch = () => {
    console.log("User ignored rematch, redirecting to home");
    setShowRematchRequest(false);
    router.push("/");
  };

  const claimBet = () => {
    console.log("Bet claimed:", betAmount, "redirecting to home");
    setShowWinModal(false);
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>
          Chess Game -{" "}
          {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} Player
        </title>
        <meta name="description" content={`Play chess as ${playerColor}`} />
        <link rel="icon" href="/favicon.ico" />
        <link href="/css/chessboard-1.0.0.min.css" rel="stylesheet" />
      </Head>
      <Script
        src="https://code.jquery.com/jquery-3.7.0.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("jQuery CDN loaded successfully");
          setScriptsLoaded(prev => ({ ...prev, jquery: true }));
        }}
        onReady={() => {
          // This fires when script is ready, even if already loaded
          if (window.jQuery && !scriptsLoaded.jquery) {
            console.log("jQuery already available");
            setScriptsLoaded(prev => ({ ...prev, jquery: true }));
          }
        }}
        onError={(e) => {
          console.error("jQuery CDN failed to load:", e);
          // Try local fallback
          const script = document.createElement('script');
          script.src = '/js/jquery-3.7.0.min.js';
          script.onload = () => {
            console.log("jQuery local fallback loaded successfully");
            setScriptsLoaded(prev => ({ ...prev, jquery: true }));
          };
          script.onerror = () => {
            console.log("jQuery not available, continuing without it");
            setScriptsLoaded(prev => ({ ...prev, jquery: false }));
          };
          document.head.appendChild(script);
        }}
      />
      <Script
        src="/js/chess-0.10.3.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Chess.js loaded successfully");
          setScriptsLoaded(prev => ({ ...prev, chess: true }));
        }}
        onReady={() => {
          // This fires when script is ready, even if already loaded
          if (window.Chess && !scriptsLoaded.chess) {
            console.log("Chess.js already available");
            setScriptsLoaded(prev => ({ ...prev, chess: true }));
          }
        }}
        onError={(e) => {
          console.error("Chess.js failed to load:", e);
          // Fallback to CDN
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js';
          script.onload = () => {
            console.log("Chess.js CDN loaded successfully");
            setScriptsLoaded(prev => ({ ...prev, chess: true }));
          };
          document.head.appendChild(script);
        }}
      />
      <Script
        src="/js/chessboard-1.0.0.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Chessboard.js loaded successfully");
          setScriptsLoaded(prev => ({ ...prev, chessboard: true }));
        }}
        onReady={() => {
          // This fires when script is ready, even if already loaded
          if (window.Chessboard && !scriptsLoaded.chessboard) {
            console.log("Chessboard.js already available");
            setScriptsLoaded(prev => ({ ...prev, chessboard: true }));
          }
        }}
        onError={(e) => {
          console.error("Chessboard.js failed to load:", e);
          // Fallback to CDN
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/chessboard.min.js';
          script.onload = () => {
            console.log("Chessboard.js CDN loaded successfully");
            setScriptsLoaded(prev => ({ ...prev, chessboard: true }));
          };
          document.head.appendChild(script);
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <header className="p-6">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">♚</span>
              </div>
              <h1 className="uppercase text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                Royal Chess Arena
              </h1>
            </div>
            <h1 className="uppercase text-2xl md:text-3xl font-bold">
              {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}{" "}
              Player
            </h1>
          </div>
        </header>
        <div className="max-w-7xl mx-auto">
          <div className="cover-container items-center justify-center flex flex-row p-3 mx-auto h-[90dvh] relative">
            <div className=" absolute top-20 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-4xl flex items-center">
              <img
                width="53"
                height="53"
                src="https://img.icons8.com/external-vectorslab-flat-vectorslab/53/external-Dollar-Coins-casino-vectorslab-flat-vectorslab.png"
                alt="external-Dollar-Coins-casino-vectorslab-flat-vectorslab"
                className="inline-block"
              />
              <span className="inline-block ml-3">{betAmount * 2} Coins</span>
            </div>
            <div className="min-h-[45vh] w-[30%]">
              {/* <h3
                id="status"
                className="w-full min-h-[4dvh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white"
              >
                Status: {status}
              </h3> */}
              <div className="w-full min-h-[45vh] px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white overflow-auto">
                <h5 className="mb-3 font-bold">Move History:</h5>
                {pgn ? (
                  <div className="overflow-auto max-h-[40vh]">
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
            <main className="p-8 h-[50vh] aspect-square mx-auto">
              <div
                id="myBoard"
                ref={boardRef}
                style={{ width: "100%", margin: "auto" }}
              ></div>
              {capturedPieces.length > 0 && (
                <div
                  style={{
                    marginBottom: playerColor === "white" ? "20px" : "0",
                    marginTop: playerColor === "black" ? "20px" : "0",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {capturedPieces.map((piece, index) => (
                    <img
                      key={index}
                      src={`/img/chesspieces/wikipedia/${playerColor.charAt(
                        0
                      )}${piece}.png`}
                      alt={`Captured ${piece}`}
                      style={{ width: "50px", height: "50px" }}
                    />
                  ))}
                </div>
              )}
            </main>
            <div className="min-h-[45vh] w-[30%]">
            <div className="text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-xl text-white w-fit px-3">
  {playerColor === "white" ? formatTime(whiteTime) : formatTime(blackTime)}
</div>
              <div className="w-full px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl min-h-[350px] text-white">
                <div className="flex items-center border-b border-white/20 pb-3 justify-start space-x-3">
                  <div className="h-3 rounded-full bg-green-100 aspect-square"></div>
                  <h3>Anonymous</h3>
                </div>
                <div className=" mt-3">
                  <h3
                    id="status"
                    className="w-full min-h-[4vh] px-4 py-3 text-white"
                  >
                    <img
                      width="35"
                      height="35"
                      src="https://img.icons8.com/cotton/64/information--v2.png"
                      alt="information--v2"
                      className="inline-block"
                    />
                    <span className=" inline-block pl-3">{status}</span>
                  </h3>
                  {/* Debug info */}
                  <div className="mt-2 text-xs text-gray-400">
                    <div>Scripts Ready: {scriptsReady ? "✓" : "✗"}</div>
                    <div>Chess.js: {scriptsLoaded.chess ? "✓" : "✗"} (Required)</div>
                    <div>Chessboard.js: {scriptsLoaded.chessboard ? "✓" : "✗"} (Required)</div>
                    <div>jQuery: {scriptsLoaded.jquery ? "✓" : "✗"} (Optional)</div>
                    <div>Game Started: {gameHasStarted ? "✓" : "✗"}</div>
                    <div>Game Over: {gameOver ? "✓" : "✗"}</div>
                    <div>Player Color: <span className="text-yellow-300">{playerColor}</span></div>
                    <div>Current Turn: <span className="text-yellow-300">{gameRef.current?.turn() === "w" ? "White" : gameRef.current?.turn() === "b" ? "Black" : "N/A"}</span></div>
                    <div>Can I Move?: <span className="text-yellow-300">{
                      gameRef.current?.turn() === (playerColor === "white" ? "w" : "b") ? "✓ YES" : "✗ NO"
                    }</span></div>
                    <div>Move Count: {gameRef.current?.history()?.length || 0}</div>
                    <div>Initializing: {isInitializing ? "✓" : "✗"}</div>
                    <div>Reconnecting: {isReconnecting ? "✓" : "✗"}</div>
                  </div>

                  {/* Test button for black player */}
                  {playerColor === "black" && gameRef.current?.turn() === "b" && (
                    <button
                      onClick={() => {
                        console.log("🧪 TESTING: Force move e7 to e5");
                        const testMove = gameRef.current.move({ from: 'e7', to: 'e5' });
                        if (testMove) {
                          console.log("🧪 Test move successful:", testMove);
                          boardInstanceRef.current?.position(gameRef.current.fen());
                          if (socketRef.current) {
                            socketRef.current.emit("move", { from: 'e7', to: 'e5' });
                          }
                        } else {
                          console.log("🧪 Test move failed");
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
                    >
                      🧪 Test Move (e7→e5)
                    </button>
                  )}
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
