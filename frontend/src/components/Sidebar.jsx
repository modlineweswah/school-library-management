import React, { useState } from 'react';
import { sidebarStyles as s } from "../assets/dummyStyles";
import {
  Bell,
  BookCopy,
  ChartNoAxesCombined,
  ChevronRight,
  LogIn,
  Menu,
  ShieldCheck,
  UserPlus,
  UserRound,
  X
} from "lucide-react";
import { Link, useLocation } from 'react-router-dom';

const iconMap = {
  dashboard: ChartNoAxesCombined,
  book: BookCopy,
  alerts: Bell,
  admin: ShieldCheck,
  user: UserRound
};

const Sidebar = ({
  title,
  subtitle,
  badge,
  navItems,
  footerItems = [],
  accent = "user",
  logoSrc
}) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const badgeStyles = accent === "admin" ? s.badgeAdmin : s.badgeUser;

  // Shared footer content so the <button> and <Link> branches below can't drift out of sync
  const renderFooterContent = (Icon, label) => (
    <>
      <span className={`${s.footerIconWrapper} flex items-center gap-2 min-w-0`}>
        <Icon size={16} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <ChevronRight size={16} className="shrink-0" />
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
        aria-expanded={open}
        className={s.mobileMenuButton}
      >
        <Menu size={18} />
      </button>

      <div
        className={`${s.mobileOverlay} ${open ? s.mobileOverlayOpen : s.mobileOverlayClosed}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside className={`${s.sidebar} ${open ? s.sidebarOpen : s.sidebarClosed} flex flex-col h-full`}>
        <div className={`${s.sidebarHeader} flex items-center justify-between gap-3`}>
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <div className={`${s.logoWrapper} flex items-center justify-center shrink-0`}>
              {logoSrc ? (
                <img src={logoSrc} alt="logo" className={s.logoImage} />
              ) : (
                <BookCopy size={22} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className={`${s.title} truncate`}>{title}</h2>
              {subtitle && <p className={`${s.subtitle} truncate`}>{subtitle}</p>}
              {badge && (
                <span className={`${s.badgeBase} ${badgeStyles} inline-block mt-1`}>
                  {badge}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Close sidebar"
            className={`${s.closeButton} shrink-0`}
          >
            <X size={18} />
          </button>
        </div>

        <nav className={`${s.nav} flex-1 flex flex-col gap-1 overflow-y-auto`}>
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] ?? ChevronRight;
            const active =
              location.pathname === item.href ||
              (item.match ? location.pathname.startsWith(item.match) : false);

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`${s.navLink} flex items-center gap-3 ${
                  active ? s.navLinkActive : s.navLinkInactive
                }`}
              >
                <span
                  className={`${s.navIconWrapper} flex items-center justify-center shrink-0 ${
                    active ? s.navIconWrapperActive : s.navIconWrapperInactive
                  }`}
                >
                  <Icon size={18} />
                </span>

                <span className="min-w-0 flex-1 flex flex-col">
                  <span className={`${s.navLabel} truncate`}>{item.label}</span>
                  {item.description && (
                    <span
                      className={`${s.navDescription} truncate ${
                        active ? s.navDescriptionActive : s.navDescriptionInactive
                      }`}
                    >
                      {item.description}
                    </span>
                  )}
                </span>

                <ChevronRight
                  size={16}
                  className={`shrink-0 ${active ? s.navChevronActive : s.navChevronInactive}`}
                />
              </Link>
            );
          })}
        </nav>

        <div className={`${s.footer} flex flex-col gap-2`}>
          {footerItems.map((item) => {
            const Icon = item.icon === "signup" ? UserPlus : LogIn;

            if (item.action) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={`${s.footerButton} flex items-center justify-between gap-2 ${
                    item.kind === "primary" ? s.footerButtonPrimary : s.footerButtonSecondary
                  }`}
                >
                  {renderFooterContent(Icon, item.label)}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`${s.footerLink} flex items-center justify-between gap-2 ${
                  item.kind === "primary" ? s.footerLinkPrimary : s.footerLinkSecondary
                }`}
              >
                {renderFooterContent(Icon, item.label)}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;