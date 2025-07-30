import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

export default function WinPage() {
  const router = useRouter();
  const [player1Bool, setPlayer1Bool] = useState(false);
  const [fakeTokens, setFakeTokens] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showClaimedCoins, setShowClaimedCoins] = useState(false);
  const [winCoinsAmount, setWinCoinsAmount] = useState(100);
  const coinsRef = useRef(null);
  const coinCounterRef = useRef(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const betParam = searchParams.get("betAmount");
    if (betParam && !isNaN(betParam)) {
      setWinCoinsAmount(parseFloat(betParam));
    } else {
      setWinCoinsAmount("Invalid bet amount");
      return;
    }
  }, [router.query.betAmount]);

  useEffect(() => {
    if (router.query.player1Bool !== undefined) {
      setPlayer1Bool(router.query.player1Bool === "true");
    }
    // Check if winAmount is passed as query parameter
    if (router.query.winAmount !== undefined) {
      const amount = parseInt(router.query.winAmount, 10);
      if (!isNaN(amount) && amount > 0) {
        setWinCoinsAmount(amount);
      }
    }
  }, [router.query]);

  const claimWinningBet = async () => {
    try {
      // Start the animation
      setIsAnimating(true);
      setShowClaimedCoins(true);

      // Wait for animation to complete before updating tokens
      setTimeout(() => {
        setFakeTokens((prev) => prev + winCoinsAmount);
        sessionStorage.setItem(
          "fakeTokens",
          (fakeTokens + winCoinsAmount).toString()
        );
        setIsAnimating(false);
      }, 2000); // Animation duration

      if (typeof window === "undefined" || !window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const response = await fetch("/contract/abi.json");
      const ABI = await response.json();
      const Address = "0x6996b280785d92fd957B77D623E455ABdFfBF2D6";
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(Address, ABI, signer);

      const getGameId = await contract.numGames();
      let gameId = parseInt(getGameId) - 1;

      const win = await contract.closeGame(gameId, player1Bool, {
        gasLimit: 2000000,
      });
      console.log("Game win:", win);

      // Navigation will happen when animation completes
    } catch (error) {
      console.error("Error claiming winning bet:", error);
      setIsAnimating(false);
    }
  };

  useEffect(() => {
    const storedWallet = sessionStorage.getItem("selectedWallet");
    const storedTokens = sessionStorage.getItem("fakeTokens");
    if (storedWallet) {
      setSelectedWallet(JSON.parse(storedWallet));
      setFakeTokens(parseInt(storedTokens, 10));
    }
    // checkWalletConnection();
  }, []);

  return (
    <>
      <Head>
        <title>Congratulations! You Win!</title>
        <meta
          name="description"
          content="Congratulations on winning the chess game!"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/web3/4.5.0/web3.min.js"></script>
        <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
        <style jsx>{`
          @keyframes bgchange {
            from {
              background-color: var(--bg-clr-alt);
            }
            to {
              background-color: var(--bg-clr);
            }
          }

          @keyframes sungoup {
            from {
              right: -1rem;
              top: 35rem;
            }
            to {
              right: 10rem;
              top: 0;
            }
          }

          @keyframes goup {
            from {
              bottom: 0;
            }
            to {
              bottom: 100%;
            }
          }

          .celeb {
            z-index: -1;
            width: 300px;
            height: 300px;
            position: absolute;
            top: 20%;
            right: -38%;
            transform: translate(-50%, -50%) scale(0);
            animation-name: turi;
            animation-fill-mode: forwards;
            animation-duration: 1s;
            animation-delay: 4120ms;
          }

          @keyframes turi {
            from {
              transform: translate(-50%, -50%) scale(0);
            }
            to {
              transform: translate(-50%, -50%) scale(1);
            }
          }

          .f-day {
            z-index: -1;
            width: 300px;
            height: 300px;
            position: absolute;
          }

          .day-one {
            top: 20%;
            left: 7rem;
            transform: translate(-50%, -50%);
          }

          .day-two {
            top: 20%;
            left: 18rem;
            transform: translate(-50%, -50%);
          }

          .tuturi {
            width: 300px;
            height: 300px;
            position: absolute;
            top: 10%;
            left: 0;
          }

          .tuturi-2 {
            left: auto;
            right: 0;
          }

          @keyframes smiled {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }

          .ro {
            animation-name: flipc;
            animation-fill-mode: forwards;
            animation-duration: 1s;
            animation-delay: 16000ms;
            transform: rotateY(0);
          }

          @keyframes flipc {
            from {
              transform: rotateY(0);
            }
            to {
              transform: rotateY(360deg);
            }
          }

          .year {
            width: 230px;
          }

          .date-no:last-child {
            margin-right: 0;
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <header className="p-6">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">♚</span>
              </div>
              <h1 className="uppercase text-2xl md:text-3xl !font-bold !bg-gradient-to-r !from-yellow-400 !via-orange-500 !to-pink-500 !bg-clip-text !text-transparent">
                Royal Chess Arena
              </h1>
            </div>

            <div
              className="text-2xl text-yellow-400 md:text-3xl font-bold relative"
              ref={coinCounterRef}
            >
              🪙
              <motion.span
                className="ml-3"
                key={fakeTokens} // This will trigger animation when fakeTokens changes
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
              >
                {fakeTokens}
              </motion.span>
              {/* Animated coins that fly to the counter */}
              <AnimatePresence>
                {showClaimedCoins && (
                  <>
                    {/* Multiple coins flying from center to exact coin counter position */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`flying-coin-${i}`}
                        className="fixed text-yellow-400 text-4xl font-bold pointer-events-none z-50"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                        initial={{
                          x: 0,
                          y: 0,
                          scale: 1,
                          opacity: 1,
                          rotate: 0,
                        }}
                        animate={{
                          x: coinCounterRef.current
                            ? coinCounterRef.current.getBoundingClientRect()
                                .left +
                              coinCounterRef.current.getBoundingClientRect()
                                .width /
                                2 -
                              window.innerWidth / 2 +
                              (Math.random() * 40 - 20)
                            : window.innerWidth / 2 - 100,
                          y: coinCounterRef.current
                            ? coinCounterRef.current.getBoundingClientRect()
                                .top +
                              coinCounterRef.current.getBoundingClientRect()
                                .height /
                                2 -
                              window.innerHeight / 2 +
                              (Math.random() * 20 - 10)
                            : -window.innerHeight / 2 + 80,
                          scale: 0.6,
                          opacity: 0,
                          rotate: 360,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.5 + i * 0.1,
                          delay: i * 0.05,
                          ease: "easeOut",
                        }}
                      >
                        🪙
                      </motion.div>
                    ))}

                    {/* Main +20 text animation to exact counter position */}
                    <motion.div
                      className="fixed text-yellow-400 text-3xl font-bold pointer-events-none z-50"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                      initial={{
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: 1,
                      }}
                      animate={{
                        x: coinCounterRef.current
                          ? coinCounterRef.current.getBoundingClientRect()
                              .left +
                            coinCounterRef.current.getBoundingClientRect()
                              .width /
                              2 -
                            window.innerWidth / 2
                          : window.innerWidth / 2 - 120,
                        y: coinCounterRef.current
                          ? coinCounterRef.current.getBoundingClientRect().top +
                            coinCounterRef.current.getBoundingClientRect()
                              .height /
                              2 -
                            window.innerHeight / 2
                          : -window.innerHeight / 2 + 60,
                        scale: 0.8,
                        opacity: 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                      }}
                      onAnimationComplete={() => {
                        setShowClaimedCoins(false);
                        // Navigate to home page after animation completes
                        setTimeout(() => {
                          router.push("/");
                        }, 500); // Small delay to show the final coin counter update
                      }}
                    >
                      +{winCoinsAmount}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <div className="cover-container d-flex w-100 h-[70dvh] p-3 mx-auto  flex-column">
          <div className="row g-3 align-items-center justify-content-center">
            {/* <lottie-player
              src="https://assets3.lottiefiles.com/packages/lf20_5hufvwkz.json"
              background="transparent"
              speed="1"
              className="lottie-firework"
              loop
              autoplay
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
              }}
            /> */}

            <div className=" relative h-[70dvh] z-10 flex flex-col justify-center items-center ">
              <div className=" mx-auto flex px-4 py-3 z-10 flex-col bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl text-white w-fit justify-center items-center">
                <div className="mb-4 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-success"
                    width="50"
                    height="50"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                  </svg>
                </div>
                <div className="text-center z-10">
                  <h1 className=" !text-4xl !font-bold">
                    Congratulations, You Win!
                  </h1>
                </div>
                <div className="my-3 relative" ref={coinsRef}>
                  <motion.h1
                    className="text-yellow-400 !text-lg"
                    animate={
                      isAnimating
                        ? {
                            scale: [1, 1.1, 1],
                            opacity: [1, 0.7, 1],
                          }
                        : {}
                    }
                    transition={{ duration: 0.5, repeat: isAnimating ? 3 : 0 }}
                  >
                    🪙{" "}
                    <span className="font-bold text-lg text-yellow-400">
                      {winCoinsAmount} Coins
                    </span>
                  </motion.h1>

                  {/* Floating coins animation */}
                  <AnimatePresence>
                    {isAnimating && (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute text-yellow-400 text-2xl pointer-events-none"
                            initial={{
                              x: 0,
                              y: 0,
                              opacity: 1,
                              scale: 0,
                            }}
                            animate={{
                              x: Math.random() * 200 - 100,
                              y: -50 - Math.random() * 50,
                              opacity: 0,
                              scale: 1,
                              rotate: 360,
                            }}
                            transition={{
                              duration: 1.5,
                              delay: i * 0.1,
                              ease: "easeOut",
                            }}
                          >
                            🪙
                          </motion.div>
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="col-auto">
                  <motion.button
                    onClick={claimWinningBet}
                    disabled={isAnimating}
                    className={`btn btn-lg fw-bold border-white ${
                      isAnimating
                        ? "btn-secondary opacity-50 cursor-not-allowed"
                        : "btn-light bg-white"
                    }`}
                    whileHover={!isAnimating ? { scale: 1.05 } : {}}
                    whileTap={!isAnimating ? { scale: 0.95 } : {}}
                    transition={{ duration: 0.1 }}
                  >
                    {isAnimating ? "Claiming..." : "Claim Winning Bet"}
                  </motion.button>
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
