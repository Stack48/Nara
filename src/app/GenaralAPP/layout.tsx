import AppNav from "@/components/appNav/appNav";

export default function GeneralAppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AppNav>{children}</AppNav>;
}
