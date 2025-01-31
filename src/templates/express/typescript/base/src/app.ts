import express, { Application } from 'express';
import bodyParser from 'body-parser';
import { config } from "dotenv";
import expressWinston from "express-winston";
import winston from "winston";
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/route-name';
import errorMiddleware from './middleware/error';

const app: Application = express();

// env config
config({
  path: "./.env",
});

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.cli()
    ),
    meta: true,
    expressFormat: true,
    colorize: true,
  })
);

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handler
app.use(errorMiddleware)

export default app;
