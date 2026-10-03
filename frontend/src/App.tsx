import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { Toaster } from 'sonner';

export default function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" richColors />
            <AppRoutes />
        </BrowserRouter>
    );
}
