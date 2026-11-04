import express from 'express';
import cors from 'cors';
import todoRoutes from "./presentation/http/routes/TodoRoutes";

const app = express();
app.use(
    cors({
        origin: ['http://localhost:5173','http://localhost:4173'],
    }),
);

app.use(express.json());


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'server is running' });
});

app.use('/todos', todoRoutes);

export default app;