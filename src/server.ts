import express,  { Request , Response} from "express";
import identityRoutes from './routes/identityRoutes';
import { errorHandler } from './utils/errorHandler';

const app = express();

app.use(express.json())

app.use('/api', identityRoutes);
app.use(errorHandler);
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });     
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started on port 3000");
});