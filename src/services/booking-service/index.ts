import { Booking } from '@prisma/client';
import { notFoundError} from '@/errors';
import bookingRepository from '@/repositories/booking-repository';
import { requestError } from '@/errors/request-error';
import { BookingParams } from '@/protocols';
import { forbiddenError } from '@/errors/forbidden-error';
import ticketsRepository from '@/repositories/tickets-repository';
import ticketService from '../tickets-service';
    

async function getBooking(userId: number) {
    const booking = await bookingRepository.getBookingByUserId(userId);
    // Usuário não tem reserva: Deve retornar status code `404`
    if (!booking) throw notFoundError(); 
    return booking;
}
    
async function postBooking(userId: number, roomId: number) {
//`roomId` não existente: Deve retornar status code `404`.
    const room = await bookingRepository.getRoom(roomId);
    if (!room) throw notFoundError();
//`roomId` sem vaga: Deve retornar status code `403`.
    if (room.Booking.length === room.capacity) throw forbiddenError();
// Fora da regra de negócio: Deve retornar status code `403`.
// Regra de negócio: 
// Apenas usuários com ingresso do tipo presencial, com hospedagem e pago podem fazer reservas.
    const ticket = await ticketService.getTicketByUserId(userId);
    const ticketType = await ticketsRepository.findTickeWithTypeById(ticket.id);
    if(ticket.status !== "PAID" || ticketType.TicketType.isRemote !== false) throw forbiddenError();
    const booking = await bookingRepository.createBooking(roomId, userId);
//**Sucesso**: Deve retornar status code `200` com `bookingId` 
    return booking.id;
}

async function putBooking(userId: number, roomId: number){
// `roomId` não existente: Deve retornar status code `404`.
    const room = await bookingRepository.getRoom(roomId);
    if (!room) throw notFoundError();
// `roomId` sem vaga: Deve retornar status code `403`.   
// Fora da regra de negócio: Deve retornar status code `403`. 
// A troca pode ser efetuada para usuários que possuem reservas.
    const booking = await bookingRepository.getBookingByUserId(userId);     
    if (room.Booking.length === room.capacity || !booking) throw forbiddenError();

    const bookingUpdate = await bookingRepository.updateBooking(booking.id, roomId);
    //**Sucesso**: Deve retornar status code `200` com `bookingId` 
    return bookingUpdate.id;  
}

    
const bookingService = {
    getBooking,
    postBooking,
    putBooking,
};
      
export default bookingService;





