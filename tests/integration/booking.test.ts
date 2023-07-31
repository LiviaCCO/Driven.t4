import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { createEnrollmentWithAddress, createUser, createTicketType, createTicketTypeRemote,createTicketTypeWithOutHotel, createTicketTypeWithHotel, createTicket, createHotel, createPayment, createRoomWithHotelId, createRoomWithHotelIdAndCapacity0 } from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import app, { init } from '@/app';
import { createBooking } from '../factories/booking-factory';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);


//Booking service: Unitários e integração
//Booking controller: Integração
// Todas as rotas sao autenticadas

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  describe('when token is valid', () => {
    // Dando tudo certo, responder com reserva
    it('should respond with status 200 and with booking', async () => {
      // construção de cenario
      const user = await createUser(); 
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
          id: booking.id,
          Room: {
            id: room.id,
            name: room.name,
            hotelId: room.hotelId,
            capacity: room.capacity,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt
          }
        });
    }); 
    // Retornar 404 quando usuario não tem reserva
    it('should respond with 404 if user havent a booking ', async () => {
      // construção de cenario
      const user = await createUser(); 
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      await createRoomWithHotelId(hotel.id);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });    
  });
}); 

describe('POST /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.post('/booking');
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe('when token is valid', () => {
      // Dando tudo certo, responder com reserva
      it('should respond with status 200 and with bookingId', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(user.id, room.id);
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId: room.id});
  
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual({bookingId: booking.id});
      }); 
      // 404 para  roomId não existente
      it('should respond with status 404 when roomId doesnt exist', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        await createHotel();
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId: 0});
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      }); 
      // 403 para roomId sem vaga
      it('should respond with status 403 when roomId has not capacity', async () => {
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelIdAndCapacity0(hotel.id);
  
        const response = await server
          .post('/booking')
          .set('Authorization', `Bearer ${token}`)
          .send({ roomId: room.id });
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
      // 403 quando SEM usuarios ingresso presencial
      it('should respond with status 403 when ticket is remote', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
          
        const response = await server
          .post('/booking')
          .set('Authorization', `Bearer ${token}`)
          .send({ roomId: room.id });
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
  
      // 403 quando usuarios sem hospedagem

      it('should respond with status 403 when ticket has no hotel', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithOutHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
          
        const response = await server
          .post('/booking')
          .set('Authorization', `Bearer ${token}`)
          .send({ roomId: room.id });
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      // 403 quando ticket não pago

      it('should respond with status 403 when ticket is remote', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
          
        const response = await server
          .post('/booking')
          .set('Authorization', `Bearer ${token}`)
          .send({ roomId: room.id });
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
});
}); 

describe('PUT /:bookingId', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/booking/:bookingId');
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();
        const response = await server.get('/booking/:bookingId').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    
    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
        const response = await server.get('/booking/:bookingId').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe('when token is valid', () => {
    // Dando tudo certo, responder com reserva
    it('should respond with status 200 and with bookingId', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const hotel2 = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const room2 = await createRoomWithHotelId(hotel2.id);
        const booking = await createBooking(user.id, room.id);
        const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({roomId: room2.id});
  
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual(
          {
            bookingId: booking.id
          },
        );
    }); 
    // 404 para roomId não existente
    it('should respond with status 404 when roomId doesnt exist', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(user.id, room.id);
        const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({roomId: 0});
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);
    }); 
    // 403 para roomId sem vaga 
    it('should respond with status 403 when no vacancy', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const hotel2 = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const room2 = await createRoomWithHotelIdAndCapacity0(hotel2.id);
        const booking = await createBooking(user.id, room.id);
        const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({roomId: room2.id});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
    }); 
    //403
    // troca apenas se possuem reserva
    it('should respond with status 403 when no booking', async () => {
        // construção de cenario
        const user = await createUser(); 
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        //const bookingId: string = null;
        const response = await server.put(`/booking/10000000000000000000`).set('Authorization', `Bearer ${token}`).send({roomId: room.id});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
    }); 
    });
});