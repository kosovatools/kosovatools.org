export default function ToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 py-3 px-3 sm:py-8 sm:gap-8">
      {children}
    </section>
  );
}
