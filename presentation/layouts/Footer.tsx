export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>&copy; {year} Lithdex. All rights reserved.</p>
        <p className="text-xs">Mineral &amp; gemstone identification</p>
      </div>
    </footer>
  );
}
