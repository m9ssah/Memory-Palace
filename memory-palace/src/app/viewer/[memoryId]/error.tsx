"use client";

type ViewerErrorProps = {
	error: Error;
	reset: () => void;
};

export default function ViewerError({ error, reset }: ViewerErrorProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-stone-100">
			<div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
				<p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Viewer Error</p>
				<h2 className="mt-3 text-3xl font-semibold">This memory does not exist.</h2>
				<p className="mt-4 leading-7 text-stone-300">{error.message}</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-stone-100 transition-colors hover:bg-white/[0.1]"
				>
					Retry
				</button>
			</div>
		</div>
	);
}
