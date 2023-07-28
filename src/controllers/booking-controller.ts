import httpStatus from 'http-status';
import { Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '@/services/booking-service';

export async function getBooking(req: AuthenticatedRequest, res: Response) { 
    const {userId} = req;
    const booking = await bookingService.getBooking(userId);
    return res.status(httpStatus.OK).send(booking);
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { roomId } = req.body;
    const room = await bookingService.postBooking(userId, roomId);
    return res.status(httpStatus.OK).send(room);
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { roomId } = req.body;
    const room = await bookingService.putBooking(userId, roomId);
    return res.status(httpStatus.OK).send(room);
}