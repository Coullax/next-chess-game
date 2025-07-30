import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import io from "socket.io-client";

let socket;

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCover, setShowCover] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fakeTokens, setFakeTokens] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const router = useRouter();

  const fakeWallets = [
    { id: 1, name: "Demo Wallet 1", icon: "🪙" },
    { id: 2, name: "Demo Wallet 2", icon: "💰" },
    { id: 3, name: "Demo Wallet 3", icon: "💸" },
  ];

  useEffect(() => {
    const storedWallet = sessionStorage.getItem("selectedWallet");
    const storedTokens = sessionStorage.getItem("fakeTokens");
    if (storedWallet) {
      setSelectedWallet(JSON.parse(storedWallet));
      setFakeTokens(parseInt(storedTokens, 10));
      setIsConnected(true);
      setShowCover(false);
    }
    // checkWalletConnection();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("betAmount", betAmount);
  }, [betAmount]);

  useEffect(() => {
    // Initialize socket connection for the home page
    socket = io("https://chess-site-server.onrender.com", {
      reconnection: true,
      reconnectionAttempts: 5,
      query: {},
    });

    // Clean up socket connection when component unmounts
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const connectFakeWallet = (wallet) => {
    if (!isConnected) {
      setSelectedWallet(wallet);
      setFakeTokens(1000);
      setIsConnected(true);
      setShowCover(false);
      setIsModalOpen(false);
      sessionStorage.setItem("selectedWallet", JSON.stringify(wallet));
      sessionStorage.setItem("fakeTokens", 1000);
    }
  };

  // const checkWalletConnection = async () => {
  //   if (typeof window !== 'undefined' && window.ethereum) {
  //     try {
  //       const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  //       if (accounts.length > 0) {
  //         setIsConnected(true);
  //         setShowCover(false);
  //       }
  //     } catch (error) {
  //       console.error("Error checking wallet connection:", error);
  //     }
  //   }
  // };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    setIsLoading(true);
    try {
      let chainId = await window.ethereum.request({ method: "eth_chainId" });
      const goerliChainId = "0xaa36a7";

      if (chainId !== goerliChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: goerliChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: goerliChainId,
                    chainName: "Goerli Test Network",
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: [
                      "https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID",
                    ],
                    blockExplorerUrls: ["https://goerli.etherscan.io/"],
                  },
                ],
              });
            } catch (addError) {
              console.log("Failed to add Goerli network to MetaMask");
              setIsLoading(false);
              return;
            }
          }
        }
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected wallet address:", accounts[0]);
      setIsConnected(true);
      setShowCover(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async () => {
    if (!betAmount) {
      setErrorMessage("Please enter a bet amount");
      return;
    }
    setErrorMessage("");
    try {
      // Here you would integrate with your smart contract
      console.log(`Creating game with code: ${gameCode}, bet: ${betAmount}`);
      router.push(`/game?color=white&code=${gameCode}&bet=${betAmount}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const joinGame = () => {
    if (!gameCode) {
      setErrorMessage("Please enter a game code");
      return;
    }
    if (!betAmount) {
      setErrorMessage("Please enter a bet amount");
      return;
    }
    setErrorMessage("");
    router.push(`/game?color=black&code=${gameCode}&bet=${betAmount}`);
    console.log(`Joining game with code: ${gameCode}, bet: ${betAmount}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
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

            <button
              onClick={() =>
                !isConnected ? setIsModalOpen(true) : setIsModalOpen(false)
              }
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 cursor-pointer
                ${
                  isConnected
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-xl"
                }
              `}
            >
              {isConnected
                ? `✓ ${
                    selectedWallet?.name || "Connected"
                  } (${fakeTokens} Tokens)`
                : "Connect Wallet"}
            </button>
          </div>
        </header>

        {/* Wallet Selection Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">
                  Select Demo Wallet
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {fakeWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => connectFakeWallet(wallet)}
                    className="w-full flex items-center space-x-4 p-4 text-black bg-black/5 hover:bg-black/10 rounded-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    <span className="text-lg font-medium">{wallet.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-sm text-gray-400 text-center">
                Select a demo wallet to receive 1000 fake tokens
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl mx-auto">
            {showCover && (
              <div className="text-center mb-12 animate-fade-in">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative text-9xl md:text-[12rem] filter drop-shadow-2xl animate-bounce-slow">
                    ♛
                  </div>
                </div>
                <h2 className="text-4xl md:text-6xl font-bold mt-8 mb-4 bg-gradient-to-r from-white via-yellow-200 to-orange-300 bg-clip-text text-transparent">
                  Royal Chess Arena
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Play chess with demo tokens
                </p>
              </div>
            )}

            {isConnected && (
              <div className="animate-slide-up">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4 animate-bounce-slow">♚</div>
                    <h3 className="text-2xl font-bold mb-2">Ready to Play</h3>
                    <p className="text-gray-300">
                      Create a new game or join an existing one
                    </p>
                    <p className="text-gray-400 mt-2">
                      Available Tokens: {fakeTokens}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Bet Amount (Tokens)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-yellow-400">🪙</span>
                        </div>
                        <input
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          type="number"
                          placeholder="Enter bet amount"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Game Pin
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-blue-400">#</span>
                        </div>
                        <input
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          type="text"
                          placeholder="Enter or create pin"
                          value={gameCode}
                          onChange={(e) => setGameCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={createGame}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
                    >
                      <span className="text-xl">⚔️</span>
                      <span>Create Game</span>
                    </button>

                    <button
                      onClick={joinGame}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
                    >
                      <span className="text-xl">🏰</span>
                      <span>Join Game</span>
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-center animate-shake">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xl">⚠️</span>
                        <span>{errorMessage}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
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

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
