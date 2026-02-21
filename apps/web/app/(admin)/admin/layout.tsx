import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold">Admin</h1>
        <Link href="/" className="text-sm font-semibold text-lime-300 hover:text-lime-200">
          На лендинг
        </Link>
      </header>
      {children}
    </main>
  );
}
