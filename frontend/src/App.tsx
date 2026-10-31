import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster position="top-right" richColors />
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
