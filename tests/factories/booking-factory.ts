import faker from '@faker-js/faker';
import { prisma } from '@/config';
import { Booking } from '@prisma/client';

export async function createBooking(userId: number, roomId: number): Promise <Booking> {
  return await prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}
