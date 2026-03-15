import Spinner from "@/components/ui/Spinner";

export default function ViewerLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0d0a1e] text-purple-100">
			<div className="flex flex-col items-center gap-4">
				<Spinner className="h-10 w-10 border-purple-300/20 border-t-purple-300" />
				<div className="text-[12px] italic tracking-[0.35em] text-purple-300/60">Entering memory...</div>
			</div>
		</div>
	);
}
