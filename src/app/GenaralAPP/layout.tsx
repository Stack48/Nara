import AppNav from "@/components/appNav/appNav";
import { Layout } from "@/components/nav/Layout";
export default function GeneralAppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AppNav>{children}</AppNav>;
	// return <Layout>{children}</Layout>;
}
