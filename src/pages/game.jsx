import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import Script from "next/script";
import io from "socket.io-client";
import Winner from "@/components/winner";

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
  const [capturedPieces, setCapturedPieces] = useState([]);
  const [playerColor, setPlayerColor] = useState("white");
  const [betAmount, setBetAmount] = useState(0);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [whiteTime, setWhiteTime] = useState(1800); // 30 minutes in seconds
  const [blackTime, setBlackTime] = useState(1800); // 30 minutes in seconds
  const [scriptsLoaded, setScriptsLoaded] = useState({
    jquery: false,
    chess: false,
    chessboard: false,
  });
  const [isInitializing, setIsInitializing] = useState(false); // Add initialization flag
  const [winner, setWinner] = useState(null); // Track winner state
  const [rematchStarted, setRematchStarted] = useState(false); // Track rematch acceptance
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false); // Mobile panel state
  const [mobileActiveTab, setMobileActiveTab] = useState("moves"); // Mobile active tab

  // Initialize game parameters once on mount
  useEffect(() => {
    gameParamsRef.current = {
      color: searchParams.get("color"),
      code: searchParams.get("code"),
      bet: searchParams.get("bet"),
    };
    // console.log("🔧 Game parameters initialized:", gameParamsRef.current);

    // Also set the player color immediately if available
    const colorParam = searchParams.get("color");
    if (colorParam && ["white", "black"].includes(colorParam.toLowerCase())) {
      // console.log("🔧 Setting initial player color:", colorParam.toLowerCase());
      setPlayerColor(colorParam.toLowerCase());
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Inject the blink CSS into the document
    const styleSheet = document.createElement("style");
    styleSheet.textContent = blinkStyle;
    document.head.appendChild(styleSheet);

    // Add mobile touch handling for the chess board
    const handleTouchStart = (e) => {
      // Only prevent if touching chess board elements
      if (e.target.closest("#myBoard")) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e) => {
      // Only prevent if touching chess board elements
      if (e.target.closest("#myBoard")) {
        e.preventDefault();
      }
    };

    // Add passive: false to ensure preventDefault works
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.head.removeChild(styleSheet);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const blinkStyle = `
  .blink-king {
    animation: blink 1s linear infinite;
    background-color: rgba(255, 0, 0, 0.5);
  }
  @keyframes blink {
    0% { background-color: rgba(255, 0, 0, 0.5); }
    50% { background-color: rgba(255, 0, 0, 0.2); }
    100% { background-color: rgba(255, 0, 0, 0.5); }
  }
  
  /* Prevent page scrolling during chess piece dragging on mobile */
  #myBoard {
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  #myBoard .square-55d63 {
    touch-action: none;
  }
  
  #myBoard img {
    touch-action: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }
`;

  // Check for already loaded scripts on component mount
  useEffect(() => {
    // console.log("Checking for already loaded scripts...");
    const checkExistingScripts = () => {
      const scriptsStatus = {
        jquery: !!window.jQuery,
        chess: !!window.Chess,
        chessboard: !!window.Chessboard,
      };

      // console.log("Existing scripts found:", scriptsStatus);
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
      if (
        (!scriptsLoaded.chess && !window.Chess) ||
        (!scriptsLoaded.chessboard && !window.Chessboard)
      ) {
        // console.log("Some essential scripts failed to load, trying CDN fallbacks...");

        if (!scriptsLoaded.chess && !window.Chess) {
          // console.log("Loading Chess.js from CDN...");
          const chessScript = document.createElement("script");
          chessScript.src =
            "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js";
          chessScript.onload = () => {
            // console.log("Chess.js CDN fallback loaded");
            setScriptsLoaded((prev) => ({ ...prev, chess: true }));
          };
          document.head.appendChild(chessScript);
        }

        if (!scriptsLoaded.chessboard && !window.Chessboard) {
          // console.log("Loading Chessboard.js from CDN...");
          const chessboardScript = document.createElement("script");
          chessboardScript.src =
            "https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/chessboard.min.js";
          chessboardScript.onload = () => {
            // console.log("Chessboard.js CDN fallback loaded");
            setScriptsLoaded((prev) => ({ ...prev, chessboard: true }));
          };
          document.head.appendChild(chessboardScript);
        }

        // Try to load jQuery but don't block on it
        if (!scriptsLoaded.jquery && !window.jQuery) {
          // console.log("Loading jQuery from CDN...");
          const jqueryScript = document.createElement("script");
          jqueryScript.src = "https://code.jquery.com/jquery-3.7.0.min.js";
          jqueryScript.onload = () => {
            // console.log("jQuery CDN fallback loaded");
            setScriptsLoaded((prev) => ({ ...prev, jquery: true }));
          };
          jqueryScript.onerror = () => {
            // console.log("jQuery fallback failed, continuing without it");
          };
          document.head.appendChild(jqueryScript);
        }
      } else {
        // console.log("All essential scripts already available, no fallback needed");
      }
    }, 1000); // Reduced timeout to 1 second

    return () => clearTimeout(timeout);
  }, [scriptsLoaded]);

  // Check if all scripts are loaded
  useEffect(() => {
    // console.log("Scripts loaded state:", scriptsLoaded);
    // console.log("Window objects available:", {
    //   Chess: !!window.Chess,
    //   Chessboard: !!window.Chessboard,
    //   jQuery: !!window.jQuery
    // });

    // Chess and Chessboard are the essential ones, check both state and window objects
    const chessReady = scriptsLoaded.chess || !!window.Chess;
    const chessboardReady = scriptsLoaded.chessboard || !!window.Chessboard;

    if (chessReady && chessboardReady) {
      // console.log("Essential scripts loaded, setting scriptsReady to true");
      setScriptsReady(true);
    } else {
      // console.log("Waiting for scripts...", { chessReady, chessboardReady });
    }
  }, [scriptsLoaded]);

  useEffect(() => {
    if (!gameHasStarted || gameOver || !gameRef.current) return;

    const timer = setInterval(() => {
      if (gameRef.current.turn() === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            // White player runs out of time, black wins
            setGameOver(true);
            setWinner("black");
            setStatus("White player ran out of time - Black wins!");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            // Black player runs out of time, white wins
            setGameOver(true);
            setWinner("white");
            setStatus("Black player ran out of time - White wins!");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameHasStarted, gameOver, whiteTime, blackTime]);

  // Add formatTime helper function inside ChessGame component
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    // console.log("useEffect triggered - scriptsReady:", scriptsReady);
    if (!scriptsReady || isInitializing) return;

    const initializeGame = async () => {
      // console.log("Initializing game...");
      setIsInitializing(true);

      // Clean up previous socket connection more thoroughly
      if (socketRef.current) {
        // console.log("Cleaning up previous socket");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        // Wait a bit to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const colorParam = gameParamsRef.current?.color;
      const code = gameParamsRef.current?.code;
      const betParam = gameParamsRef.current?.bet;

      // console.log("🔧 INITIALIZATION - Raw params:", gameParamsRef.current);
      // console.log("🔧 INITIALIZATION - Color param:", colorParam);
      // console.log("🔧 INITIALIZATION - Current playerColor state:", playerColor);

      if (colorParam && ["white", "black"].includes(colorParam.toLowerCase())) {
        // console.log("🔧 INITIALIZATION - Setting player color to:", colorParam.toLowerCase());
        setPlayerColor(colorParam.toLowerCase());
      } else {
        console.error(
          "🔧 INITIALIZATION - Invalid color parameter:",
          colorParam
        );
        setStatus("Invalid color parameter");
        setIsInitializing(false);
        return;
      }

      if (!code) {
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

      // console.log("Checking dependencies...");
      // Wait a bit for scripts to be fully available
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check all dependencies
      if (!window.Chess || !window.Chessboard || !boardRef.current) {
        console.error("Missing dependencies:", {
          Chess: !!window.Chess,
          Chessboard: !!window.Chessboard,
          boardRef: !!boardRef.current,
        });
        setStatus("Failed to load game dependencies");
        setIsInitializing(false);
        return;
      }

      // console.log("All dependencies available, initializing socket...");

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
      if (
        boardInstanceRef.current &&
        typeof boardInstanceRef.current.destroy === "function"
      ) {
        // console.log("Destroying previous board instance");
        boardInstanceRef.current.destroy();
        boardInstanceRef.current = null;
      }

      // console.log("Creating new Chess game...");
      gameRef.current = new window.Chess();
      // console.log("Game initialized with FEN:", gameRef.current.fen());

      const config = {
        draggable: true,
        position: "start",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: "/img/chesspieces/wikipedia/{piece}.png",
        moveSpeed: "fast",
        onMoveEnd: () => {
          // console.log("Move animation ended");
        },
        onDragEnd: () => {
          // console.log("Drag ended");
        },
      };

      try {
        // console.log("Creating chessboard...");
        boardInstanceRef.current = window.Chessboard(boardRef.current, config);
        // console.log("Chessboard created successfully");

        if (colorParam.toLowerCase() === "black") {
          // console.log("Flipping board for black player");
          boardInstanceRef.current.flip();
        }

        // Test board configuration
        // console.log("🔧 Board config test:");
        // console.log("🔧 Board draggable:", boardInstanceRef.current.config?.draggable);
        // console.log("🔧 Board orientation:", boardInstanceRef.current.orientation());

        updateStatus();
      } catch (error) {
        console.error("Chessboard initialization failed:", error);
        setStatus("Failed to initialize chessboard");
        setIsInitializing(false);
        return;
      }

      // Set up socket event listeners
      socketRef.current.on("connect", () => {
        // console.log("Connected to server, socket ID:", socketRef.current.id);
        setIsInitializing(false); // Mark initialization as complete
        setStatus("Connected to server, joining game...");
        // Add a small delay to ensure previous connections are cleaned up
        setTimeout(() => {
          if (socketRef.current) {
            const code = gameParamsRef.current?.code;
            const color = gameParamsRef.current?.color;
            if (code && color) {
              socketRef.current.emit("joinGame", {
                code,
                color: color.toLowerCase(),
              });
            }
          }
        }, 500);
      });

      socketRef.current.on("gameJoined", (data) => {
        // This event should fire when successfully joined a game
        if (data && data.message) {
          setStatus(data.message);
        } else {
          const waitingFor = playerColor === "white" ? "you" : "white";
          setStatus(`Waiting for ${waitingFor} to start the game...`);
        }
        updateStatus();
      });

      socketRef.current.on("newMove", (move) => {
        // console.log("📦 RECEIVED MOVE:", move, "Current player:", playerColor);
        if (gameRef.current && !gameOver) {
          // console.log("📦 Before move - FEN:", gameRef.current.fen());
          // console.log("📦 Before move - Turn:", gameRef.current.turn());

          const executedMove = gameRef.current.move(move);

          // console.log("📦 After move - FEN:", gameRef.current.fen());
          // console.log("📦 After move - Turn:", gameRef.current.turn());
          // console.log("📦 Executed move:", executedMove);

          if (executedMove && move.captured) {
            setCapturedPieces((prev) => [...prev, move.captured]);
          }
          if (boardInstanceRef.current) {
            boardInstanceRef.current.position(gameRef.current.fen());
            // console.log("📦 Board position updated");
          }
          checkGameState();
        }
      });

      socketRef.current.on("startGame", () => {
        setGameOver(false);
        setGameHasStarted(true);
        setIsReconnecting(false);
        setRematchRequested(false);
        // Use setTimeout to ensure state updates are applied before status update
        setTimeout(() => {
          updateStatus();
        }, 100);
      });

      socketRef.current.on("playerJoined", (data) => {
        // Update status when a player joins
        if (data && data.playersCount) {
          if (data.playersCount === 1) {
            const waitingFor = playerColor === "white" ? "black" : "white";
            setStatus(`Waiting for ${waitingFor} player to join...`);
          } else if (data.playersCount === 2) {
            setStatus("Both players connected, starting game...");
          }
        }
      });

      socketRef.current.on("RestartGame", () => {
        setGameOver(false);
        setGameHasStarted(true);
        setIsReconnecting(false);
        setRematchRequested(false);
        setCapturedPieces([]);
        setOpponentLeft(false);
        setWhiteTime(1800);
        setBlackTime(1800);
        setWinner(null);
        if (gameRef.current) gameRef.current = null;
        if (boardInstanceRef.current?.destroy)
          boardInstanceRef.current.destroy();
        gameRef.current = new window.Chess();
        boardInstanceRef.current = window.Chessboard(boardRef.current, {
          draggable: true,
          position: "start",
          onDragStart,
          onDrop,
          onSnapEnd,
          pieceTheme: "/img/chesspieces/wikipedia/{piece}.png",
          moveSpeed: "fast",
        });
        if (playerColor.toLowerCase() === "black")
          boardInstanceRef.current.flip();
        updateStatus();
      });

      socketRef.current.on("opponentLeft", (data) => {
        const playerColor = gameParamsRef.current?.color?.toLowerCase();
        if (data.winnerColor === playerColor && !gameOver) {
          setOpponentLeft(true);
          setGameOver(true);
          updateStatus();
          socketRef.current.disconnect(); // Disconnect after opponent left
          // router.push(`/win`);
          setWinner(playerColor);
        }
      });

      socketRef.current.on("reconnect", () => {
        setIsReconnecting(true);
        setStatus("Reconnecting to game...");
        const code = gameParamsRef.current?.code;
        const color = gameParamsRef.current?.color;
        if (code && color)
          socketRef.current.emit("joinGame", {
            code,
            color: color.toLowerCase(),
          });
      });

      socketRef.current.on("rematchRequest", () => {
        if (!rematchRequested && !gameOver) {
          setShowRematchRequest(true);
          setStatus("Opponent requests a rematch");
        }
      });

      socketRef.current.on("error", (error) => {
        console.error("Socket error:", error);
        if (error.message === "Color already taken") {
          setStatus(
            "This color is already taken in this game. Please try a different game or color."
          );
        } else {
          setStatus(`Connection error: ${error.message}`);
        }
      });

      socketRef.current.on("disconnect", (reason) => {
        // console.log("Socket disconnected:", reason);
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
      // console.log("⚠️ CLEANUP: useEffect cleanup triggered - this could indicate unexpected re-initialization");
      setIsInitializing(false);
      if (socketRef.current) {
        // Notify server that we're leaving the game
        const code = gameParamsRef.current?.code;
        const colorParam = gameParamsRef.current?.color;
        if (code && colorParam) {
          // console.log("Sending leaveGame event:", { code, color: colorParam.toLowerCase() });
          socketRef.current.emit("leaveGame", {
            code,
            color: colorParam.toLowerCase(),
          });
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
          socketRef.current.emit("leaveGame", {
            code,
            color: colorParam.toLowerCase(),
          });
        }
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // console.log("⚠️ COMPONENT UNMOUNT: Final cleanup - this should only happen when leaving the game page");
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (socketRef.current) {
        const code = gameParamsRef.current?.code;
        const colorParam = gameParamsRef.current?.color;
        if (code && colorParam) {
          // console.log("Final leaveGame event:", { code, color: colorParam.toLowerCase() });
          socketRef.current.emit("leaveGame", {
            code,
            color: colorParam.toLowerCase(),
          });
        }
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (
        boardInstanceRef.current &&
        typeof boardInstanceRef.current.destroy === "function"
      ) {
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
      gameOverCheck: gameRef.current?.game_over(),
    });

    if (!gameRef.current || gameRef.current.game_over()) {
      console.log("❌ BLOCKED: Game not available or game over");
      return false;
    }

    if (gameOver) {
      console.log("❌ BLOCKED: Game state shows game over");
      return false;
    }

    // Allow movement even if gameHasStarted is false, but game exists
    // The game might not be marked as started but moves can still be made

    // Check if it's the player's turn and they're moving their own pieces
    if (playerColor === "white") {
      const canMove = currentTurn === "w" && isWhitePiece;
      console.log("🔍 WHITE PLAYER CHECK:", {
        currentTurn,
        isWhitePiece,
        canMove,
      });
      return canMove;
    } else {
      const canMove = currentTurn === "b" && isBlackPiece;
      console.log("🔍 BLACK PLAYER CHECK:", {
        currentTurn,
        isBlackPiece,
        canMove,
      });
      return canMove;
    }
  };
  const onDrop = (source, target) => {
    console.log(
      "📤 DROP ATTEMPT:",
      source,
      "->",
      target,
      "gameOver:",
      gameOver,
      "isReconnecting:",
      isReconnecting
    );

    if (!gameRef.current || gameOver || isReconnecting) return;

    const theMove = { from: source, to: target, promotion: "q" };
    const move = gameRef.current.move(theMove);

    if (move === null) {
      console.log("❌ INVALID MOVE, returning snapback");
      return "snapback";
    }

    console.log("✅ VALID MOVE executed:", move);
    console.log("📤 Sending move to server:", {
      ...theMove,
      captured: move.captured || null,
    });

    if (socketRef.current) {
      socketRef.current.emit("move", {
        ...theMove,
        captured: move.captured || null,
      });
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
      // console.log("Game just started, skipping end game checks");
      updateStatus();
      return;
    }

    if (gameRef.current.in_checkmate()) {
      // console.log("Checkmate detected!");
      setGameOver(true);
      const currentTurn = gameRef.current.turn();
      const playerTurn = playerColor === "white" ? "w" : "b";

      // console.log("Current turn:", currentTurn, "Player turn:", playerTurn);

      if (currentTurn !== playerTurn) {
        // console.log("Player wins! Redirecting to /win");
        // setTimeout(() => router.push(`/win`), 1000); // Add delay
        setWinner(playerColor);
      } else {
        // console.log("Player loses! Redirecting to /lost");
        // setTimeout(() => router.push("/lost"), 1000); // Add delay
        setWinner(playerColor === "white" ? "black" : "white");
      }
    } else if (gameRef.current.in_draw()) {
      // console.log("Draw detected!");
      setGameOver(true);
      setStatus("Game over, drawn position");
    }

    // Manage king highlight for check
    if (boardRef.current) {
      // Remove existing blink class from all squares
      const squares = boardRef.current.querySelectorAll(".blink-king");
      squares.forEach((square) => square.classList.remove("blink-king"));

      // Highlight king if in check
      if (gameRef.current.in_check() && boardInstanceRef.current) {
        const board = gameRef.current.board();
        let kingSquare = null;
        const color = gameRef.current.turn(); // 'w' or 'b'

        // Iterate through the 8x8 board to find the king's square
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && piece.type === "k" && piece.color === color) {
              // Convert board indices to square notation (e.g., [0,4] -> 'e8')
              const file = String.fromCharCode(97 + j); // a-h
              const rank = 8 - i; // 8-1
              kingSquare = `${file}${rank}`;
              break;
            }
          }
          if (kingSquare) break;
        }

        if (kingSquare) {
          const squareElement = boardRef.current.querySelector(
            `[data-square="${kingSquare}"]`
          );
          if (squareElement) {
            squareElement.classList.add("blink-king");
          }
        }
      }
    }

    updateStatus();
  };

  const updateStatus = () => {
    if (!gameRef.current) {
      setStatus("Game initialization failed");
      return;
    }

    let newStatus = "";
    const currentTurn = gameRef.current.turn();
    const moveColor = currentTurn === "w" ? "white" : "black";
    const isPlayerTurn = currentTurn === (playerColor === "white" ? "w" : "b");

    if (gameOver) {
      if (opponentLeft) {
        newStatus = "Opponent left, you win!";
      } else if (gameRef.current.in_checkmate()) {
        const winner = currentTurn === "w" ? "Black" : "White";
        newStatus = `Game over, ${winner} wins by checkmate!`;
      } else if (gameRef.current.in_draw()) {
        newStatus = "Game over, drawn position";
      } else if (gameRef.current.in_stalemate()) {
        newStatus = "Game over, stalemate";
      } else {
        newStatus = "Game over";
      }
    } else if (!gameHasStarted) {
      // Check if game has moves (which means it should have started)
      const moveCount = gameRef.current.history().length;
      if (moveCount > 0) {
        // Game has started based on moves, update the state
        setGameHasStarted(true);
        // Continue to show the game status below
        if (isPlayerTurn) {
          newStatus = `Your turn to move`;
        } else {
          newStatus = `Waiting for ${moveColor} player to move`;
        }

        // Add check status
        if (gameRef.current.in_check()) {
          if (isPlayerTurn) {
            newStatus += " - You are in check!";
          } else {
            newStatus += ` - ${moveColor} player is in check`;
          }
        }
      } else {
        // Game hasn't actually started yet
        const waitingFor =
          playerColor === "white" ? "your move" : "white's move";
        newStatus = `Waiting for ${waitingFor} to start the game...`;
      }
    } else if (isReconnecting) {
      newStatus = "Reconnecting to game...";
    } else {
      // Game is active - show specific player waiting messages
      if (isPlayerTurn) {
        newStatus = `Your turn to move`;
      } else {
        newStatus = `Waiting for ${moveColor} player to move`;
      }

      // Add check status
      if (gameRef.current.in_check()) {
        if (isPlayerTurn) {
          newStatus += " - You are in check!";
        } else {
          newStatus += ` - ${moveColor} player is in check`;
        }
      }
    }

    setStatus(newStatus);
    setPgn(gameRef.current.pgn());
  };

  const requestRematch = () => {
    if (socketRef.current && !rematchRequested && gameOver) {
      socketRef.current.emit("rematchRequest");
      setRematchRequested(true);
      setStatus("Rematch requested, waiting for opponent's response...");
    }
  };

  const acceptRematch = () => {
    if (socketRef.current && showRematchRequest) {
      socketRef.current.emit("acceptRematch");
      setShowRematchRequest(false);
      setRematchRequested(false);
      setGameHasStarted(false);
      setGameOver(false);
      setWinner(null);
      setCapturedPieces([]);
      setOpponentLeft(false);
      setWhiteTime(1800);
      setBlackTime(1800);
      setStatus("Preparing for rematch...");

      setRematchStarted(true); // Track that rematch has started
      updateStatus();
    }
  };

  const ignoreRematch = () => {
    // console.log("User ignored rematch, redirecting to home");
    setShowRematchRequest(false);
    router.push("/");
  };

  const claimBet = () => {
    // console.log("Bet claimed:", betAmount, "redirecting to home");
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Script
        src="https://code.jquery.com/jquery-3.7.0.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptsLoaded((prev) => ({ ...prev, jquery: true }));
        }}
        onReady={() => {
          if (window.jQuery && !scriptsLoaded.jquery) {
            setScriptsLoaded((prev) => ({ ...prev, jquery: true }));
          }
        }}
        onError={(e) => {
          console.error("jQuery CDN failed to load:", e);
          const script = document.createElement("script");
          script.src = "/js/jquery-3.7.0.min.js";
          script.onload = () => {
            setScriptsLoaded((prev) => ({ ...prev, jquery: true }));
          };
          script.onerror = () => {
            setScriptsLoaded((prev) => ({ ...prev, jquery: false }));
          };
          document.head.appendChild(script);
        }}
      />

      <Script
        src="/js/chess-0.10.3.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptsLoaded((prev) => ({ ...prev, chess: true }));
        }}
        onReady={() => {
          if (window.Chess && !scriptsLoaded.chess) {
            setScriptsLoaded((prev) => ({ ...prev, chess: true }));
          }
        }}
        onError={(e) => {
          console.error("Chess.js failed to load:", e);
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js";
          script.onload = () => {
            setScriptsLoaded((prev) => ({ ...prev, chess: true }));
          };
          document.head.appendChild(script);
        }}
      />

      <Script
        src="/js/chessboard-1.0.0.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptsLoaded((prev) => ({ ...prev, chessboard: true }));
        }}
        onReady={() => {
          if (window.Chessboard && !scriptsLoaded.chessboard) {
            setScriptsLoaded((prev) => ({ ...prev, chessboard: true }));
          }
        }}
        onError={(e) => {
          console.error("Chessboard.js failed to load:", e);
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/chessboard.min.js";
          script.onload = () => {
            setScriptsLoaded((prev) => ({ ...prev, chessboard: true }));
          };
          document.head.appendChild(script);
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
            radial-gradient(circle at 25% 25%, #ffd700 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, #ff6b6b 2px, transparent 2px),
            linear-gradient(45deg, transparent 40%, rgba(255, 215, 0, 0.1) 50%, transparent 60%)
          `,
            backgroundSize: "50px 50px, 50px 50px, 100px 100px",
          }}
        />
        <header className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-xl sm:text-2xl">♚</span>
              </div>
              <h1 className="uppercase text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                Royal Chess Arena
              </h1>
            </div>
            <h1
              className={` ${
                playerColor === "black"
                  ? "bg-white text-black"
                  : " bg-black text-white"
              } rounded-xl uppercase text-sm sm:text-xl md:text-2xl lg:text-3xl px-3 py-1 sm:px-4 sm:py-1 font-bold`}
            >
              {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}{" "}
              Player
            </h1>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="cover-container items-center justify-center flex flex-col lg:flex-row p-2 sm:p-3 mx-auto min-h-[85vh] lg:h-[90dvh] relative">
            {/* Prize Display */}
            <div className="w-full text-center mb-10 md:mb-4 lg:absolute lg:top-4 lg:left-1/2 lg:transform lg:-translate-x-1/2 text-yellow-400 font-bold text-lg sm:text-2xl lg:text-4xl flex items-center justify-center flex-wrap gap-2">
              <img
                width="53"
                height="53"
                src="https://img.icons8.com/external-vectorslab-flat-vectorslab/53/external-Dollar-Coins-casino-vectorslab-flat-vectorslab.png"
                alt="external-Dollar-Coins-casino-vectorslab-flat-vectorslab"
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 inline-block"
              />
              <span className="text-white text-sm sm:text-base lg:text-xl">
                {" "}
                Winner Will Receive :{" "}
              </span>
              <span className="inline-block text-lg sm:text-2xl lg:text-4xl">
                {" "}
                {betAmount * 2} Coins
              </span>
            </div>

            {/* Desktop layout - keep what already works */}
            <div className=" hidden md:block w-full md:w-[30%] order-3 lg:order-1">
              <div className="w-full md:min-h-[38vh] px-3 sm:px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white overflow-auto">
                <h5 className="mb-3 font-bold text-sm sm:text-base">
                  Move History:
                </h5>
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
                  <p className="text-gray-400 italic text-sm">No moves yet</p>
                )}
              </div>
            </div>

            {/* Chess Board - Center */}
            <main className="w-[95%] p-0 md:p-8 order-2 lg:order-2">
              <div className="max-h-[45vh] mx-auto aspect-square">
                <div
                  id="myBoard"
                  ref={boardRef}
                  style={{ width: "100%", margin: "auto" }}
                ></div>
              </div>

              {/* Player timer - visible on both mobile and desktop */}
              <div className=" md:hidden flex justify-center mt-3">
                <div className="text-lg sm:text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-xl text-white w-fit px-2 sm:px-3">
                  {playerColor === "white"
                    ? formatTime(whiteTime)
                    : formatTime(blackTime)}
                </div>
              </div>

              {capturedPieces.length > 0 && (
                <div className="mt-2 sm:mt-4 flex gap-2 flex-wrap justify-center">
                  {capturedPieces.map((piece, index) => (
                    <img
                      key={index}
                      src={`/img/chesspieces/wikipedia/${playerColor.charAt(
                        0
                      )}${piece.toUpperCase()}.png`}
                      alt={`Captured ${piece}`}
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                    />
                  ))}
                </div>
              )}
            </main>

            {/* Desktop - Right Sidebar */}
            <div className=" w-full lg:w-[25%] mb-3 md:mb-0 md:min-h-[45vh] order-1 lg:order-3">
              <div className="hidden md:block">
                <div className="text-lg sm:text-2xl md:text-3xl font-bold bg-white/10 border border-white/20 rounded-xl text-white w-fit px-2 sm:px-3">
                  {playerColor === "white"
                    ? formatTime(whiteTime)
                    : formatTime(blackTime)}
                </div>
              </div>
              <div className="w-full px-3 sm:px-4 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl md:min-h-[350px] text-white">
                <div className="flex items-center md:border-b border-white/20 md:pb-3 justify-start space-x-3">
                  <div className="h-3 rounded-full bg-green-100 aspect-square"></div>
                  <h3 className="text-sm sm:text-base">{status}</h3>
                </div>
                <div className="mt-3 hidden lg:block">
                  <h3
                    id="status"
                    className="w-full min-h-[4vh] py-3 text-white flex justify-start items-center"
                  >
                    <img
                      width="25"
                      height="25"
                      src="https://img.icons8.com/flat-round/50/info.png"
                      alt="info"
                      className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 inline-block"
                    />
                    <span className="inline-block pl-2 sm:pl-3 text-sm sm:text-lg lg:text-xl uppercase">
                      Status
                    </span>
                  </h3>
                  {/* Debug info */}
                  <div className="mt-2 text-sm sm:text-base lg:text-lg text-gray-400 space-y-1">
                    <div>Scripts Ready: {scriptsReady ? "✓" : "✗"}</div>
                    <div>Game Started: {gameHasStarted ? "✓" : "✗"}</div>
                    <div>Game Over: {gameOver ? "✓" : "✗"}</div>
                    <div>
                      Player Color:{" "}
                      <span className="text-yellow-300 uppercase">
                        {playerColor}
                      </span>
                    </div>
                    <div>
                      Current Turn:{" "}
                      <span className="text-yellow-300">
                        {gameRef.current?.turn() === "w"
                          ? "White"
                          : gameRef.current?.turn() === "b"
                          ? "Black"
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      Can I Move?:{" "}
                      <span className="text-yellow-300">
                        {gameRef.current?.turn() ===
                        (playerColor === "white" ? "w" : "b")
                          ? "✓ YES"
                          : "✗ NO"}
                      </span>
                    </div>
                    <div>
                      Move Count: {gameRef.current?.history()?.length || 0}
                    </div>
                    <div>Initializing: {isInitializing ? "✓" : "✗"}</div>
                    <div>Reconnecting: {isReconnecting ? "✓" : "✗"}</div>
                  </div>
                </div>
                {/* {gameOver && (
                  <button
                    onClick={requestRematch}
                    className="mt-4 w-full px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm sm:text-base transition-colors"
                    disabled={rematchRequested}
                  >
                    Request Rematch
                  </button>
                )} */}
              </div>
            </div>
          </div>

          {/* Mobile Only - Floating Action Button that opens modal */}
          <div className="fixed bottom-4 right-4 lg:hidden z-40">
            <button
              onClick={() => setMobilePanelOpen((prev) => !prev)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Only - Game Info Modal */}
          <div
            className={`fixed inset-0 bg-black/80 z-50 transition-all duration-300 lg:hidden ${
              mobilePanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-slate-900 to-purple-900 rounded-t-2xl max-h-[80vh] overflow-auto">
              <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-purple-900 p-4 flex justify-between items-center border-b border-white/10">
                <h2 className="text-xl font-bold">Game Details</h2>
                <button
                  onClick={() => setMobilePanelOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                {/* <div className="flex border-b border-white/20 mb-4">
                  <button
                    onClick={() => setMobileActiveTab("moves")}
                    className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                      mobileActiveTab === "moves"
                        ? "border-b-2 border-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    Move History
                  </button>
                  <button
                    onClick={() => setMobileActiveTab("status")}
                    className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                      mobileActiveTab === "status"
                        ? "border-b-2 border-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    Game Status
                  </button>
                </div> */}

                {/* Tab Content */}
                {mobileActiveTab === "moves" ? (
                  <div className="w-full">
                    {/* <h5 className="mb-2 font-bold text-sm">Move History:</h5> */}
                    {pgn ? (
                      <div className="overflow-auto max-h-[40vh]">
                        <table className="w-full text-xs sm:text-sm">
                          <thead className="sticky top-0 bg-slate-900/95">
                            <tr>
                              <th className="p-1 sm:p-2 text-left border-b border-white/20">
                                #
                              </th>
                              <th className="p-1 sm:p-2 text-left border-b border-white/20">
                                White
                              </th>
                              <th className="p-1 sm:p-2 text-left border-b border-white/20">
                                Black
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const moves = pgn
                                .split(/\d+\./)
                                .filter((move) => move.trim());
                              return moves.map((moveSet, index) => {
                                const [whiteMove, blackMove] = moveSet
                                  .trim()
                                  .split(/\s+/);
                                return (
                                  <tr
                                    key={index + 1}
                                    className="hover:bg-white/5"
                                  >
                                    <td className="p-1 sm:p-2 border-b border-white/10 font-mono text-gray-400">
                                      {index + 1}
                                    </td>
                                    <td className="p-1 sm:p-2 border-b border-white/10 font-mono">
                                      {whiteMove || "-"}
                                    </td>
                                    <td className="p-1 sm:p-2 border-b border-white/10 font-mono">
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
                      <p className="text-gray-400 italic text-sm">
                        No moves yet
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center mb-3 pb-2 border-b border-white/20">
                      <div className="h-3 rounded-full bg-green-100 aspect-square mr-2"></div>
                      <h3 className="text-sm">{status}</h3>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-400">
                      <div>Scripts Ready: {scriptsReady ? "✓" : "✗"}</div>
                      <div>Game Started: {gameHasStarted ? "✓" : "✗"}</div>
                      <div>Game Over: {gameOver ? "✓" : "✗"}</div>
                      <div>
                        Player Color:{" "}
                        <span className="text-yellow-300 uppercase">
                          {playerColor}
                        </span>
                      </div>
                      <div>
                        Current Turn:{" "}
                        <span className="text-yellow-300">
                          {gameRef.current?.turn() === "w"
                            ? "White"
                            : gameRef.current?.turn() === "b"
                            ? "Black"
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        Can I Move?:{" "}
                        <span className="text-yellow-300">
                          {gameRef.current?.turn() ===
                          (playerColor === "white" ? "w" : "b")
                            ? "✓ YES"
                            : "✗ NO"}
                        </span>
                      </div>
                      <div>
                        Move Count: {gameRef.current?.history()?.length || 0}
                      </div>
                      <div>Initializing: {isInitializing ? "✓" : "✗"}</div>
                      <div>Reconnecting: {isReconnecting ? "✓" : "✗"}</div>
                    </div>

                    {gameOver && (
                      <button
                        onClick={requestRematch}
                        className="mt-4 w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                        disabled={rematchRequested}
                      >
                        Request Rematch
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="p-4 sm:p-6 text-center mt-8 absolute bottom-0 left-0 right-0">
          <p className="text-gray-400 text-xs sm:text-sm">
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

      {/* Rematch Request Modal - Responsive */}
      {showRematchRequest && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:w-[25%] bg-black rounded-lg mx-4 lg:absolute lg:top-4 lg:right-4 lg:mx-0">
            <div className="w-full py-4 sm:py-6 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-yellow-900/20 to-red-900/20 rounded-lg backdrop-blur-md border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 blur-sm rounded-lg opacity-75 animate-pulse" />
              <div className="absolute inset-[2px] bg-gradient-to-b from-slate-900 to-black rounded-lg" />
              <div className="relative z-20 w-full">
                <h2 className="z-30 text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
                  Rematch Request
                </h2>
                <p className="mb-3 text-sm sm:text-base">
                  Opponent wants a rematch. Accept?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={acceptRematch}
                    className="flex-1 min-w-[100px] px-6 sm:px-10 h-12 sm:h-14 text-sm sm:text-lg rounded-lg font-black bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border-2 border-green-400 shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={ignoreRematch}
                    className="flex-1 min-w-[100px] px-6 sm:px-10 h-12 sm:h-14 text-sm sm:text-lg rounded-lg font-black bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-2 border-red-400 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <Winner
          winner={winner}
          betAmount={betAmount * 2}
          playerColor={playerColor}
          requestRematch={requestRematch}
          showRematchRequest={showRematchRequest}
          acceptRematch={acceptRematch}
          ignoreRematch={ignoreRematch}
        />
      )}
    </>
  );
}
