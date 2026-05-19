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
} from "lucide-react";
import {
	Fragment,
	useEffect,
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
	top: number;
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
	const [activeIndicator, setActiveIndicator] = useState<ActiveIndicator>({
		height: 0,
		top: 0,
		visible: false,
	});
	const iconSize: number = 20;
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
		{ label: "Dashboard" },
	];

	useEffect(() => {
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
				top: linkRect.top - navRect.top,
				visible: true,
			});
		}

		updateActiveIndicator();
		window.addEventListener("resize", updateActiveIndicator);

		return () => {
			window.removeEventListener("resize", updateActiveIndicator);
		};
	}, [activeHref]);

	return (
		<main className="min-h-screen bg-[#0A0A0C] flex">
			{/* format aside toute la partie gauche, header en haut et mais en dessous de header a droite de aside */}
			{/* flex */}
			<aside className="w-70 min-h-screen  flex flex-col justify-between items-center pt-5">
				<div className="flex flex-col justify-center items-center gap-7 w-full px-2">
					<h1 className={`${syne.className} text-[30px]`}>NARA</h1>
					<button className="flex h-13 w-[calc(100%)] items-center justify-center gap-3 rounded-lg bg-[linear-gradient(90deg,#AA0063_0%,#D80096_100%)] transition hover:brightness-110">
						<Plus size={iconSize} />
						<span className="text-[15px] font-medium">Create</span>
					</button>
					<nav
						ref={navRef}
						className="relative flex w-full flex-col gap-7"
					>
						<span
							aria-hidden="true"
							className={`pointer-events-none absolute inset-x-0 rounded-[4px] bg-[#260016] transition-[opacity,transform,height] duration-200 ease-out ${
								activeIndicator.visible
									? "opacity-100"
									: "opacity-0"
							}`}
							style={{
								height: activeIndicator.height,
								transform: `translate3d(0, ${activeIndicator.top}px, 0)`,
							}}
						/>
						{navSections.map((section) => (
							<div
								key={section.title}
								className="relative flex flex-col gap-3"
							>
								<h2 className="text-[20px] font-bold text-[#919191]">
									{section.title}
								</h2>
								<ul className="flex flex-col gap-2 pl-5">
									{section.links.map((item) => {
										const canShowActive =
											section.hasActiveIndicator;
										const isActive =
											canShowActive &&
											activeHref === item.href;

										return (
											<li
												key={`${section.title}-${item.href}`}
												className="relative text-[20px] font-medium"
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
													className={`relative z-[1] flex min-h-8 items-center gap-2 rounded-[4px] px-3 py-1 transition-colors duration-200 ${
														isActive
															? "text-[#D80096]"
															: "text-[#919191] hover:text-[#F3F4F6]"
													}`}
												>
													{item.icon}
													<span>{item.label}</span>
												</Link>
											</li>
										);
									})}
								</ul>
							</div>
						))}
					</nav>
				</div>
				<div className="flex items-center justify-center gap-2 p-4 border-t border-[#2C2C32]">
					<Image
						src="/udonis.png"
						alt="test avatar"
						width={60}
						height={60}
						className="h-[60px] w-[60px] rounded-full object-cover"
					/>
					<div>
						<p className="text-[20px] font-bold">Udonis Haslem</p>
						<span className="text-[15px] font-medium text-[#A1A1AA]">
							Pro Plan
						</span>
					</div>
				</div>
			</aside>
			<section className="flex min-h-dvh w-full flex-col">
				<header className="flex shrink-0 items-center justify-between px-4 py-4">
					<nav className="filAriane flex items-center gap-2">
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
											size={20}
											color="#A1A1AA"
										/>
									)}
								</Fragment>
							),
						)}
					</nav>
					<div className="flex items-center gap-4">
						<button className="bg-[#131316] rounded-lg p-3 border border-[#2A2A30]">
							<Sun size={iconSize} />
						</button>
						{/* trait vertical */}
						<div className="w-[2px] h-10 bg-[#2A2A30]"></div>
						<button className="bg-[#131316] rounded-lg p-3 border border-[#2A2A30]">
							<Bell size={iconSize} />
						</button>
						<button className="bg-[#131316] rounded-lg p-3 border border-[#2A2A30]">
							<Settings size={iconSize} />
						</button>
					</div>
				</header>
				{/* border arrondi top left */}

				<article className="w-[calc(100%)] min-h-0 flex-1 bg-[#17171C] border-t border-l border-[#2C2C32] rounded-tl-2xl p-4">
					{children}
				</article>
			</section>
		</main>
	);
}
