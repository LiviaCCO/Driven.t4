import { Booking } from '@prisma/client';
import { notFoundError} from '@/errors';
import hotelsRepository  from '@/repositories/hotels-repository';
import bookingRepository from '@/repositories/booking-repository';
import {paymentRequiredError} from '@/errors/payment-error';
import { requestError } from '@/errors/request-error';
import { BookingParams } from '@/protocols';
    

async function getBooking(userId: number): Promise<BookingParams> {
    const booking = await bookingRepository.getBookingByUserId(userId);
    // Usuário não tem reserva: Deve retornar status code `404`
    if (!booking) throw notFoundError(); 
    return booking;
}
    
async function getBookingId(userId: number, id: number) {
        const ticket = await ticketService.getTicketByUserId(userId);
        //- Não existe (inscrição, ticket ou hotel): `404 (not found)`
        if (!ticket || !ticket.enrollmentId || !id) throw notFoundError(); //404
        //- Ticket não foi pago, é remoto ou não inclui hotel: `402 (payment required)`
        const ticket2 = await ticketsRepository.findTicketByEnrollmentId(ticket.enrollmentId);
        if (ticket2.status === "RESERVED" || ticket2.TicketType.isRemote === true || ticket2.TicketType.includesHotel === false) throw paymentRequiredError(); //402
        
        const hotel = await hotelsRepository.findHotelId(id);
        if (!hotel) throw notFoundError();
        
        return hotel;
    }
    
    const hotelsService = {
        getHotels,
        getHotelId,
      };
      
      export default hotelsService;





