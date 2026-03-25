import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0f1c]">
      <Navigation />

      <section className="relative px-4 pt-24 pb-10">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Choose your mode
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Learn with structured units or analyze a decision with AI risk scoring.
          </p>

          <div className="mt-8 grid md:grid-cols-2 gap-5 md:gap-6">
            <Link
              href="/learn"
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-colors hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-blue-400 text-sm font-semibold">
                    📚 Learn Finance
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white group-hover:text-white">
                    Education first
                  </h2>
                  <p className="text-slate-400 mt-2">
                    Units, explanations, and unit tests.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/20">
                  <span className="text-blue-300 text-lg">→</span>
                </div>
              </div>
            </Link>

            <Link
              href="/analyze"
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-colors hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-purple-400 text-sm font-semibold">
                    🧠 Analyze Decision
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white group-hover:text-white">
                    AI risk scoring
                  </h2>
                  <p className="text-slate-400 mt-2">
                    Answer questions and get risk verdict instantly.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/20">
                  <span className="text-purple-300 text-lg">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
