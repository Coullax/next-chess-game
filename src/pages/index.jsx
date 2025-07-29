import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCover, setShowCover] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkWalletConnection();
    
    // Check for error in URL params
    if (router.query.error === 'invalidCode') {
      setErrorMessage('Invalid invite code');
    }
  }, [router.query]);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setShowCover(false);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      let chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const goerliChainId = '0xaa36a7';

      if (chainId !== goerliChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: goerliChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: goerliChainId,
                  chainName: 'Goerli Test Network',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
                  blockExplorerUrls: ['https://goerli.etherscan.io/'],
                }],
              });
            } catch (addError) {
              console.log("Failed to add Goerli network to MetaMask");
              return;
            }
          }
        }
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected wallet address:", accounts[0]);
      setIsConnected(true);
      setShowCover(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const createGame = async () => {
    try {
      // Here you would integrate with your smart contract
      // For now, we'll just redirect to the game page
      router.push(`/white?code=${gameCode}&bet=${betAmount}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const joinGame = () => {
    if (!gameCode) {
      setErrorMessage("Please enter a game code");
      return;
    }
    router.push(`/black?code=${gameCode}&bet=${betAmount}`);
  };

  return (
    <>
      <Head>
        <title>Blockchain Chess Game</title>
        <meta name="description" content="Play chess on the blockchain" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/web3/4.5.0/web3.min.js"></script>
      </Head>

      <div className="d-flex h-100 text-center text-bg-dark">
        <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <header className="mb-auto">
            <div>
              <h3 className="float-md-start mb-0">Blockchain Chess Game</h3>
              <nav className="nav nav-masthead justify-content-center float-md-end">
                <button 
                  onClick={connectWallet}
                  className="btn btn-lg btn-light fw-bold border-white bg-white"
                >
                  {isConnected ? "Connected!" : "Connect Wallet"}
                </button>
              </nav>
            </div>
          </header>

          <main className="px-3">
            {showCover && (
              <div id="showCover">
                <img 
                  src="/img/chesspieces/wikipedia/chess_gold3.png" 
                  className="chess cover" 
                  alt="Chess" 
                  width="800" 
                  height="800"
                />
              </div>
            )}

            <div id="creategames" style={{ display: isConnected ? 'block' : 'none' }}>
              <h1>
                <img 
                  src="/img/chesspieces/wikipedia/chess_gold3.png" 
                  className="chess cover" 
                  alt="Chess"
                  width="400" 
                  height="400"
                />
              </h1>

              <div className="row g-3 align-items-center justify-content-center mt-3">
                <div className="col-auto">
                  <label htmlFor="betamount" className="col-form-label">Bet Amount : </label>
                </div>
                <div className="col-auto">
                  <input 
                    className="form-control form-control-md" 
                    id="bet" 
                    type="text" 
                    placeholder="Bet : USD"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                </div>

                <div className="col-auto">
                  <label htmlFor="gamepin" className="col-form-label">Game Pin</label>
                </div>
                <div className="col-auto">
                  <input 
                    className="form-control form-control-md" 
                    id="codeInput" 
                    type="text" 
                    placeholder="Pin"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3 align-items-center justify-content-center mt-5">
                <div className="col-auto">
                  <button 
                    onClick={createGame}
                    className="btn btn-lg btn-light fw-bold border-white bg-white"
                  >
                    Create game
                  </button>
                </div>
                <div className="col-auto">
                  <button 
                    onClick={joinGame}
                    className="btn btn-lg btn-light fw-bold border-white bg-white"
                  >
                    Join game
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div style={{ color: 'red' }} id="errorMessage">
                  {errorMessage}
                </div>
              )}
            </div>
          </main>

          <footer className="mt-auto text-white-50">
            <p>© 2024 <a href="https://coullax.com/" className="text-white">Coullax</a> All Rights Reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
}