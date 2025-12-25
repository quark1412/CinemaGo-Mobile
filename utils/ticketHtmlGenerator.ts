import { generateBookingQRData } from "@/utils/qrCodeHelpers";
// @ts-ignore
import QRCode from "qrcode";

interface TicketData {
  movieTitle: string;
  cinemaName: string;
  cinemaAddress: string;
  roomName: string;
  date: string;
  startTime: string;
  seatsData: Array<{
    id: string;
    seatNumber: string;
    row: string;
    type: string;
    extraPrice?: number;
  }>;
  foodDrinks: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  seatsPrice: number;
  showtimePrice: number;
  totalPrice: number;
  bookingId: string;
  roomExtraPrices?: {
    VIP?: number;
    COUPLE?: number;
    NORMAL?: number;
  };
}

export const generateTicketHTML = async (
  ticketData: TicketData
): Promise<string> => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Generate QR code data URL
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(ticketData.bookingId, {
      margin: 1,
      width: 160,
    });
  } catch (error) {
    qrCodeDataUrl = "";
  }

  const formatSeatNumbers = () => {
    if (!ticketData.seatsData || ticketData.seatsData.length === 0) {
      return "N/A";
    }

    const coupleSeats = ticketData.seatsData.filter(
      (seat) => seat.type === "COUPLE"
    );
    const regularSeats = ticketData.seatsData.filter(
      (seat) => seat.type !== "COUPLE"
    );

    const processedSeatNumbers = new Set<string>();
    const seatNumbers: string[] = [];

    // Process couple seats
    coupleSeats.forEach((seat) => {
      if (processedSeatNumbers.has(seat.seatNumber)) return;

      const rowMatch = seat.seatNumber.match(/^([A-Z])(\d+)$/);
      if (!rowMatch) {
        seatNumbers.push(seat.seatNumber);
        processedSeatNumbers.add(seat.seatNumber);
        return;
      }

      const rowLetter = rowMatch[1];
      const seatNum = parseInt(rowMatch[2]);

      // Find adjacent couple seat
      const adjacentSeat = coupleSeats.find((s) => {
        if (
          s.seatNumber === seat.seatNumber ||
          processedSeatNumbers.has(s.seatNumber)
        )
          return false;
        const sRowMatch = s.seatNumber.match(/^([A-Z])(\d+)$/);
        if (!sRowMatch) return false;
        return (
          sRowMatch[1] === rowLetter &&
          (parseInt(sRowMatch[2]) === seatNum + 1 ||
            parseInt(sRowMatch[2]) === seatNum - 1)
        );
      });

      if (adjacentSeat) {
        const adjRowMatch = adjacentSeat.seatNumber.match(/^([A-Z])(\d+)$/);
        const adjSeatNum = adjRowMatch ? parseInt(adjRowMatch[2]) : seatNum;
        const minNum = Math.min(seatNum, adjSeatNum);
        const maxNum = Math.max(seatNum, adjSeatNum);
        seatNumbers.push(`${rowLetter}${minNum}-${maxNum}`);
        processedSeatNumbers.add(seat.seatNumber);
        processedSeatNumbers.add(adjacentSeat.seatNumber);
      } else {
        seatNumbers.push(seat.seatNumber);
        processedSeatNumbers.add(seat.seatNumber);
      }
    });

    // Add regular seats
    regularSeats.forEach((seat) => {
      seatNumbers.push(seat.seatNumber);
    });

    return seatNumbers.join(", ");
  };

  const getSeatTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      NORMAL: "Thường",
      VIP: "VIP",
      COUPLE: "Đôi",
    };
    return typeMap[type] || type;
  };

  // Generate seats HTML
  const generateSeatsHTML = () => {
    if (!ticketData.seatsData || ticketData.seatsData.length === 0) {
      return "";
    }

    const seatsByType: Record<string, any[]> = {};
    const processedSeatNumbers = new Set<string>();

    const coupleSeats = ticketData.seatsData.filter(
      (seat) => seat.type === "COUPLE"
    );

    // Group adjacent couple seats
    coupleSeats.forEach((seat) => {
      if (processedSeatNumbers.has(seat.seatNumber)) return;

      const rowMatch = seat.seatNumber.match(/^([A-Z])(\d+)$/);
      if (!rowMatch) {
        if (!seatsByType["COUPLE"]) {
          seatsByType["COUPLE"] = [];
        }
        seatsByType["COUPLE"].push(seat);
        processedSeatNumbers.add(seat.seatNumber);
        return;
      }

      const rowLetter = rowMatch[1];
      const seatNum = parseInt(rowMatch[2]);

      const adjacentSeat = coupleSeats.find((s) => {
        if (
          s.seatNumber === seat.seatNumber ||
          processedSeatNumbers.has(s.seatNumber)
        )
          return false;
        const sRowMatch = s.seatNumber.match(/^([A-Z])(\d+)$/);
        if (!sRowMatch) return false;
        return (
          sRowMatch[1] === rowLetter &&
          (parseInt(sRowMatch[2]) === seatNum + 1 ||
            parseInt(sRowMatch[2]) === seatNum - 1)
        );
      });

      if (adjacentSeat) {
        const adjRowMatch = adjacentSeat.seatNumber.match(/^([A-Z])(\d+)$/);
        const adjSeatNum = adjRowMatch ? parseInt(adjRowMatch[2]) : seatNum;
        const minNum = Math.min(seatNum, adjSeatNum);
        const maxNum = Math.max(seatNum, adjSeatNum);

        const couplePair = {
          ...seat,
          seatNumber: `${rowLetter}${minNum}-${maxNum}`,
        };

        if (!seatsByType["COUPLE"]) {
          seatsByType["COUPLE"] = [];
        }
        seatsByType["COUPLE"].push(couplePair);
        processedSeatNumbers.add(seat.seatNumber);
        processedSeatNumbers.add(adjacentSeat.seatNumber);
      } else {
        if (!seatsByType["COUPLE"]) {
          seatsByType["COUPLE"] = [];
        }
        seatsByType["COUPLE"].push(seat);
        processedSeatNumbers.add(seat.seatNumber);
      }
    });

    // Add regular seats
    ticketData.seatsData.forEach((seat) => {
      if (processedSeatNumbers.has(seat.seatNumber)) return;

      const type = seat.type || "NORMAL";
      if (!seatsByType[type]) {
        seatsByType[type] = [];
      }
      seatsByType[type].push(seat);
    });

    let seatsHTML = "";
    Object.entries(seatsByType).forEach(([type, seats]) => {
      const basePrice = ticketData.showtimePrice || 0;
      const extraPrice =
        ticketData.roomExtraPrices?.[
          type as keyof typeof ticketData.roomExtraPrices
        ] || 0;
      const seatCount = seats.length;

      // Calculate total price
      const totalPrice = seats.reduce((sum, seat: any) => {
        if (type === "COUPLE" && seat.seatNumber.includes("-")) {
          const match = seat.seatNumber.match(/^([A-Z])(\d+)-(\d+)$/);
          if (match) {
            const rowLetter = match[1];
            const startNum = parseInt(match[2]);
            const endNum = parseInt(match[3]);

            const pairSeats = ticketData.seatsData.filter((s) => {
              const sMatch = s.seatNumber.match(/^([A-Z])(\d+)$/);
              if (!sMatch) return false;
              return (
                sMatch[1] === rowLetter &&
                parseInt(sMatch[2]) >= startNum &&
                parseInt(sMatch[2]) <= endNum
              );
            });

            // Sum price for both seats in the pair
            return (
              sum +
              pairSeats.reduce((pairSum, pairSeat) => {
                const seatExtra = pairSeat?.extraPrice || extraPrice;
                return pairSum + (basePrice + seatExtra);
              }, 0)
            );
          }
        }

        // Regular seat or individual couple seat
        const seatExtra = seat?.extraPrice || extraPrice;
        return sum + (basePrice + seatExtra);
      }, 0);

      seatsHTML += `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 4px;">
          <tr>
            <td style="color: #4b5563; font-size: 14px; padding-bottom: 4px;">${seatCount} Ghế (${getSeatTypeName(type)})</td>
            <td align="right" style="font-weight: 500; font-size: 14px; padding-bottom: 4px;">${formatPrice(totalPrice)}</td>
          </tr>
        </table>
      `;
    });

    return seatsHTML;
  };

  const seatsHTML = generateSeatsHTML();
  const hasSeats = ticketData.seatsData && ticketData.seatsData.length > 0;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 30px; background-color: #fafafa;">
      <h2 style="text-align: center; color: #e11d48; margin-top: 0;">Xác nhận đặt vé thành công!</h2>
      <p>Xin chào,</p>
      <p>Vé của bạn đã được xác nhận. Dưới đây là thông tin chi tiết về đặt vé của bạn. Vui lòng xuất trình mã QR này tại quầy vé hoặc cổng kiểm soát để vào rạp.</p>

      <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; background-color: #ffffff;">
        <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 15px; color: #e11d48;">${ticketData.movieTitle}</h2>
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 5px; margin-top: 0;">${ticketData.cinemaName}</p>
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 20px; margin-top: 0;">${ticketData.cinemaAddress}</p>

        ${
          ticketData.bookingId &&
          `
        <div style="margin: 20px 0;">
          <div style="background-color: #ffffff; padding: 5px; border: 1px solid #eee; border-radius: 4px; display: inline-block;">
            <div style="width: 160px; height: 160px;">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${ticketData.bookingId}" 
                alt="Mã QR Vé" 
                style="width: 160px; height: 160px; display: block;" 
              />
            </div>
          </div>
        </div>
        `
        }

        <div style="text-align: left; border-top: 1px dashed #e0e0e0; padding-top: 20px; margin-top: 20px;">
          <h3 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px; text-align: center; color: #e11d48;">Thông tin vé</h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 4px;">
            <tr>
              <td style="color: #4b5563; font-size: 14px; padding-bottom: 4px;">Mã vé</td>
              <td align="right" style="font-weight: 500; font-size: 14px; padding-bottom: 4px;">${ticketData.bookingId}</td>
            </tr>
          </table>
          ${
            hasSeats
              ? `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 4px;">
            <tr>
              <td style="color: #4b5563; font-size: 14px; padding-bottom: 4px;">Ghế</td>
              <td align="right" style="font-weight: 500; font-size: 14px; padding-bottom: 4px;">${formatSeatNumbers()}</td>
            </tr>
          </table>
          `
              : ""
          }
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 4px;">
            <tr>
              <td style="color: #4b5563; font-size: 14px; padding-bottom: 4px;">Suất chiếu</td>
              <td align="right" style="font-weight: 500; font-size: 14px; padding-bottom: 4px;">${ticketData.startTime}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 4px;">
            <tr>
              <td style="color: #4b5563; font-size: 14px; padding-bottom: 4px;">Phòng chiếu</td>
              <td align="right" style="font-weight: 500; font-size: 14px; padding-bottom: 4px;">${ticketData.roomName}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: left; border-top: 1px dashed #e0e0e0; padding-top: 20px; margin-top: 20px;">
          <h3 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px; text-align: center; color: #e11d48;">Thông tin đơn hàng</h3>
          ${seatsHTML}
          ${
            ticketData.foodDrinks && ticketData.foodDrinks.length > 0
              ? ticketData.foodDrinks
                  .map(
                    (fd) => `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 4px;">
            <tr>
              <td style="color: #4b5563; font-size: 14px; padding-bottom: 4px;">${fd.quantity} x ${fd.name}</td>
              <td align="right" style="font-weight: 500; font-size: 14px; padding-bottom: 4px;">${formatPrice(fd.price)}</td>
            </tr>
          </table>
          `
                  )
                  .join("")
              : ""
          }
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #e0e0e0; padding-top: 10px; margin-top: 15px;">
            <tr>
              <td style="font-weight: 700; font-size: 16px;">Tổng cộng</td>
              <td align="right" style="font-weight: 700; font-size: 16px;">${formatPrice(ticketData.totalPrice)}</td>
            </tr>
          </table>
        </div>
      </div>

      <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ CinemaGo</strong></p>
    </div>
  `;
};
