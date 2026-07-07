export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm">
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
          {/* cocktail-glass logo */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16l-8 9-8-9Z" />
            <path d="M12 13v6M8 21h8" />
            <path d="M9 7h6" />
          </svg>
        </span>
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-tight">Sip</div>
          <div className="text-[11px] font-medium text-white/80">Drink &amp; calorie tracker</div>
        </div>
      </div>
    </header>
  );
}
