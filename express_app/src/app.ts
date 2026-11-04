import express from 'express';
import cors from 'cors';
import todoRoutes from "./presentation/http/routes/TodoRoutes";

const app = express();
app.use(cors());

app.use(express.json());


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'server is running' });
});

app.use('/todos', todoRoutes);

export default app;