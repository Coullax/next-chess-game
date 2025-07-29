import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function WinPage() {
  const router = useRouter();
  const [player1Bool, setPlayer1Bool] = useState(false);

  useEffect(() => {
    if (router.query.player1Bool !== undefined) {
      setPlayer1Bool(router.query.player1Bool === "true");
    }
  }, [router.query]);

  const claimWinningBet = async () => {
    try {
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

      if (win) {
        router.push("/");
      }
    } catch (error) {
      console.error("Error claiming winning bet:", error);
    }
  };

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
        <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <div className="row g-3 align-items-center justify-content-center mt-5">
            <lottie-player
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
            />

            <div className=" relative z-10">
              <div className=" flex h-[90dvh] z-10 flex-col justify-center items-center">
                <div className="mb-4 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-success"
                    width="75"
                    height="75"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                  </svg>
                </div>
                <div className="text-center z-10">
                  <h1>Congratulations, You Win!</h1>
                </div>
                <div className="col-auto mt-5">
                  <button
                    onClick={claimWinningBet}
                    className="btn btn-lg btn-light fw-bold border-white bg-white"
                  >
                    Claim Winning Bet
                  </button>
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
