import '../styles/globals.css';
import { AnimatePresence } from 'framer-motion';
import Head from 'next/head';

function MyApp({ Component, pageProps, router }) {
  return (
    <>
      <Head>
        <link rel="shortcut icon" type="image/x-icon" href="/images/favicon.ico" />
      </Head>
      <AnimatePresence mode="wait">
        <Component {...pageProps} key={router.pathname} />
      </AnimatePresence>
    </>
  );
}

export default MyApp;