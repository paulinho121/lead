
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

// In a real app, this should be in the DB. 
// For now, we'll keep the admin email here but centralize the logic.
const ADMIN_EMAIL = 'paulofernandoautomacao@gmail.com';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        }).catch(err => {
            console.error("Auth session error:", err);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const isAdmin = user?.email === ADMIN_EMAIL;
    const role = isAdmin ? 'admin' : 'vendedor';

    return { user, isAuthenticated, isLoading, isAdmin, role };
};
