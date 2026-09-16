import dotenv from "dotenv";
dotenv.config();

for (const variableName of ["MONGO_URI", "JWT_SECRET", "ADMIN_SECRET"]) {
	if (!process.env[variableName] || process.env[variableName].length < 16) {
		throw new Error(`${variableName} must be configured with a rotated value`);
	}
}

for (const variableName of ["RESET_URL", "RESEND_API_KEY"]) {
	if (!process.env[variableName]) {
		throw new Error(`${variableName} must be configured for password recovery`);
	}
}

await import("./server.js");
