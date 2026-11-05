import Link from "next/link";

export type AppHeaderProps = {
  active?: string;
};

export function AppHeader({ active }: AppHeaderProps) {
  const desktopLinks = [
    ["Home", "/"],
    ["Design System", "/design-system"],
    ["Dashboard", "/dashboard"],
    ["Check In", "/checkin"],
    ["Usher QR", "/usher"],
    ["Reports", "/reports"],
    ["Photos", "/photos"],
  ];

  const mobileNavItems = [
    ["Home", "/", "⌂"],
    ["Streak", "/streak", "♨"],
    ["Photos", "/photos", "▧"],
    ["Design", "/design-system", "❖"],
    ["Profile", "/profile", "◯"],
  ];

  return (
    <>
      <header className="app-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>ChurchConnect</span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {desktopLinks.map(([label, href]) => (
            <Link key={href} href={href} className={active === label ? "nav-active" : ""}>
              {label}
            </Link>
          ))}
        </nav>

        <Link className="header-link" href="/profile">
          My Profile
        </Link>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileNavItems.map(([label, href, icon]) => (
          <Link key={href} href={href} className={active === label ? "mobile-nav-active" : ""}>
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
