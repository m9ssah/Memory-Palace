import Link from "next/link";
import type { Memory } from "@/types";

type WorldViewerProps = {
	memory: Memory;
};

export default function WorldViewer({ memory }: WorldViewerProps) {
	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,#2c2217_0%,#0d0d0d_55%,#050505_100%)] text-stone-100">
			<header className="flex items-center justify-between border-b border-white/10 bg-black/30 px-6 py-4 backdrop-blur-xl">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Memory Viewer</p>
					<h1 className="mt-1 text-2xl font-semibold">{memory.title}</h1>
				</div>
				<Link
					href="/lobby"
					className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-stone-100 transition-colors hover:bg-white/[0.08]"
				>
					Back to lobby
				</Link>
			</header>

			{memory.marbleUrl ? (
				<div className="h-[calc(100vh-5.5rem)] w-full">
					<iframe
						title={`${memory.title} world viewer`}
						src={memory.marbleUrl}
						className="h-full w-full"
						allow="fullscreen; xr-spatial-tracking"
						allowFullScreen
					/>
				</div>
			) : (
				<div className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-3xl items-center px-6 py-16">
					<div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
						<p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">World Pending</p>
						<h2 className="mt-3 text-3xl font-semibold text-stone-50">This memory is not ready to view yet.</h2>
						<p className="mt-4 leading-7 text-stone-300">
							The lobby routing is active, but this memory does not yet have a generated viewer URL. Once World Labs returns the Gaussian splat world, attach its marble URL to this memory and the viewer will render here automatically.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
