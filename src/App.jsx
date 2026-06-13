import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { Coffee } from 'lucide-react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import AddBrew from '@/pages/AddBrew';
import Records from '@/pages/Records';
import BrewDetail from '@/pages/BrewDetail';
import EditBrew from '@/pages/EditBrew';
import Badges from '@/pages/Badges';
import CommunityRecipes from '@/pages/CommunityRecipes';
import MasterProfiles from '@/pages/MasterProfiles';
import Inventory from '@/pages/Inventory';

const AuthenticatedApp = () => {
    const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-brew-cream">
                <div className="text-center text-brew-green">
                    <Coffee size={48} className="mx-auto mb-4 opacity-50" />
                    <div className="w-8 h-8 border-4 border-brew-green/30 border-t-brew-green rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    if (authError?.type === 'user_not_registered') {
        return <UserNotRegisteredError />;
    }

    return (
        <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-brew" element={<AddBrew />} />
                <Route path="/records" element={<Records />} />
                <Route path="/community" element={<CommunityRecipes />} />
                <Route path="/brew/:id" element={<BrewDetail />} />
                <Route path="/edit-brew/:id" element={<EditBrew />} />
                <Route path="/badges" element={<Badges />} />
                <Route path="/profiles" element={<MasterProfiles />} />
                <Route path="/inventory" element={<Inventory />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

function App() {
    return (
        <GoogleReCaptchaProvider reCaptchaKey="6Le9sBctAAAAAGRilAg6Hd_5WdaA90BGAEmpE0QD">
            <AuthProvider>
                <QueryClientProvider client={queryClientInstance}>
                    <Router>
                        <AuthenticatedApp />
                    </Router>
                    <Toaster />
                </QueryClientProvider>
            </AuthProvider>
        </GoogleReCaptchaProvider>
    );
}

export default App;