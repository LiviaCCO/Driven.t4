import { Booking, Hotel, Room } from '@prisma/client';
import { prisma } from '@/config';
import { BookingParams } from '@/protocols';

async function getBookingByUserId(userId:number){
    const booking = await prisma.booking.findFirst({
        where: { userId },
        include: {
            Room: true }
    });
    const bookingByUserId = {
        id: booking.id,
        Room: booking.Room
    }
    return bookingByUserId
}

// listar a reserva
/*  {
    	"id": bookingId,
    	"Room": {
    			// dados do quarto
    		}
    }*/
async function getRoom(roomId: number) {
    return prisma.room.findFirst({
        where: { id: roomId },
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
  

