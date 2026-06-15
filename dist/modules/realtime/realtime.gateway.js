"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeGateway = exports.RealtimeGateway = void 0;
const token_service_1 = require("./../../common/services/token.service");
const socket_io_1 = require("socket.io");
const services_1 = require("../../common/services");
const chat_1 = require("../chat");
class RealtimeGateway {
    io;
    tokenService;
    redisService;
    constructor() {
        this.tokenService = new token_service_1.TokenService();
        this.redisService = services_1.redisService;
    }
    authentication = async (socket, next) => {
        try {
            const { user, decoded } = await this.tokenService.decodeToken({
                token: socket.handshake.auth.authorization ||
                    socket.handshake.headers.authorization,
            });
            socket.data = { user, decoded };
            await this.redisService.addSocket(user._id, socket.id);
            next();
        }
        catch (error) {
            next(error);
        }
    };
    initializeIo = (httpServer) => {
        this.io = new socket_io_1.Server(httpServer, {
            cors: { origin: "*" },
        });
        this.io.use(this.authentication);
        this.io.on("connection", async (socket) => {
            chat_1.chatGateway.registerEvents(socket, this.io);
            socket.on("disconnect", async () => {
                await this.redisService.removeSocket(socket.data.user._id, socket.id);
                const connections = (await this.redisService.getSockets(socket.data.user._id)) || [];
                if (connections.length < 1) {
                    this.io.emit("offline_user", { userId: socket.data.user._id });
                }
            });
        });
    };
    getIo() {
        return this.io;
    }
}
exports.RealtimeGateway = RealtimeGateway;
exports.realtimeGateway = new RealtimeGateway();
