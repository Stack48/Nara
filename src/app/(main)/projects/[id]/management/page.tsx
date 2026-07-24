import type { ReactElement } from "react";
import ManagementScreen from "@/components/management/ManagementScreen"; // ton chemin réel

export default function ProjectManagementPage(): ReactElement {
	return (
		<div className="h-screen">
			<ManagementScreen />
		</div>
	);
}