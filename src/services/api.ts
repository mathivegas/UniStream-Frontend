// frontend/src/services/api.ts
import { API_BASE_URL } from '../config/environment';

const API_URL = `${API_BASE_URL}/api`;

// Helper general para requests HTTP
const api = {
    get: async (endpoint: string) => {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return { data };
    },
    post: async (endpoint: string, body: any) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return { data };
    },
};

export default api;

// Tipos de respuesta
export interface LoginResponse {
    message: string;
    user: {
        id: string;
        name: string;
        email: string;
        type: string;
        coins?: number;
        points?: number;
        level?: number;
    };
    token: string;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    coins: number;
    points: number;
    level: number;
    avatar: string;
    bio: string;
}

export interface GiftType {
    id: string;
    name: string;
    emoji: string;
    cost: number;
    points: number;
}

const typeToApiType = (type: 'espectador' | 'streamer'): 'spectator' | 'streamer' => {
    return type === 'espectador' ? 'spectator' : 'streamer';
};

// ========== AUTENTICACIÓN ==========
export const authAPI = {
    register: async (name: string, email: string, password: string, type: "espectador" | "streamer"): Promise<LoginResponse> => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, type: typeToApiType(type) }),
        });
        return response.json();
    },

    login: async (email: string, password: string, type: "espectador" | "streamer"): Promise<LoginResponse> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, type: typeToApiType(type) }),
        });
        return response.json();
    },
};

// ========== USUARIOS ==========
export const userAPI = {
    getUser: async (id: string, token: string): Promise<UserData> => {
        const response = await fetch(`${API_URL}/spectators/${id}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    },

    getStreamer: async (id: string): Promise<UserData> => {
        const response = await fetch(`${API_URL}/streamers/${id}`);
        return response.json();
    },

    getAllSpectators: async (): Promise<UserData[]> => {
        const response = await fetch(`${API_URL}/spectators`);
        return response.json();
    },

    getAllStreamers: async (): Promise<UserData[]> => {
        const response = await fetch(`${API_URL}/streamers`);
        return response.json();
    },

    updateProfile: async (id: string, data: { name?: string; bio?: string; avatar?: string }, token: string) => {
        const response = await fetch(`${API_URL}/spectators/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },
};

// ========== REGALOS ==========
export const giftAPI = {
    getGifts: async (): Promise<GiftType[]> => {
        const response = await fetch(`${API_URL}/gifts`);
        return response.json();
    },

    sendGift: async (receiverId: string, giftId: string, amount: number, token: string) => {
        const response = await fetch(`${API_URL}/gifts/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ receiverId, giftId, amount }),
        });
        return response.json();
    },

    getGiftHistory: async (userId: string, token: string) => {
        const response = await fetch(`${API_URL}/gifts/history/${userId}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    },
};

// ========== MONEDAS ==========
export const coinsAPI = {
    getBalance: async (id: string): Promise<{ id: string; coins: number; points: number; level: number }> => {
        const response = await fetch(`${API_URL}/coins/balance/${id}`);
        return response.json();
    },

    purchaseCoins: async (coinAmount: number, price: number, token: string) => {
        const response = await fetch(`${API_URL}/coins/purchase`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ coinAmount, price }),
        });
        return response.json();
    },
};

// ========== STREAMERS ==========
export const streamerAPI = {
    startStream: async (token: string) => {
        const response = await fetch(`${API_URL}/streams/start`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
        });
        return response.json();
    },

    endStream: async (hoursStreamed: number, token: string) => {
        const response = await fetch(`${API_URL}/streams/end`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ hoursStreamed }),
        });
        return response.json();
    },

    getStats: async (id: string) => {
        const response = await fetch(`${API_URL}/streamers/${id}/stats`);
        return response.json();
    },

    getLiveStreamers: async () => {
        const response = await fetch(`${API_URL}/streamers/live`);
        return response.json();
    },
};
