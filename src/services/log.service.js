import fs from "fs";
import path from "path";

const logDir = path.resolve("src/logs");
const LogService = {
    async getLogList() {
        const files = await fs.promises.readdir(logDir);

        const logs = files
            .filter(f => /\.log(\.\d+)?$/.test(f))
            .map(f => {
                const filePath = path.join(logDir, f);
                const stat = fs.statSync(filePath);
                const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

                return {
                    name: f,
                    size: `${sizeMB} MB`,
                    modified: stat.mtime.toISOString(),
                };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));

        return logs;
    },
};

export default LogService;