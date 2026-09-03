import Link from "next/link";

/** Offline fallback — shown when the network is unavailable. */
export default function Offline() {
  return (
    <main className="shell">
      <section className="card" role="alert" aria-label="Offline fallback">
        <h1>You are offline</h1>
        <p className="muted">
          Check your connection and try again. Your last entered values are
          kept on this device.
        </p>
        <p>
          <Link href="/">Back to UdyogSaarthi</Link>
        </p>
      </section>
    </main>
  );
}
