import Link from "next/link";
import { MobileBottomNav } from "../_components/MobileBottomNav";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-3">
            <div
              aria-hidden
              className="flex size-7 items-center justify-center rounded-md bg-lime-400 text-sm font-black text-black"
            >
              GB
            </div>
            <span className="text-sm font-semibold tracking-wide text-white">Gorilla Build</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-6">{children}</main>
      <MobileBottomNav />
    </>
  );
}
