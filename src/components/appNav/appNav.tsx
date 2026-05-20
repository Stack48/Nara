"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Syne } from "next/font/google";
import Image from "next/image"; // Optimisation Next.js
import {
	Bell,
	Sun,
	Settings,
	ChevronRight,
	LayoutDashboard,
	FolderOpen,
	BookDashed,
	UserRound,
	FileX,
	SquarePen,
	Music,
	Table2,
	Plus,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import {
	Fragment,
	useLayoutEffect,
	useRef,
	useState,
	type ReactElement,
	type ReactNode,
} from "react";

const syne = Syne({
	weight: "800",
	subsets: ["latin"],
	display: "swap",
});

type NavLink = {
	icon: ReactNode;
	label: string;
	href: string;
	breadcrumbs: BreadcrumbItem[];
};

type NavSection = {
	title: string;
	hasActiveIndicator: boolean;
	links: NavLink[];
};

type ActiveIndicator = {
	height: number;
	left: number;
	top: number;
	width: number;
	visible: boolean;
};

type AppNavProps = {
	children: ReactNode;
};

type BreadcrumbItem = {
	label: string;
	href?: string;
};

export default function AppNav({ children }: AppNavProps): ReactElement {
	const pathname = usePathname();
	const currentPathname: string = pathname ?? "";
	const navRef = useRef<HTMLElement | null>(null);
	const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
	const [activeIndicator, setActiveIndicator] = useState<ActiveIndicator>({
		height: 0,
		left: 0,
		top: 0,
		width: 0,
		visible: false,
	});
	const iconSize: number = 17;
	const navSections: NavSection[] = [
		{
			title: "Main",
			hasActiveIndicator: true,
			links: [
				{
					icon: <LayoutDashboard size={iconSize} />,
					label: "Home",
					href: "/GenaralAPP/home",
					breadcrumbs: [{ label: "Home" }],
				},
				{
					icon: <FolderOpen size={iconSize} />,
					label: "My Project",
					href: "/GenaralAPP/my-project",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Project" },
					],
				},
				{
					icon: <BookDashed size={iconSize} />,
					label: "Drafts",
					href: "/GenaralAPP/drafts",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Drafts" },
					],
				},
				{
					icon: <UserRound size={iconSize} />,
					label: "Shared with me",
					href: "/GenaralAPP/shared-with-me",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Shared with me" },
					],
				},
				{
					icon: <FileX size={iconSize} />,
					label: "Deleted",
					href: "/GenaralAPP/deleted",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Deleted" },
					],
				},
			],
		},
		{
			title: "Current Project",
			hasActiveIndicator: true,
			links: [
				{
					icon: <SquarePen size={iconSize} />,
					label: "Lyrics Editor",
					href: "/GenaralAPP/lyrics-editor",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Project", href: "/GenaralAPP/my-project" },
						{ label: "My Way" },
					],
				},
				{
					icon: <Music size={iconSize} />,
					label: "Music Assets",
					href: "/GenaralAPP/music-assets",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Project", href: "/GenaralAPP/my-project" },
						{ label: "Music Assets" },
					],
				},
				{
					icon: <Table2 size={iconSize} />,
					label: "Management",
					href: "/GenaralAPP/management",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Project", href: "/GenaralAPP/my-project" },
						{ label: "Management" },
					],
				},
			],
		},
		{
			title: "Recently Accessed",
			hasActiveIndicator: false,
			links: [
				{
					icon: <Music size={iconSize} />,
					label: "Music Assets",
					href: "/GenaralAPP/music-assets",
					breadcrumbs: [
						{ label: "Home", href: "/GenaralAPP/home" },
						{ label: "Project", href: "/GenaralAPP/my-project" },
						{ label: "Music Assets" },
					],
				},
			],
		},
	];
	const activeNavItem: NavLink | undefined = navSections
		.filter((section) => section.hasActiveIndicator)
		.flatMap((section) => section.links)
		.find(
			(item: NavLink): boolean =>
				currentPathname === item.href ||
				currentPathname.startsWith(`${item.href}/`),
		);
	const activeHref: string | undefined = activeNavItem?.href;
	const ariane: BreadcrumbItem[] = activeNavItem?.breadcrumbs ?? [
		{ label: "Home" },
	];

	useLayoutEffect(() => {
		let animationFrameId: number | null = null;
		let timeoutId: number | null = null;
		let resizeObserver: ResizeObserver | null = null;

		function updateActiveIndicator(): void {
			const navElement = navRef.current;
			const activeLink = activeHref ? linkRefs.current[activeHref] : null;

			if (!navElement || !activeLink) {
				setActiveIndicator(
					(current: ActiveIndicator): ActiveIndicator => ({
						...current,
						visible: false,
					}),
				);
				return;
			}

			const navRect = navElement.getBoundingClientRect();
			const linkRect = activeLink.getBoundingClientRect();

			setActiveIndicator({
				height: linkRect.height,
				left: linkRect.left - navRect.left,
				top: linkRect.top - navRect.top,
				width: linkRect.width,
				visible: true,
			});
		}

		function updateWhileSidebarAnimates(startTime: number): void {
			updateActiveIndicator();

			if (window.performance.now() - startTime < 260) {
				animationFrameId = window.requestAnimationFrame((): void => {
					updateWhileSidebarAnimates(startTime);
				});
			}
		}

		updateActiveIndicator();
		updateWhileSidebarAnimates(window.performance.now());
		window.addEventListener("resize", updateActiveIndicator);

		const navElement = navRef.current;
		const activeLink = activeHref ? linkRefs.current[activeHref] : null;

		if (typeof ResizeObserver !== "undefined" && navElement && activeLink) {
			resizeObserver = new ResizeObserver(updateActiveIndicator);
			resizeObserver.observe(navElement);
			resizeObserver.observe(activeLink);
		}

		timeoutId = window.setTimeout(updateActiveIndicator, 230);

		return () => {
			window.removeEventListener("resize", updateActiveIndicator);
			resizeObserver?.disconnect();

			if (animationFrameId !== null) {
				window.cancelAnimationFrame(animationFrameId);
			}

			if (timeoutId !== null) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [activeHref, isCollapsed]);

	return (
		<main className="min-h-screen bg-[#0A0A0C] flex">
			{/* format aside toute la partie gauche, header en haut et mais en dessous de header a droite de aside */}
			{/* flex */}
			<aside
				className={`relative flex min-h-screen shrink-0 flex-col items-center justify-between pt-4 transition-[width] duration-200 ease-out ${
					isCollapsed ? "w-[72px]" : "w-[232px]"
				}`}
			>
				<div className="flex w-full flex-col items-center justify-center gap-5 px-2">
					<div className="flex w-full items-center justify-center">
						<h1
							className={`${syne.className} overflow-hidden whitespace-nowrap text-[26px] leading-none transition-[width] duration-200 ${
								isCollapsed ? "w-[24px]" : "w-[126px]"
							}`}
						>
							{isCollapsed ? "N" : "NARA"}
						</h1>
					</div>
					<button
						type="button"
						aria-label={
							isCollapsed
								? "Agrandir la navigation"
								: "Reduire la navigation"
						}
						aria-pressed={isCollapsed}
						onClick={(): void => {
							setIsCollapsed((currentValue: boolean): boolean => !currentValue);
						}}
						className="absolute right-[-14px] top-1/2 z-30 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[7px] border border-[#2A2A30] bg-[#131316] text-[#A1A1AA] shadow-[0_0_0_1px_rgba(0,0,0,0.35)] transition-colors hover:text-[#F3F4F6]"
					>
						{isCollapsed ? (
							<ChevronsRight size={14} strokeWidth={2} />
						) : (
							<ChevronsLeft size={14} strokeWidth={2} />
						)}
					</button>
					<button
						className={`flex h-10 w-full items-center justify-center gap-2 rounded-[7px] bg-[linear-gradient(90deg,#AA0063_0%,#D80096_100%)] transition hover:brightness-110 ${
							isCollapsed ? "px-0" : ""
						}`}
						aria-label={isCollapsed ? "Create" : undefined}
					>
						<Plus size={iconSize} />
						<span
							className={`text-[13px] font-semibold transition-opacity duration-150 ${
								isCollapsed
									? "sr-only opacity-0"
									: "opacity-100"
							}`}
						>
							Create
						</span>
					</button>
					<nav
						ref={navRef}
						className="relative flex w-full flex-col gap-5"
					>
						<span
							data-active-nav-indicator="true"
							aria-hidden="true"
							className={`pointer-events-none absolute rounded-[7px] bg-[#17171C] transition-[opacity,transform,width,height] duration-200 ease-out before:absolute before:left-1 before:top-1/2 before:h-[20px] before:w-[4px] before:-translate-y-1/2 before:rounded-full before:bg-[#F3F4F6] ${
								activeIndicator.visible
									? "z-[1] opacity-100"
									: "opacity-0"
							}`}
							style={{
								height: activeIndicator.height,
								transform: `translate3d(${activeIndicator.left}px, ${activeIndicator.top}px, 0)`,
								width: activeIndicator.width,
							}}
						/>
						{navSections.map((section) => (
							<div
								key={section.title}
								className="relative flex flex-col gap-2"
							>
								<h2
									className={`px-1 text-[15px] font-bold text-[#919191] transition-opacity duration-150 ${
										isCollapsed
											? "sr-only opacity-0"
											: "opacity-100"
									}`}
								>
									{section.title}
								</h2>
								<ul
									className={`flex flex-col gap-1.5 ${
										isCollapsed ? "pl-0" : "pl-3"
									}`}
								>
									{section.links.map((item) => {
										const canShowActive =
											section.hasActiveIndicator;
										const isActive =
											canShowActive &&
											activeHref === item.href;

										return (
											<li
												key={`${section.title}-${item.href}`}
												className="relative text-[15px] font-medium before:absolute before:inset-0 before:z-0 before:rounded-[7px] before:bg-[#17171C] before:opacity-0 before:transition-opacity before:duration-150 hover:before:opacity-100"
											>
												<Link
													href={item.href}
													ref={(
														node: HTMLAnchorElement | null,
													): void => {
														if (canShowActive) {
															linkRefs.current[
																item.href
															] = node;
														}
													}}
													aria-current={
														isActive
															? "page"
															: undefined
													}
													title={isCollapsed ? item.label : undefined}
													className={`relative z-[2] flex min-h-8 items-center rounded-[7px] py-1 transition-colors duration-200 ${
														isCollapsed
															? "justify-center px-0"
															: "gap-2 pl-5 pr-3"
													} ${
														isActive
															? "text-[#F3F4F6]"
															: "text-[#919191] hover:text-[#F3F4F6]"
													}`}
												>
													<span className="relative z-[2] flex items-center">
														{item.icon}
													</span>
													<span
														className={`relative z-[2] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-150 ${
															isCollapsed
																? "max-w-0 opacity-0"
																: "max-w-[150px] opacity-100"
														}`}
													>
														{item.label}
													</span>
												</Link>
											</li>
										);
									})}
								</ul>
							</div>
						))}
					</nav>
				</div>
				<div
					className={`flex w-full items-center border-t border-[#2C2C32] px-3 py-3 ${
						isCollapsed ? "justify-center" : "justify-center gap-2"
					}`}
				>
					<Image
						src="/udonis.png"
						alt="test avatar"
						width={48}
						height={48}
						className="h-12 w-12 rounded-full object-cover"
					/>
					<div
						className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-150 ${
							isCollapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
						}`}
					>
						<p className="truncate text-[16px] font-bold">Udonis Haslem</p>
						<span className="text-[12px] font-medium text-[#A1A1AA]">
							Pro Plan
						</span>
					</div>
				</div>
			</aside>
			<section className="flex min-h-dvh w-full flex-col">
				<header className="flex shrink-0 items-center justify-between px-4 py-3">
					<nav className="filAriane flex items-center gap-2 text-[14px]">
						{/* le dernier est automatiquement en blanc et les autres en gris */}
						{ariane.map(
							(
								item: BreadcrumbItem,
								index: number,
								arr: BreadcrumbItem[],
							) => (
								<Fragment key={`${item.label}-${index}`}>
									<span
										className={`${index === arr.length - 1 ? "text-white" : "text-[#A1A1AA]"}`}
									>
										{item.label}
									</span>
									{/* Affiche la flèche sauf après le tout dernier élément */}
									{index < arr.length - 1 && (
										<ChevronRight
											size={16}
											color="#A1A1AA"
										/>
									)}
								</Fragment>
							),
						)}
					</nav>
					<div className="flex items-center gap-3">
						<button className="rounded-[7px] border border-[#2A2A30] bg-[#131316] p-2">
							<Sun size={iconSize} />
						</button>
						{/* trait vertical */}
						<div className="h-8 w-px bg-[#2A2A30]"></div>
						<button className="rounded-[7px] border border-[#2A2A30] bg-[#131316] p-2">
							<Bell size={iconSize} />
						</button>
						<button className="rounded-[7px] border border-[#2A2A30] bg-[#131316] p-2">
							<Settings size={iconSize} />
						</button>
					</div>
				</header>
				{/* border arrondi top left */}

				<article className="w-[calc(100%)] min-h-0 flex-1 bg-[#17171C] border-t border-l border-[#2C2C32] rounded-tl-2xl overflow-hidden">
					{children}
				</article>
			</section>
		</main>
	);
}
