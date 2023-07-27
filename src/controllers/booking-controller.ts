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
    const { hotelId } = req.params;
    const id = Number(hotelId);
    const hotel = await hotelsService.getHotelId(userId, id);
    return res.status(httpStatus.OK).send(hotel);

    //Regra de negócio: Apenas usuários com ingresso do tipo presencial, com hospedagem e pago podem fazer reservas.

    /* body: 

```json
{
	"roomId": Number
}
```

- 🟢 **Sucesso**: Deve retornar status code `200` com `bookingId`
- 🔴 **Error**:
    - `roomId` não existente: Deve retornar status code `404`.
    - `roomId` sem vaga: Deve retornar status code `403`.
    - Fora da regra de negócio: Deve retornar status code `403`. */
  
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {

    //- Regra de negócio:
    //- A troca pode ser efetuada para usuários que possuem reservas.
    //- A troca pode ser efetuada apenas para quartos livres.

/* **body**: 

```json
{
	"roomId": Number
}
```

- 🟢 Sucesso: Deve retornar status code `200` com `bookingId`
- 🔴 Erro:
    - `roomId` não existente: Deve retornar status code `404`.
    - `roomId` sem vaga: Deve retornar status code `403`.
    - Fora da regra de negócio: Deve retornar status code `403`. */
  
}