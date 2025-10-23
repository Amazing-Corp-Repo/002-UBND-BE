import { Server } from "socket.io";

let io;

export function initSocket(server) {
    // ------------------------------Cấu hình Socket.IO server
    // io = new Server(server, {
    //     cors: {
    //         origin: "*",
    //         methods: ["GET", "POST"],
    //         credentials: true
    //     },
    //     path: "/projects/ragdb/socket.io"
    // });

    //  ----------------------------Cấu hình Socket.IO Localhost (không có path)
    io = new Server(server, {
        cors: {
            origin: "*",         
            methods: ["GET", "POST"],
            credentials: true
        },
    });

    io.on("connection", (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // đăng ký events theo domain

        socket.on("disconnect", () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO() {
    if (!io) throw new Error("Socket.IO chưa được init");
    return io;
}
