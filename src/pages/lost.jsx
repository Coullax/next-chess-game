import { useRouter } from "next/router";
import Head from "next/head";

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

      <div className="d-flex h-100 text-center text-bg-dark bg-dark">
        <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
          <div className="row g-3 align-items-center justify-content-center mt-5">
            <dotlottie-player 
              src="https://lottie.host/614cc155-cfb0-4c31-8a5c-11252c0d6f17/T3oYRhYHCr.json" 
              background="transparent" 
              speed="1" 
              style={{ width: '300px', height: '300px' }} 
              loop 
              autoplay
            />
            
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
          
          <footer className="mt-auto text-white-50">
            <p>© 2024 <a href="https://coullax.com/" className="text-white">Coullax</a> All Rights Reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
} 