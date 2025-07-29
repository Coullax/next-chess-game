import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";

export default function LostPage() {
  const router = useRouter();

  const tryAgain = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Game Over - You Lost</title>
        <meta name="description" content="Better luck next time!" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <div className=" flex flex-col items-center justify-center mt-5 h-[90dvh]">
            {/* <dotlottie-player 
              src="https://lottie.host/614cc155-cfb0-4c31-8a5c-11252c0d6f17/T3oYRhYHCr.json" 
              background="transparent" 
              speed="1" 
              style={{ width: '100px', height: '100px' }} 
              loop 
              autoplay
            /> */}
            <Image src={'/warn.png'} alt="Warning" width={100} height={100} className=" mb-3" />

            <div className="d-flex justify-content-center align-items-center position-relative">
              <div>
                <div className="text-center">
                  <h1>Bad Luck, You Lost!</h1>
                </div>
              </div>
            </div>

            <div className="col-auto mt-5">
              <button 
                onClick={tryAgain}
                className="btn btn-lg btn-light fw-bold border-white bg-white"
              >
                Try Again
              </button>
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