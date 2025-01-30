import app from "./app";
import { logger } from "./utils/winstonLogger";


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
});
