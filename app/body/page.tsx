import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import BodyQuiz from "./BodyQuiz";
import styles from "./body.module.css";

// Event landing page for the Body Under Pressure Assessment: hero, then
// question 1 right underneath, mirroring the vibecheck layout. Results live
// on body.wearemomentmakers.com/r/{id}.
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Body Under Pressure Assessment",
  description: "4 quick questions. See your Body Under Pressure Pattern on your phone in under a minute.",
};

export default function BodyPage() {
  return (
    <div className={`${instrument.variable} ${styles.page}`}>
      <header className={styles.topbar}>Moment Makers · Structural Bodywork</header>

      <section className={styles.hero}>
        <p className={styles.pill}>Free. 4 questions. Under a minute.</p>
        <h1 className={styles.headline}>
          Is Your Body Working <span className={styles.gold}>With You</span>, Or Restricting You?
        </h1>
        <p className={styles.subhead}>
          The shoulder that keeps getting tight. The hip that always needs stretching. Tap your
          answers below and see the pattern behind it.
        </p>

        <div className={styles.byline}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://vibecheck.wearemomentmakers.com/_next/image?url=%2Fimages%2Fkegan.jpg&w=128&q=75" alt="Kegan Remmey" width={56} height={56} className={styles.avatar} />
          <span className={styles.who}>
            <span className={styles.name}>Kegan Remmey</span>
            <span className={styles.creds}>300+ clients · Anatomy Trains · Somatic Experiencing</span>
          </span>
        </div>
      </section>

      <BodyQuiz />

      <footer className={styles.footer}>
        <a href="https://body.wearemomentmakers.com/privacy">Privacy</a>
        <span>Moment Makers · Kegan Remmey · Structural Bodywork</span>
      </footer>
    </div>
  );
}
