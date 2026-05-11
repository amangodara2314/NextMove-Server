import { io } from "../../app";
import redis from "../../config/redis";
import { REDIS_KEYS } from "../../constants/keys";
import gameRepository from "../../modules/game/game.repository";

const handleReservationAck = async (socket) => {

    socket.on("MATCH_ACK",(data)=>{
        const reservationId = data.reservationId
        const user = socket.user
        const key = REDIS_KEYS.reservation(reservationId)
        const reservation = await redis.hgetall(key)

        if (!reservation) {
            return
        }

        if (reservation.player1 == user.userId) {
            await redis.hset(key,{
                player1Ack: "true"
            })
        }

        
        if (reservation.player2 == user.userId) {
            await redis.hset(key,{
                player2Ack: "true"
            })
        }

        // reload latest state 
        const updated = await redis.hgetall(key)

        if (updated.player1Ack === "true" && updated.player2Ack === "true") {
            // if both players are active create their game
            function pick0Or1() {
                return Math.floor(Math.random() * 2);
            }

            const opponentId = updated.player1 === user.userId ? updated.player2 : updated.player1 
            const userColor = pick0Or1() === 0 ? "WHITE" : "BLACK"  
            const game = await gameRepository.createGame({
                white: userColor === "WHITE" ? user.userId : opponentId,
                black : userColor === "BLACK" ? user.userId : opponentId
            })

            // add both players to a socket room with the game id so they can receive game updates
            const opponentSocketId = await redis.get(REDIS_KEYS.userSocket(opponentId))
            const userSocketId = await redis.get(REDIS_KEYS.userSocket(user.userId))

            const userSocket = io.sockets.sockets.get(userSocketId)
            const opponentSocket = io.sockets.sockets.get(opponentSocketId)
            if(userSocket) {
                userSocket.join(game.id)
            }
            if(opponentSocket) {
                opponentSocket.join(game.id)
            }

            io.to(game.id).emit("MATCH_READY",{
                gameId: game.id,
                white: game.white,
                black: game.black
            })

            await redis.del(key)
        }
    })
};
