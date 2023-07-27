import { Hotel, Room } from '@prisma/client';
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
/*   
    {
    	"id": bookingId,
    	"Room": {
    			// dados do quarto
    		}
    }

async function findHotelId(hotelId: number) {
    /* const rooms = prisma.room.findFirst({
        where: {hotelId},
    }); */
    return prisma.hotel.findFirst({
      where: { id: hotelId },
      include: {
        Rooms: true
      },
    });
}

export default {
    getBookingByUserId,
    
};
  

