import { Server } from "socket.io";
import jwtUitls from '../../utils/jwt.util.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        path: "/realtime-phan-anh",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket"],
    });


    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("Thiếu token xác thực"));

            let decoded = jwtUitls.verifyAccessToken(token);
            socket.user = decoded;
            next();
        } catch (err) {
            console.error("❌ Socket auth failed:", err.message);
            next(new Error("Token không hợp lệ"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(`user_${socket.user.userId}`);

        socket.on("disconnect", () => {
        });
    });

    return io;
}

export const getIO = () => {
    if (!io) throw new Error("Socket.IO chưa được init");
    return io;
}
