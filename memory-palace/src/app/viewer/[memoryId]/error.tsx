"use client";

import { useRouter } from "next/navigation";

type ViewerErrorProps = {
	error: Error;
	reset: () => void;
};

export default function ViewerError({ error, reset }: ViewerErrorProps) {
	const router = useRouter();

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0d0a1e] px-6 text-purple-100">
			<div className="max-w-xl rounded-[2rem] border border-purple-300/15 bg-white/[0.03] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
				<p className="text-xs uppercase tracking-[0.35em] text-purple-300/55">Viewer Error</p>
				<h2 className="mt-3 text-3xl font-semibold">This memory could not be opened.</h2>
				<p className="mt-4 leading-7 text-purple-100/65">{error.message}</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 rounded-full border border-purple-300/25 bg-white/[0.04] px-4 py-2 text-sm text-purple-100 transition-colors hover:border-purple-300/60 hover:bg-white/[0.08]"
				>
					Retry
				</button>
				<button
					type="button"
					onClick={() => router.push("/lobby")}
					className="ml-3 mt-6 rounded-full border border-purple-300/20 px-4 py-2 text-sm text-purple-300/70 transition-colors hover:border-purple-300/50 hover:text-purple-100"
				>
					Back to lobby
				</button>
			</div>
		</div>
	);
}
