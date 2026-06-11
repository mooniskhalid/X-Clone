"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


export default function QuerryProvider({ children }: any) {
    // [ENDRET] staleTime: data regnes som fersk i 1 minutt → ingen re-fetch ved tilbake-navigering
    // [ENDRET] refetchOnWindowFocus: false → hindrer unødvendig re-fetch når vinduet får fokus
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60,
                refetchOnWindowFocus: false,
            },
        },
    }));
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}