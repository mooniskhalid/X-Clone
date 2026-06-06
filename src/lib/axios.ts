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
    getPosts: async () => {
        const { data } = await axios.get("/api/get-posts");
        return data;
    },
    createPost: async (content: string) => {
        const { data } = await axios.post("/api/create-post", { content });
        return data;
    },
    likePost: async (postId: string) => {
        const { data } = await axios.post(`/api/like-post/${postId}`);
        return data;
    },
};


export default api;