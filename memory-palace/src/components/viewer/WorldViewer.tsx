import Link from "next/link";
import type { Memory } from "@/types";

type WorldViewerProps = {
	memory: Memory;
};

export default function WorldViewer({ memory }: WorldViewerProps) {
	return (
		<div className="min-h-screen bg-[#0d0a1e] text-purple-100">
			<header className="flex items-center justify-between border-b border-purple-300/15 bg-[rgba(13,10,30,0.85)] px-6 py-4 backdrop-blur-xl">
				<div>
					<p className="text-[10px] uppercase tracking-[0.35em] text-purple-300/55">Memory Viewer</p>
					<h1 className="mt-1 text-2xl font-semibold text-purple-100/90">{memory.title}</h1>
				</div>
				<Link
					href="/lobby"
					className="rounded-full border border-purple-300/25 px-4 py-2 text-sm text-purple-300/60 transition-colors hover:border-purple-300/60 hover:text-purple-100"
				>
					← Back to lobby
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
					<div className="w-full rounded-[2rem] border border-purple-300/15 bg-white/[0.03] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
						<p className="text-[10px] uppercase tracking-[0.35em] text-purple-300/55">World Pending</p>
						<h2 className="mt-3 text-3xl font-semibold text-purple-100/90">This memory is not ready to view yet.</h2>
						<p className="mt-4 leading-7 text-purple-100/65">
							The lobby routing is active, but this memory does not yet have a generated viewer URL. Once World Labs returns the Gaussian splat world, attach its marble URL to this memory and the viewer will render here automatically.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
