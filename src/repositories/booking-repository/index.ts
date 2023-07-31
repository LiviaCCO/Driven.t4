import { Booking, Hotel, Room } from '@prisma/client';
import { prisma } from '@/config';
import { BookingParams } from '@/protocols';

async function getBookingByUserId(userId:number){
    console.log("entrou")
    const booking = await prisma.booking.findFirst({
        where: { userId },
        include: {
            Room: true }
    });
    return booking
}

// listar a reserva
async function getRoom(roomId: number) {
    return prisma.room.findFirst({
        where: { id: roomId },
        include: {
            Booking: true,
        }
    })
};

async function createBooking(roomId: number, userId: number):Promise <Booking> {
    return prisma.booking.create({
          data: {
            roomId,
            userId
        }
});
}

async function updateBooking(bookingId:number, roomId: number):Promise <Booking> {
    return prisma.booking.update({
        where: {
            id: bookingId,
          },
          data: {
            roomId
          },
});
}

export default {
    getBookingByUserId,
    getRoom,
    createBooking,
    updateBooking,
};
  

