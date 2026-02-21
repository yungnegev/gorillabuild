import Link from "next/link";
import Image from "next/image";
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
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-md"
              aria-hidden
            />
            <span className="text-sm font-semibold tracking-wide text-white">Gorilla Build</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-6">{children}</main>
      <MobileBottomNav />
    </>
  );
}
