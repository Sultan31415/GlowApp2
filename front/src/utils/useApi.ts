import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";

export const useApi = () => {
    const { getToken } = useAuth();

    const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const token = await getToken();
        const defaultOptions: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        };

        const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...((defaultOptions.headers as Record<string, string>) || {}),
                ...((options.headers as Record<string, string>) || {}),
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (response.status === 429) {
                throw new Error("Daily quota exceeded");
            }
            // Create a custom error with response status for better error handling
            const error = new Error(errorData?.detail || "An error occurred") as Error & { status?: number, response?: { status: number } };
            error.status = response.status;
            error.response = { status: response.status };
            throw error;
        }

        return response.json();
    }, [getToken]); // Only recreate if getToken changes

    return { makeRequest };
};