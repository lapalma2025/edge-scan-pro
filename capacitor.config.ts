import { CapacitorConfig } from "@capacitor/core";

const config: CapacitorConfig = {
	appId: "com.lovable.edgescanprod",
	appName: "edge-scan-pro",
	webDir: "dist",
	server: {
		url: "http://192.168.0.193:5173",
		cleartext: true,
	},
	plugins: {
		Camera: {
			permissions: ["camera", "photos"],
		},
		Filesystem: {
			permissions: ["camera", "photos"],
		},
	},
};

export default config;
