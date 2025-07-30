import "@/styles/globals.css";
import Head from "next/head";
import Script from "next/script";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
      <title>Next.js + Socket.io</title>
        <meta name="description" content="A simple chat app using Next.js and Socket.io" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script src="https://code.jquery.com/jquery-3.7.0.min.js" />
      </Head>
      <Script
        src="/js/jquery-3.7.0.min.js"
        strategy="beforeInteractive"
        // onLoad={() => {
        //   console.log("jQuery loaded");
        //   setScriptsReady(false); // Reset to ensure next script waits
        // }}
        // onError={() => console.error("jQuery failed to load")}
      />

      <Component {...pageProps} />
    </>
  )
}
