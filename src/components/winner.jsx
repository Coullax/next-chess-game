"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Home, Move, RotateCcw, Trophy } from "lucide-react";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Winner({
  winner,
  betAmount,
  playerColor,
  requestRematch,
  showRematchRequest,
  acceptRematch,
  ignoreRematch,
}) {
  // const [winner, setWinner] = useState("white");
  const [wCapturedPieces, setWCapturedPieces] = useState(["p", "n", "b", "r"]);
  const [bCapturedPieces, setBCapturedPieces] = useState([
    "p",
    "p",
    "n",
    "b",
    "r",
  ]);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCoinCollection, setShowCoinCollection] = useState(false);
  const coinsSourceRef = useRef(null);
  const winnerPlayerRef = useRef(null);

  // Start animation automatically when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setShowCoinCollection(true);
    }, 1500); // Start animation after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const fakeTokens = sessionStorage.getItem("fakeTokens");
      let currentTokens = 0;
      
      // Get current tokens or initialize with default amount
      if (fakeTokens) {
        currentTokens = JSON.parse(fakeTokens);
      } else {
        // Initialize with default amount if no tokens exist
        currentTokens = 1000; // Default starting amount
      }
      
      let newTokens = currentTokens;
      
      // Check if current player won or lost
      const didWin = 
        (playerColor === "white" && winner === "white") ||
        (playerColor === "black" && winner === "black");
      
      if (didWin) {
        // Winner gets the full bet amount added to their tokens
        newTokens = currentTokens + betAmount;
      } else {
        // Loser loses the full bet amount from their tokens
        newTokens = Math.max(0, currentTokens - betAmount); // Ensure tokens don't go below 0
      }
      
      sessionStorage.setItem("fakeTokens", JSON.stringify(newTokens));
    } catch (error) {
      console.error("Error updating tokens:", error);
      // Fallback: set default tokens if there's an error
      sessionStorage.setItem("fakeTokens", JSON.stringify(1000));
    }
  }, [playerColor, winner, betAmount]); // Added proper dependencies

  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-black relative overflow-hidden flex items-center justify-center p-4">
    <div className=" fixed top-0 left-0 w-full h-dvh bg-gradient-to-br text-white from-slate-900 via-purple-900 to-slate-900 overflow-hidden flex items-center justify-center p-4 z-30">
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

      <Card className="w-full max-w-7xl py-14 px-5 mx-auto relative z-10 !bg-gradient-to-b !from-yellow-900/20 !to-red-900/20 !backdrop-blur-md border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 rounded-lg blur-sm opacity-75 animate-pulse" />
        <div className="absolute inset-[2px] bg-gradient-to-b from-slate-900 to-black rounded-lg" />
        <div className=" z-10">
          <h1 className="text-6xl  font-bold pb-12 text-center text-white">
            {(playerColor === "white" && winner === "white") ||
            (playerColor === "black" && winner === "black")
              ? "YOU WIN!"
              : "YOU LOSE!"}
          </h1>
        </div>

        <div className=" w-full grid grid-cols-3 z-10">
          <div className=" w-full">
            {playerColor === "white" ? (
              // White player on left when playerColor is 'white'
              <div className=" flex flex-col justify-center items-center space-y-4 w-full">
                <div className=" min-h-[45px] mb-5">
                  {winner === "white" && (
                    <div className=" bg-green-500 py-1 px-6 rounded-md text-white text-2xl font-bold w-fit uppercase ">
                      Winner!
                    </div>
                  )}
                </div>
                <Image
                  src="/whitePlayer.jpg"
                  alt="Winner"
                  width={100}
                  height={100}
                  className=" border-4 border-yellow-600 rounded-lg"
                />
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  ref={winner === "white" ? winnerPlayerRef : null}
                  animate={
                    showCoinCollection && winner === "white"
                      ? {
                          scale: [1, 1.1, 1],
                          textShadow: [
                            "0 0 0px #facc15",
                            "0 0 20px #facc15",
                            "0 0 10px #facc15",
                            "0 0 0px #facc15",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    delay: 2,
                    ease: "easeOut",
                  }}
                >
                  <span className="text-white text-xl font-semibold">You</span>
                  {/* <span className="text-yellow-400 text-xl font-bold">
                    Player
                  </span> */}
                </motion.div>
              </div>
            ) : (
              // Black player on left when playerColor is 'black'
              <div className=" flex flex-col justify-center items-center space-y-4 w-full">
                <div className=" min-h-[45px] mb-5">
                  {winner === "black" && (
                    <div className=" bg-green-500 py-1 px-6 rounded-md text-white text-2xl font-bold w-fit uppercase ">
                      Winner!
                    </div>
                  )}
                </div>
                <Image
                  src="/blackPlayer.png"
                  alt="Winner"
                  width={100}
                  height={100}
                  className=" border-4 border-yellow-600 rounded-lg"
                />
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  ref={winner === "black" ? winnerPlayerRef : null}
                  animate={
                    showCoinCollection && winner === "black"
                      ? {
                          scale: [1, 1.1, 1],
                          textShadow: [
                            "0 0 0px #facc15",
                            "0 0 20px #facc15",
                            "0 0 10px #facc15",
                            "0 0 0px #facc15",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    delay: 2,
                    ease: "easeOut",
                  }}
                >
                  <span className="text-white text-xl font-semibold">You</span>
                  {/* <span className="text-yellow-400 text-xl font-bold">
                    Player
                  </span> */}
                </motion.div>
              </div>
            )}
            {/* <div className=" w-[80%] mx-auto mt-5">
              <div className=" bg-gray-800 px-4 py-1 rounded-md">
                <div className="text-white text-sm font-bold flex justify-start items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-white">CapturedPieces</span>
                </div>
                <div className="flex justify-center items-center space-x-2 mt-2">
                  {wCapturedPieces.map((piece, index) => (
                    <Image
                      key={index}
                      src={`/img/chesspieces/wikipedia/b${piece}.png`}
                      alt={piece}
                      width={30}
                      height={30}
                    />
                  ))}
                </div>
              </div>
              <div className=" grid grid-cols-2 gap-4 mt-4">
                <div className=" bg-gray-800 px-4 py-1 rounded-md">
                  <div className=" text-white text-sm font-bold flex justify-start items-center space-x-2">
                    <Move className="w-4 h-4" />
                    <span className="text-white">Moves</span>
                  </div>
                  <div className=" text-2xl font-black text-white text-center ">
                    0
                  </div>
                </div>
                <div className=" bg-gray-800 px-4 py-1 rounded-md">
                  <div className=" text-white text-sm font-bold flex justify-start items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-white">Time</span>
                  </div>
                  <div className=" text-2xl font-black text-white text-center ">
                    0:00
                  </div>
                </div>
              </div>
            </div> */}
          </div>
          <div className="flex flex-col items-center justify-center space-y-4">
            <Image src="/win.png" alt="Winner" width={200} height={200} />
            <div
              className=" flex justify-center items-center space-x-2 relative"
              ref={coinsSourceRef}
            >
              <Image src="/coins.png" alt="Winner" width={100} height={90} />
              <motion.h1
                className="text-yellow-400 font-bold text-4xl"
                animate={
                  isAnimating
                    ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1],
                        x: [0, -3, 3, -3, 3, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 0.6,
                  repeat: isAnimating ? 3 : 0,
                  x: {
                    duration: 0.1,
                    repeat: isAnimating ? 30 : 0,
                    repeatType: "reverse",
                  },
                }}
              >
                {betAmount} Coins
              </motion.h1>

              {/* Coin Collection Animation */}
              <AnimatePresence>
                {showCoinCollection && (
                  <>
                    {/* Multiple coins flying from 100 Coins to Winner Player */}
                    {[...Array(25)].map((_, i) => {
                      const sourceRect =
                        coinsSourceRef.current?.getBoundingClientRect();
                      const targetRect =
                        winnerPlayerRef.current?.getBoundingClientRect();

                      const sourceX = sourceRect
                        ? sourceRect.left +
                          sourceRect.width / 2 -
                          window.innerWidth / 2
                        : 0;
                      const sourceY = sourceRect
                        ? sourceRect.top +
                          sourceRect.height / 2 -
                          window.innerHeight / 2
                        : 0;

                      const targetX = targetRect
                        ? targetRect.left +
                          targetRect.width / 2 -
                          window.innerWidth / 2 +
                          (Math.random() * 40 - 20)
                        : winner === "white"
                        ? -window.innerWidth / 4
                        : window.innerWidth / 4;
                      const targetY = targetRect
                        ? targetRect.top +
                          targetRect.height / 2 -
                          window.innerHeight / 2 +
                          (Math.random() * 20 - 10)
                        : -window.innerHeight / 4;

                      return (
                        <motion.div
                          key={`flying-coin-${i}`}
                          className="fixed text-yellow-400 text-3xl font-bold pointer-events-none z-50"
                          style={{
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                          initial={{
                            x: sourceX + (Math.random() * 60 - 30),
                            y: sourceY + (Math.random() * 40 - 20),
                            scale: 0.8,
                            opacity: 1,
                            rotate: 0,
                          }}
                          animate={{
                            x: targetX,
                            y: targetY,
                            scale: [0.8, 1.2, 0.4],
                            opacity: [1, 1, 0],
                            rotate: [0, 180, 360],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 1.5 + Math.random() * 0.5,
                            delay: i * 0.04,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            scale: {
                              times: [0, 0.3, 1],
                              ease: "easeOut",
                            },
                          }}
                        >
                          <Image
                            src="/coin.png"
                            alt="Coin"
                            width={80}
                            height={80}
                          />
                        </motion.div>
                      );
                    })}

                    {/* Burst effect at source */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`burst-coin-${i}`}
                        className="fixed text-yellow-400 text-2xl pointer-events-none z-50"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                        initial={{
                          x: coinsSourceRef.current
                            ? coinsSourceRef.current.getBoundingClientRect()
                                .left +
                              coinsSourceRef.current.getBoundingClientRect()
                                .width /
                                2 -
                              window.innerWidth / 2
                            : 0,
                          y: coinsSourceRef.current
                            ? coinsSourceRef.current.getBoundingClientRect()
                                .top +
                              coinsSourceRef.current.getBoundingClientRect()
                                .height /
                                2 -
                              window.innerHeight / 2
                            : 0,
                          scale: 0,
                          opacity: 1,
                          rotate: 0,
                        }}
                        animate={{
                          x: coinsSourceRef.current
                            ? coinsSourceRef.current.getBoundingClientRect()
                                .left +
                              coinsSourceRef.current.getBoundingClientRect()
                                .width /
                                2 -
                              window.innerWidth / 2 +
                              Math.cos((i / 6) * Math.PI * 2) * 80
                            : Math.cos((i / 6) * Math.PI * 2) * 80,
                          y: coinsSourceRef.current
                            ? coinsSourceRef.current.getBoundingClientRect()
                                .top +
                              coinsSourceRef.current.getBoundingClientRect()
                                .height /
                                2 -
                              window.innerHeight / 2 +
                              Math.sin((i / 6) * Math.PI * 2) * 60
                            : Math.sin((i / 6) * Math.PI * 2) * 60,
                          scale: [0, 1, 0],
                          opacity: [1, 0.8, 0],
                          rotate: 360,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2,
                          ease: "easeOut",
                        }}
                      >
                        ✨
                      </motion.div>
                    ))}

                    {/* Sparkle effect at target */}
                    <motion.div
                      className="fixed text-yellow-400 text-3xl pointer-events-none z-50"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                      initial={{
                        x: winnerPlayerRef.current
                          ? winnerPlayerRef.current.getBoundingClientRect()
                              .left +
                            winnerPlayerRef.current.getBoundingClientRect()
                              .width /
                              2 -
                            window.innerWidth / 2
                          : 0,
                        y: winnerPlayerRef.current
                          ? winnerPlayerRef.current.getBoundingClientRect()
                              .top +
                            winnerPlayerRef.current.getBoundingClientRect()
                              .height /
                              2 -
                            window.innerHeight / 2
                          : 0,
                        scale: 0,
                        opacity: 0,
                      }}
                      animate={{
                        scale: [0, 2, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 1,
                        delay: 2,
                        ease: "easeOut",
                      }}
                    >
                      ⭐
                    </motion.div>

                    {/* +100 text animation to winner */}
                    <motion.div
                      className="fixed text-yellow-400 text-3xl font-bold pointer-events-none z-50"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                      initial={{
                        x: coinsSourceRef.current
                          ? coinsSourceRef.current.getBoundingClientRect()
                              .left +
                            coinsSourceRef.current.getBoundingClientRect()
                              .width /
                              2 -
                            window.innerWidth / 2
                          : 0,
                        y: coinsSourceRef.current
                          ? coinsSourceRef.current.getBoundingClientRect().top +
                            coinsSourceRef.current.getBoundingClientRect()
                              .height /
                              2 -
                            window.innerHeight / 2 -
                            30
                          : -30,
                        scale: 1,
                        opacity: 1,
                      }}
                      animate={{
                        x: winnerPlayerRef.current
                          ? winnerPlayerRef.current.getBoundingClientRect()
                              .left +
                            winnerPlayerRef.current.getBoundingClientRect()
                              .width /
                              2 -
                            window.innerWidth / 2
                          : winner === "white"
                          ? -window.innerWidth / 4
                          : window.innerWidth / 4,
                        y: winnerPlayerRef.current
                          ? winnerPlayerRef.current.getBoundingClientRect()
                              .top +
                            winnerPlayerRef.current.getBoundingClientRect()
                              .height /
                              2 -
                            window.innerHeight / 2 -
                            40
                          : -window.innerHeight / 4,
                        scale: [1, 1.3, 0.8],
                        opacity: [1, 1, 0],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 2.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        scale: {
                          times: [0, 0.3, 1],
                          ease: "easeOut",
                        },
                      }}
                      onAnimationComplete={() => {
                        setShowCoinCollection(false);
                      }}
                    >
                      +{betAmount}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className=" w-full">
            {playerColor === "white" ? (
              // Black player on right when playerColor is 'white'
              <div className=" flex flex-col justify-center items-center space-y-4 w-full">
                <div className=" min-h-[45px] mb-5">
                  {winner === "black" && (
                    <div className=" bg-green-500 py-1 px-6 rounded-md text-white text-2xl font-bold w-fit uppercase ">
                      Winner!
                    </div>
                  )}
                </div>
                <Image
                  src="/blackPlayer.png"
                  alt="Winner"
                  width={100}
                  height={100}
                  className=" border-4 border-yellow-600 rounded-lg"
                />
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  ref={winner === "black" ? winnerPlayerRef : null}
                  animate={
                    showCoinCollection && winner === "black"
                      ? {
                          scale: [1, 1.1, 1],
                          textShadow: [
                            "0 0 0px #facc15",
                            "0 0 20px #facc15",
                            "0 0 10px #facc15",
                            "0 0 0px #facc15",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    delay: 2,
                    ease: "easeOut",
                  }}
                >
                  <span className="text-white text-xl font-semibold">
                    Black
                  </span>
                  <span className="text-yellow-400 text-xl font-bold">
                    Player
                  </span>
                </motion.div>
              </div>
            ) : (
              // White player on right when playerColor is 'black'
              <div className=" flex flex-col justify-center items-center space-y-4 w-full">
                <div className=" min-h-[45px] mb-5">
                  {winner === "white" && (
                    <div className=" bg-green-500 py-1 px-6 rounded-md text-white text-2xl font-bold w-fit uppercase ">
                      Winner!
                    </div>
                  )}
                </div>
                <Image
                  src="/whitePlayer.jpg"
                  alt="Winner"
                  width={100}
                  height={100}
                  className=" border-4 border-yellow-600 rounded-lg"
                />
                <motion.div
                  className="flex justify-center items-center space-x-2"
                  ref={winner === "white" ? winnerPlayerRef : null}
                  animate={
                    showCoinCollection && winner === "white"
                      ? {
                          scale: [1, 1.1, 1],
                          textShadow: [
                            "0 0 0px #facc15",
                            "0 0 20px #facc15",
                            "0 0 10px #facc15",
                            "0 0 0px #facc15",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    delay: 2,
                    ease: "easeOut",
                  }}
                >
                  <span className="text-white text-xl font-semibold">
                    White
                  </span>
                  <span className="text-yellow-400 text-xl font-bold">
                    Player
                  </span>
                </motion.div>
              </div>
            )}
            {/* <div className=" w-[80%] mx-auto mt-5">
              <div className=" bg-gray-800 px-4 py-1 rounded-md">
                <div className="text-white text-sm font-bold flex justify-start items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-white">CapturedPieces</span>
                </div>
                <div className="flex justify-center items-center space-x-2 mt-2">
                  {bCapturedPieces.map((piece, index) => (
                    <Image
                      key={index}
                      src={`/img/chesspieces/wikipedia/w${piece}.png`}
                      alt={piece}
                      width={30}
                      height={30}
                    />
                  ))}
                </div>
              </div>
              <div className=" grid grid-cols-2 gap-4 mt-4">
                <div className=" bg-gray-800 px-4 py-1 rounded-md">
                  <div className=" text-white text-sm font-bold flex justify-start items-center space-x-2">
                    <Move className="w-4 h-4" />
                    <span className="text-white">Moves</span>
                  </div>
                  <div className=" text-2xl font-black text-white text-center ">
                    0
                  </div>
                </div>
                <div className=" bg-gray-800 px-4 py-1 rounded-md">
                  <div className=" text-white text-sm font-bold flex justify-start items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-white">Time</span>
                  </div>
                  <div className=" text-2xl font-black text-white text-center ">
                    0:00
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        <div className=" w-full flex justify-center items-center z-10 space-x-5 mt-5">
          {/* <Button
            onClick={() => window.location.href = '/'}
            className=" min-w-[300px] !px-10 h-14 text-lg font-black bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-2 border-red-400 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 cursor-pointer"
            size="lg"
          >
            <Home className="w-6 h-6 mr-2" />
            CAN'T PLAY AGAIN
          </Button> */}
          <Button
            onClick={() => (window.location.href = "/")}
            className=" min-w-[300px] !px-10 h-14 text-lg font-black bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border-2 border-green-400 shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105 cursor-pointer"
            size="lg"
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            PLAY AGAIN
          </Button>
        </div>
      </Card>
    </div>
  );
}
