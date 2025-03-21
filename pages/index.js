import Head from 'next/head';
import styles from '../styles/Home.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'
import EmployeeTable from '../components/EmployeeTable';
import { Raleway } from 'next/font/google'

const raleway = Raleway({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

export default function Home() {
  return (
    <div>
      <Head>
        <title>Motas Requests</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-dark mb-0">
        <main className="mb-0 pt-0 pb-2">
          <img src="/Motas-logo-primary-white.png" className="w-25 py-2 mt-5 mb-3" />
          <h2 className={`text-white ${raleway.className}`} style={{ fontWeight: 700 }}>TRANSPORT REQUEST</h2>
        </main>
      </div>

      <main className="mt-1 pt-2 pb-4">
        {/* Rest of your content */}
        <EmployeeTable />
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family:
            Menlo,
            Monaco,
            Lucida Console,
            Liberation Mono,
            DejaVu Sans Mono,
            Bitstream Vera Sans Mono,
            Courier New,
            monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
