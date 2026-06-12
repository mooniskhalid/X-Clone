import axios from "axios";

const api = {
    getCurrentUser: async () => {
        const { data } = await axios.get("/api/get-current-user");
        return data;
    },
    getUser: async (userId: string) => {
        const { data } = await axios.get(`/api/get-user/${userId}`);
        return data;
    },
    followUser: async (userId: string) => {
        const { data } = await axios.post(`/api/follow-user/${userId}`);
        return data;
    },
    // [ENDRET] Støtter feed-param og cursor-basert paginering
    getPosts: async (feed?: string, cursor?: string) => {
        const params: Record<string, string> = {};
        if (feed) params.feed = feed;
        if (cursor) params.cursor = cursor;
        const { data } = await axios.get("/api/get-posts", { params });
        return data as { posts: any[]; nextCursor: string | null };
    },
    // [NY] Støtter bilde (base64) i post
    createPost: async (content: string, image?: string | null) => {
        const { data } = await axios.post("/api/create-post", { content, image: image ?? null });
        return data;
    },
    likePost: async (postId: string) => {
        const { data } = await axios.post(`/api/like-post/${postId}`);
        return data;
    },
    // [NY] Toggle repost
    repost: async (postId: string) => {
        const { data } = await axios.post(`/api/repost/${postId}`);
        return data;
    },
    // [NY] Quote repost
    quotePost: async (postId: string, content: string) => {
        const { data } = await axios.post(`/api/quote-post/${postId}`, { content });
        return data;
    },
    getUserPosts: async (userId: string, cursor?: string) => {
        const params: Record<string, string> = {};
        if (cursor) params.cursor = cursor;
        const { data } = await axios.get(`/api/get-user-posts/${userId}`, { params });
        return data as { posts: any[]; nextCursor: string | null };
    },
    getPost: async (postId: string) => {
        const { data } = await axios.get(`/api/get-post/${postId}`);
        return data;
    },
    // [NY] Sender oppdaterte profildata til PATCH /api/update-profile
    updateProfile: async (profileData: {
        name?: string;
        bio?: string;
        email?: string;
        image?: string;
        banner?: string;
    }) => {
        const { data: res } = await axios.patch("/api/update-profile", profileData);
        return res;
    },
    deletePost: async (postId: string) => {
        const { data } = await axios.delete(`/api/delete-post/${postId}`);
        return data;
    },
    editPost: async (postId: string, content: string) => {
        const { data } = await axios.patch(`/api/edit-post/${postId}`, { content });
        return data;
    },
    deleteComment: async (commentId: string) => {
        const { data } = await axios.delete(`/api/delete-comment/${commentId}`);
        return data;
    },
    editComment: async (commentId: string, content: string) => {
        const { data } = await axios.patch(`/api/edit-comment/${commentId}`, { content });
        return data;
    },
    getLikedPosts: async (userId: string) => {
        const { data } = await axios.get(`/api/get-liked-posts/${userId}`);
        return data as any[];
    },
    getMediaPosts: async (userId: string) => {
        const { data } = await axios.get(`/api/get-media-posts/${userId}`);
        return data as any[];
    },
    getFollowers: async (userId: string) => {
        const { data } = await axios.get(`/api/get-followers/${userId}`);
        return data;
    },
    getFollowing: async (userId: string) => {
        const { data } = await axios.get(`/api/get-following/${userId}`);
        return data;
    },
    getComments: async (postId: string) => {
        const { data } = await axios.get(`/api/comment-post/${postId}`);
        return data;
    },
    createComment: async (postId: string, content: string) => {
        const { data } = await axios.post(`/api/comment-post/${postId}`, { content });
        return data;
    },
    // [NY] Varsler
    getNotifications: async () => {
        const { data } = await axios.get("/api/get-notifications");
        return data as { notifications: any[]; unreadCount: number };
    },
    markNotificationsRead: async () => {
        const { data } = await axios.post("/api/mark-notifications-read");
        return data;
    },
    // [NY] Sidebar-data
    getTrending: async () => {
        const { data } = await axios.get("/api/get-trending");
        return data as any[];
    },
    getWhoToFollow: async (limit?: number) => {
        const params = limit ? { limit } : {};
        const { data } = await axios.get("/api/get-who-to-follow", { params });
        return data as any[];
    },
    // [NY] Søk
    search: async (q: string) => {
        const { data } = await axios.get("/api/search", { params: { q } });
        return data as { posts: any[]; users: any[] };
    },
};

export default api;
