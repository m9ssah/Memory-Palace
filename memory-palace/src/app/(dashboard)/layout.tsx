import Link from "next/link";

const navigation = [
	{ href: "/lobby", label: "Lobby" },
	{ href: "/progress", label: "Progress" },
];

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#1b1712_0%,#0f0f10_40%,#080808_100%)] text-stone-100">
			<header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<div>
						<Link href="/lobby" className="text-lg font-semibold tracking-[0.12em] text-amber-200 uppercase">
							Memory Palace
						</Link>
						<p className="mt-1 text-sm text-stone-400">Immersive spaces for memory recall.</p>
					</div>

					<nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
						{navigation.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="rounded-full px-4 py-2 text-sm text-stone-200 transition-colors hover:bg-white/10"
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
		</div>
	);
}
