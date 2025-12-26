"use client";

import { useState, useEffect } from "react";
import { bookingManager, Booking } from "@/lib/booking-system";
import { Room } from "@/lib/booking-system";

interface BookingListProps {
  type?: 'hotel_room' | 'marriage_garden';
  businessUnit?: 'hotel' | 'garden';
  status?: string;
  limit?: number;
}

export function BookingList({ type, businessUnit, status, limit }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [type, businessUnit, status]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const filter: any = {};
      
      if (type) filter.type = type.toUpperCase() as keyof typeof bookingManager;
      if (businessUnit) filter.businessUnit = businessUnit;
      if (status) filter.status = status;
      
      let allBookings = bookingManager.getBookings(filter);
      
      if (limit) {
        allBookings = allBookings.slice(0, limit);
      }
      
      setBookings(allBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const success = bookingManager.updateBookingStatus(bookingId, newStatus);
      if (success) {
        loadBookings();
        setShowDetails(false);
      } else {
        setError('Failed to update booking status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking status');
    }
  };

  const handlePaymentUpdate = async (bookingId: string, paymentStatus: Booking['paymentStatus']) => {
    try {
      const success = bookingManager.updatePaymentStatus(bookingId, paymentStatus);
      if (success) {
        loadBookings();
        setShowDetails(false);
      } else {
        setError('Failed to update payment status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[#BBF7D0] text-[#16A34A]';
      case 'pending': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case 'checked_in': return 'bg-[#EDEBFF]/30 text-[#6D5DFB]';
      case 'checked_out': return 'bg-[#F1F5F9] text-[#111827]';
      case 'cancelled': return 'bg-[#FEE2E2] text-[#DC2626]';
      default: return 'bg-[#F1F5F9] text-[#111827]';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#BBF7D0] text-[#16A34A]';
      case 'partial': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'refunded': return 'bg-[#FEE2E2] text-[#DC2626]';
      default: return 'bg-[#F1F5F9] text-[#111827]';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-[#6B7280]">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-[#EF4444] mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[#6B7280]">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-[#9CA3AF] mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-[#6B7280]">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-[#111827]">
          {type === 'hotel_room' ? 'Hotel Room' : 'Marriage Garden'} Bookings
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Booking ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                {type === 'hotel_room' ? 'Room' : 'Garden'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Check-in
              </th>
              {type === 'hotel_room' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                  Check-out
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Guests
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">
                  #{booking.id.slice(-8)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#111827]">
                  <div>
                    <p className="font-medium">{booking.customerInfo.name}</p>
                    <p className="text-[#9CA3AF]">{booking.customerInfo.phone}</p>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#111827]">
                  {booking.type === 'HOTEL_ROOM' 
                    ? `Room ${(bookingManager.getRoomById(booking.resourceId) as Room)?.number || booking.resourceId}`
                    : (bookingManager.getGardenById(booking.resourceId))?.name || booking.resourceId
                  }
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#111827]">
                  {new Date(booking.checkIn).toLocaleDateString()}
                </td>
                {type === 'hotel_room' && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[#111827]">
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </td>
                )}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#111827]">
                  {booking.guests}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">
                  ${booking.totalPrice}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#111827]">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowDetails(true);
                    }}
                    className="text-[#6D5DFB] hover:text-[#6D5DFB]/90 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">Booking Details</h3>
                  <p className="text-sm text-[#6B7280]">Booking #{selectedBooking.id.slice(-8)}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div>
                  <h4 className="font-medium text-[#111827] mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedBooking.customerInfo.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedBooking.customerInfo.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedBooking.customerInfo.phone}</p>
                    {selectedBooking.customerInfo.address && (
                      <p><span className="font-medium">Address:</span> {selectedBooking.customerInfo.address}</p>
                    )}
                  </div>
                </div>

                {/* Booking Information */}
                <div>
                  <h4 className="font-medium text-[#111827] mb-3">Booking Information</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">
                        {selectedBooking.type === 'HOTEL_ROOM' ? 'Room:' : 'Garden:'}
                      </span>{' '}
                      {selectedBooking.type === 'HOTEL_ROOM' 
                        ? `Room ${(bookingManager.getRoomById(selectedBooking.resourceId) as Room)?.number || selectedBooking.resourceId}`
                        : (bookingManager.getGardenById(selectedBooking.resourceId))?.name || selectedBooking.resourceId
                      }
                    </p>
                    <p><span className="font-medium">Check-in:</span> {new Date(selectedBooking.checkIn).toLocaleDateString()}</p>
                    {selectedBooking.type === 'HOTEL_ROOM' && (
                      <p><span className="font-medium">Check-out:</span> {new Date(selectedBooking.checkOut).toLocaleDateString()}</p>
                    )}
                    <p><span className="font-medium">Guests:</span> {selectedBooking.guests}</p>
                    <p><span className="font-medium">Total Amount:</span> ${selectedBooking.totalPrice}</p>
                  </div>
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <div className="mt-6">
                  <h4 className="font-medium text-[#111827] mb-3">Special Requests</h4>
                  <p className="text-sm text-[#6B7280] bg-[#F8FAFC] p-3 rounded">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {/* Status Actions */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[#111827] mb-3">Booking Status</h4>
                  <div className="flex space-x-2">
                    <select
                      value={selectedBooking.status}
                      onChange={(e) => handleStatusUpdate(selectedBooking.id, e.target.value as Booking['status'])}
                      className="flex-1 px-3 py-2 border border-[#9CA3AF] rounded-md text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      {selectedBooking.type === 'HOTEL_ROOM' && (
                        <option value="checked_in">Checked In</option>
                      )}
                      {selectedBooking.type === 'HOTEL_ROOM' && (
                        <option value="checked_out">Checked Out</option>
                      )}
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#111827] mb-3">Payment Status</h4>
                  <div className="flex space-x-2">
                    <select
                      value={selectedBooking.paymentStatus}
                      onChange={(e) => handlePaymentUpdate(selectedBooking.id, e.target.value as Booking['paymentStatus'])}
                      className="flex-1 px-3 py-2 border border-[#9CA3AF] rounded-md text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4 text-xs text-[#9CA3AF]">
                  <p>Created: {new Date(selectedBooking.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedBooking.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

