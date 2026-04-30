import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

export const createBooking = async (bookingData) => {
  try {
    const booking = await prisma.booking.create({
      data: bookingData,
    });

    return booking;
  } catch (error) {
    throwError("Failed to create booking", 500);
  }
};

export const getBookings = async ({ page, limit }) => {
  try {
    const skip = (page - 1) * limit;

    const [bookings, count] = await Promise.all([
      prisma.booking.findMany({
        where: {
          isDeleted: false,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.booking.count({
        where: {
          isDeleted: false,
        },
      }),
    ]);

    return {
      data: bookings,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    throwError("Failed to fetch bookings", 500);
  }
};

export const getBookingById = async (id) => {
  try {
    if (!id) {
      throwError("Booking ID is required", 400);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: Number(id),
        isDeleted: false,
      },
    });

    return booking;
  } catch (error) {
    throwError("Failed to fetch booking", 500);
  }
};

export const updateBookingStatus = async (id, status) => {
  try {
    if (!id) {
      throwError("Booking ID is required", 400);
    }

    const booking = await prisma.booking.update({
      where: {
        id: parseInt(id),
      },
      data: { status, updatedAt: new Date() },
    });

    return booking;
  } catch (error) {
    throwError("Failed to update status", 500);
  }
};

export const deleteBooking = async (id) => {
  try {
    if (!id) {
      throwError("Booking ID is required", 400);
    }

    await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    throwError("Failed to delete booking", 500);
  }
};
