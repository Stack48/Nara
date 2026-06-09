import { Layout } from "@/components/nav/Layout";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Layout>{children}</Layout>;
}
