import { notFoundError } from "@/errors"; 
import bookingRepository from "@/repositories/booking-repository";
import bookingService from "@/services/booking-service";
import { Room, Booking } from "@prisma/client";
import ticketsRepository from "@/repositories/tickets-repository";

describe("Booking Service Unit Tests", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  })

  describe("get booking tests", () => {
    it("should return booking", async () => {
    const mockBooking : Booking & { Room: Room[] }= {
        id: 1,
        userId: 1,
        roomId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        Room: [{
          id: 1,
          name: "Driven Hotel",
          capacity: 2,
          hotelId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]
      } 
      const resMockBooking = {
        id: 1,
        Room: {
          id: 1,
          name: "Driven Hotel",
          capacity: 2,
          hotelId: 1,
          createdAt: new Date(),
          updateAt: new Date(),
        }
      } 
      jest.spyOn(bookingRepository, "getBookingByUserId").mockResolvedValueOnce(mockBooking);
      const booking = await bookingService.getBooking(1);

      expect(booking).toEqual(resMockBooking);
      expect(booking).toHaveLength(1);
    });

    it("should return notFoundError when booking is not found", async () => {
      jest.spyOn(bookingRepository, "getBookingByUserId").mockResolvedValueOnce(null);
      const promise = bookingService.getBooking(1);
      expect(promise).rejects.toEqual(notFoundError("No result for this search!"))
    });
  })

  describe("create booking tests", () => {
    it("should throw an error when roomId does not exist", async () => {
      const userId = 1;
      const roomId = 1;
      jest.spyOn(bookingRepository, "getRoom").mockResolvedValueOnce(null);
      const promise = bookingService.postBooking(userId, roomId);
      expect(promise).rejects.toEqual({
        name: "NotFoundError",
        message: "User not found."
      })
    });

    it("should throw an error when roomId has no vacancy", async () => {
      const userId = 1;
      const roomId = 1;
      const room = {
        id: 1,
        name: "Driven Hotel",
        capacity: 0,
        hotelId: 1,
        createdAt: new Date(),
        updateAt: new Date(),
        Booking: [{}]
      }
      jest.spyOn(bookingRepository, "getRoom").mockResolvedValueOnce(room);
      const promise = bookingService.postBooking(userId, roomId);
      expect(promise).rejects.toEqual({
        name: "ForbiddenError",
        message: "Forbidden Error"
      })
    });

    it("should throw an error when roomId has no vacancy", async () => {
      const userId = 1;
      const roomId = 1;
      const room = {
        id: 1,
        name: "Driven Hotel",
        capacity: 0,
        hotelId: 1,
        createdAt: new Date(),
        updateAt: new Date(),
        Booking: [{}]
      }
      jest.spyOn(bookingRepository, "getRoom").mockResolvedValueOnce(room);
      const promise = bookingService.postBooking(userId, roomId);
      expect(promise).rejects.toEqual({
        name: "ForbiddenError",
        message: "Forbidden Error"
      })
    });

    it("should throw an error when ticket is remote", async () => {
      const userId = 1;
      const roomId = 1;
      const mockTicketType = {
        id: 1,
        TicketTypeId: "Driven Hotel",
        enrollmentId: 0,
        status: "PAID",
        createdAt: new Date(),
        updateAt: new Date(),
        TicketType: {
          id: 1,
          name: "Driven",
          price: 1000,
          isRemote: true,
          includesHotel: true,
          createdAt: new Date(),
          updateAt: new Date(),
        }
      }
      jest.spyOn(ticketsRepository, "findTickeWithTypeById").mockResolvedValueOnce(mockTicketType);
      const promise = bookingService.postBooking(userId, roomId);
      expect(promise).rejects.toEqual({
        name: "ForbiddenError",
        message: "Forbidden Error"
      })
    });

    it("should throw an error when ticket is no PAID", async () => {
      const userId = 1;
      const roomId = 1;
      const mockTicketType = {
        id: 1,
        TicketTypeId: "Driven Hotel",
        enrollmentId: 0,
        status: "RESERVED",
        createdAt: new Date(),
        updateAt: new Date(),
        TicketType: {
          id: 1,
          name: "Driven",
          price: 1000,
          isRemote: false,
          includesHotel: true,
          createdAt: new Date(),
          updateAt: new Date(),
        }
      }
      jest.spyOn(ticketsRepository, "findTickeWithTypeById").mockResolvedValueOnce(mockTicketType);
      const promise = bookingService.postBooking(userId, roomId);
      expect(promise).rejects.toEqual({
        name: "ForbiddenError",
        message: "Forbidden Error"
      })
    });

    it("should throw an error when ticket is no hotel", async () => {
      const userId = 1;
      const roomId = 1;
      const mockTicketType = {
        id: 1,
        TicketTypeId: "Driven Hotel",
        enrollmentId: 0,
        status: "PAID",
        createdAt: new Date(),
        updateAt: new Date(),
        TicketType: {
          id: 1,
          name: "Driven",
          price: 1000,
          isRemote: false,
          includesHotel: false,
          createdAt: new Date(),
          updateAt: new Date(),
        }
      }
      jest.spyOn(ticketsRepository, "findTickeWithTypeById").mockResolvedValueOnce(mockTicketType);
      const promise = bookingService.postBooking(userId, roomId);
      expect(promise).rejects.toEqual({
        name: "ForbiddenError",
        message: "Forbidden Error"
      })
    });

    it("should bookingId when ok", async () => {
      const userId = 1;
      const roomId = 1;
      const mockTicketType = {
        id: 1,
        TicketTypeId: "Driven Hotel",
        enrollmentId: 0,
        status: "PAID",
        createdAt: new Date(),
        updateAt: new Date(),
        TicketType: {
          id: 1,
          name: "Driven",
          price: 1000,
          isRemote: false,
          includesHotel: true,
          createdAt: new Date(),
          updateAt: new Date(),
        }
      }
      jest.spyOn(ticketsRepository, "findTickeWithTypeById").mockResolvedValueOnce(mockTicketType);
      const promise = bookingService.postBooking(userId, roomId);
      expect(promise).toEqual({bookingId: 1})
    });




    it("should throw an error when user already have a rental", async () => {
      const mockUser: User = { id: 1, ...buildUserInput(true) }
      const userRental: Rental = buildRentalReturn(1, true);

      jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser);
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValue([userRental]);

      const promise = rentalsService.createRental({
        userId: userRental.id,
        moviesId: [4, 5, 6, 7] // made up values
      });
      expect(promise).rejects.toEqual({
        name: "PendentRentalError",
        message: "The user already have a rental!"
      })
    })

  })

  describe("update booking tests", () => {
    it("should change roomId", async () => {
      const roomId = 1;
      const userId = 1;
      const bookingId = 1;
      jest.spyOn(bookingRepository, "getRoom").mockResolvedValue(null);
      jest.spyOn(bookingRepository, "getBookingByUserId").mockResolvedValue(null);
      const promise = bookingService.putBooking(userId, roomId, bookingId);
      expect(promise).toEqual({BookingId: 1});
    });

    it("should return error when booking isnt exist", async () => {
      const roomId = 1;
      const userId = 1;
      const bookingId:any = undefined;
      jest.spyOn(bookingRepository, "getRoom").mockResolvedValue(null);
      jest.spyOn(bookingRepository, "getBookingByUserId").mockResolvedValue(null);
      const promise = bookingService.putBooking(userId, roomId, bookingId);
      expect(promise).rejects.toEqual({
        name: "ForbiddenError",
        message: "Forbidden Error"
      })      


    })
  })

})