// construção de cenario
    //usuario
    // filmes
    //alugueis



import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { createEnrollmentWithAddress, createUser, createTicketType, createTicket, createHotel, createPayment, createSpecificTicketType, createRoom, createRoomWithHotelId } from '../factories';
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
/* 
.get('/', getBooking)
.post('/', postBooking)
.put('/:bookingId', putBooking); 
*/

///GET:
    // Retornar 200  quando sucesso
    // Retornar 404 quando usuario não tem reserva

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
      //exigências
      const user = await createUser(); 
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createSpecificTicketType(false, true);
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: booking.id,
          userId: booking.userId,
          roomId: booking.roomId,
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString(),
        },
      ]);
    }); 
    // Retornar 404 quando usuario não tem reserva
    it('should respond with 404 if user havent a booking ', async () => {
      //exigências
      const user = await createUser(); 
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createSpecificTicketType(false, true);
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

//POST:
    //403 quando fora de: Apenas usuarios com ingresso presencial, hospedagem e pago podem fazer reservas
    // 200 para sucesso
    // 404 para roomId não existente
    // 403 para roomId sem vaga

//PUT:
    //403
    // troca apenas se possuem reserva
    // troca apenas para quartos livres

    //200 para sucesso
    // 404 para roomId não existente
    // 403 para roomId sem vaga 




describe('POST /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
      const response = await server.post('/tickets');
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();
  
      const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
      const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe('when token is valid', () => {
      it('should respond with status 400 when ticketTypeId is not present in body', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
        await createTicketType();
  
        const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`).send({});
  
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });
  
      it('should respond with status 404 when user doesnt have enrollment yet', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const ticketType = await createTicketType();
  
        const response = await server
          .post('/tickets')
          .set('Authorization', `Bearer ${token}`)
          .send({ ticketTypeId: ticketType.id });
  
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });
  
      it('should respond with status 201 and with ticket data', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
  
        const response = await server
          .post('/tickets')
          .set('Authorization', `Bearer ${token}`)
          .send({ ticketTypeId: ticketType.id });
  
        expect(response.status).toEqual(httpStatus.CREATED);
        expect(response.body).toEqual({
          id: expect.any(Number),
          status: TicketStatus.RESERVED,
          ticketTypeId: ticketType.id,
          enrollmentId: enrollment.id,
          TicketType: {
            id: ticketType.id,
            name: ticketType.name,
            price: ticketType.price,
            isRemote: ticketType.isRemote,
            includesHotel: ticketType.includesHotel,
            createdAt: ticketType.createdAt.toISOString(),
            updatedAt: ticketType.updatedAt.toISOString(),
          },
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
  
      it('should insert a new ticket in the database', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
  
        const beforeCount = await prisma.ticket.count();
  
        await server.post('/tickets').set('Authorization', `Bearer ${token}`).send({ ticketTypeId: ticketType.id });
  
        const afterCount = await prisma.ticket.count();
  
        expect(beforeCount).toEqual(0);
        expect(afterCount).toEqual(1);
      });
    });
});

describe('PUT /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
      const response = await server.post('/tickets');
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();
  
      const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
      const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe('when token is valid', () => {
      it('should respond with status 400 when ticketTypeId is not present in body', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
        await createTicketType();
  
        const response = await server.post('/tickets').set('Authorization', `Bearer ${token}`).send({});
  
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });
  
      it('should respond with status 404 when user doesnt have enrollment yet', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const ticketType = await createTicketType();
  
        const response = await server
          .post('/tickets')
          .set('Authorization', `Bearer ${token}`)
          .send({ ticketTypeId: ticketType.id });
  
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });
  
      it('should respond with status 201 and with ticket data', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
  
        const response = await server
          .post('/tickets')
          .set('Authorization', `Bearer ${token}`)
          .send({ ticketTypeId: ticketType.id });
  
        expect(response.status).toEqual(httpStatus.CREATED);
        expect(response.body).toEqual({
          id: expect.any(Number),
          status: TicketStatus.RESERVED,
          ticketTypeId: ticketType.id,
          enrollmentId: enrollment.id,
          TicketType: {
            id: ticketType.id,
            name: ticketType.name,
            price: ticketType.price,
            isRemote: ticketType.isRemote,
            includesHotel: ticketType.includesHotel,
            createdAt: ticketType.createdAt.toISOString(),
            updatedAt: ticketType.updatedAt.toISOString(),
          },
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
  
      it('should insert a new ticket in the database', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
        const ticketType = await createTicketType();
  
        const beforeCount = await prisma.ticket.count();
  
        await server.post('/tickets').set('Authorization', `Bearer ${token}`).send({ ticketTypeId: ticketType.id });
  
        const afterCount = await prisma.ticket.count();
  
        expect(beforeCount).toEqual(0);
        expect(afterCount).toEqual(1);
      });
    });
});