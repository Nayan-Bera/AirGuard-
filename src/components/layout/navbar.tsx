'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  Bot,
  CloudSun,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Lightbulb,
  Sun,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAQIColor, getAQIGradient } from '@/lib/utils/index';
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { readStoredLocation } from '@/components/home-profile/home-profile-utils';
import { BrandMark } from '@/components/layout/brand-mark';
import { logoutUser } from '@/lib/store/auth-slice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';

export interface NavbarProps {
  aqi?: number | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Home', href: '/home', icon: Home },
  { label: 'Insights', href: '/insights', icon: Lightbulb },
  { label: 'Assistant', href: '/assistant', icon: Bot },
  { label: 'Forecast', href: '/forecast', icon: CloudSun },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function AQIMiniBadge({ aqi }: { aqi: number | null | undefined }) {
  if (aqi === null || aqi === undefined || Number.isNaN(aqi)) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
              aria-label="Current AQI unavailable"
            />
          }
        >
          <Activity className="size-3.5 text-muted-foreground/70" />
          <span>AQI --</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Enable location or pick a city to view live AQI
        </TooltipContent>
      </Tooltip>
    );
  }

  const roundedAqi = Math.round(aqi);
  const aqiStyle = getAQIColor(roundedAqi);
  const aqiGradient = getAQIGradient(roundedAqi);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href="/dashboard"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
          />
        }
      >
        <Badge
          variant="outline"
          className={cn(
            'h-7 gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-transform hover:scale-[1.02]',
            aqiStyle.bg,
            aqiStyle.text,
            aqiStyle.border
          )}
        >
          <span className="relative flex size-2">
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-gradient-to-r',
                aqiGradient
              )}
            />
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full bg-gradient-to-r',
                aqiGradient
              )}
            />
          </span>
          <span className="tabular-nums">AQI {roundedAqi}</span>
          <span className="hidden sm:inline font-medium opacity-85">
            · {aqiStyle.label}
          </span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Current Air Quality: {roundedAqi} ({aqiStyle.label} · India CPCB)
      </TooltipContent>
    </Tooltip>
  );
}

export function Navbar({ aqi = null }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState<boolean>(false);
  const [liveAqi, setLiveAqi] = React.useState<number | null>(null);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const loadAqi = async () => {
      const location = readStoredLocation();
      if (!location) {
        if (!cancelled) setLiveAqi(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/air-quality?lat=${location.coordinates.latitude}&lon=${location.coordinates.longitude}`
        );
        const payload = await res.json().catch(() => null);
        const current = payload?.current ?? payload?.data?.current ?? payload;
        if (!cancelled) {
          setLiveAqi(
            typeof current?.aqi === 'number' && Number.isFinite(current.aqi)
              ? current.aqi
              : null
          );
        }
      } catch {
        if (!cancelled) setLiveAqi(null);
      }
    };

    void loadAqi();
    window.addEventListener('airguard-location-change', loadAqi);
    return () => {
      cancelled = true;
      window.removeEventListener('airguard-location-change', loadAqi);
    };
  }, [pathname]);

  const handleLogout = React.useCallback(async () => {
    await dispatch(logoutUser());
    router.replace('/');
    router.refresh();
  }, [dispatch, router]);

  const toggleTheme = React.useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem('airguard-theme', next ? 'dark' : 'light');
      } catch {
        // Ignore storage errors in restricted contexts
      }
      return next;
    });
  }, []);

  const isRouteActive = React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname]
  );
  const displayedAqi = typeof aqi === 'number' && Number.isFinite(aqi) ? aqi : liveAqi;

  if (!authUser) return null;

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55"
    >
      {/* Subtle top ambient accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu + Brand Logo */}
        <div className="flex items-center gap-2.5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-xl"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[300px] sm:w-[340px] border-r border-border/50 bg-background/95 backdrop-blur-2xl"
            >
              <SheetHeader className="border-b border-border/50 pb-4">
                <SheetTitle className="flex items-center gap-2.5">
                  <BrandMark iconClassName="size-9 rounded-xl" nameClassName="bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-lg text-transparent" />
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Hyper-local air quality &amp; smart home assistant
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-3 px-4 py-2">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Local Air Status
                  </span>
                  <AQIMiniBadge aqi={displayedAqi} />
                </div>

                <nav aria-label="Mobile Navigation" className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item, idx) => {
                    const active = isRouteActive(item.href);
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ x: -12, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.04 * idx, duration: 0.2 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                            active
                              ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                          )}
                        >
                          <Icon
                            className={cn(
                              'size-4.5',
                              active
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground'
                            )}
                          />
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>

              <SheetFooter className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="flex-1 justify-start gap-2 rounded-xl"
                  >
                    {isDark ? (
                      <>
                        <Sun className="size-4 text-amber-400" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="size-4 text-slate-600" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setMobileOpen(false);
                      void handleLogout();
                    }}
                    className="gap-1.5 rounded-xl"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 rounded-xl py-1 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <motion.span whileHover={{ scale: 1.04 }} transition={{ duration: 0.3 }}>
              <BrandMark iconClassName="size-9 rounded-xl" nameClassName="bg-gradient-to-r from-foreground via-foreground to-emerald-600 bg-clip-text text-base text-transparent sm:text-lg" />
            </motion.span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 p-1 backdrop-blur-md"
        >
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-border/60 dark:bg-card"
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 size-4 transition-colors',
                    active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  )}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: AQI Mini Badge, Theme Toggle, User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <AQIMiniBadge aqi={displayedAqi} />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                  className="hidden sm:inline-flex size-8.5 rounded-full border border-border/40 bg-background/50 hover:bg-muted/80"
                />
              }
            >
              {isDark ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-slate-600" />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="relative size-9 rounded-full p-0 ring-1 ring-border/60 transition-all hover:ring-emerald-500/50"
                  aria-label="User profile menu"
                />
              }
            >
              <Avatar className="size-9">
                <AvatarImage src="" alt="User avatar" />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <User className="size-4" />
                </AvatarFallback>
                <AvatarBadge className="bg-emerald-500" />
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 rounded-xl border border-border/60 bg-popover/95 p-1.5 backdrop-blur-xl"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {authUser.name}
                    </p>
                    <p className="text-xs font-normal text-muted-foreground truncate">
                      {authUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push('/home')}
                  className="cursor-pointer rounded-lg px-2 py-1.5"
                >
                  <Home className="size-4 text-muted-foreground" />
                  <span>My Home Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="cursor-pointer rounded-lg px-2 py-1.5"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  <span>Alerts &amp; Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="cursor-pointer rounded-lg px-2 py-1.5 sm:hidden"
                >
                  {isDark ? (
                    <>
                      <Sun className="size-4 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="size-4 text-slate-600" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-lg px-2 py-1.5 text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}

