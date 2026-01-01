"use client";

import { useState, useEffect } from "react";
import { hotelManager, CheckIn, RoomType } from "@/lib/hotel-management";

interface CheckOutFormProps {
  checkInId: string;
  onSuccess?: (checkOut: CheckIn) => void;
  onCancel?: () => void;
}

export function CheckOutForm({ checkInId, onSuccess, onCancel }: CheckOutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInData, setCheckInData] = useState<CheckIn | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  
  // Additional charges
  const [additionalCharges, setAdditionalCharges] = useState<Array<{
    type: string;
    description: string;
    amount: number;
  }>>([]);
  
  const [newCharge, setNewCharge] = useState({
    type: '',
    description: '',
    amount: 0
  });
  
  // Payment information
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    loadCheckInData();
  }, [checkInId]);

  const loadCheckInData = () => {
    const checkIn = hotelManager.getCheckInById(checkInId);
    if (!checkIn) {
      setError('Check-in record not found');
      return;
    }

    if (checkIn.status !== 'active') {
      setError('Guest has already checked out');
      return;
    }

    setCheckInData(checkIn);
    
    const roomTypeData = hotelManager.getRoomTypeById(
      hotelManager.getRoomById(checkIn.roomId)?.typeId || ''
    );
    setRoomType(roomTypeData);
  };

  const handleAddCharge = () => {
    if (!newCharge.type || !newCharge.description || newCharge.amount <= 0) {
      setError('Please fill in all charge details');
      return;
    }

    setAdditionalCharges([...additionalCharges, { ...newCharge }]);
    setNewCharge({ type: '', description: '', amount: 0 });
    setError(null);
  };

  const handleRemoveCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const calculateTotalAmount = (): number => {
    if (!checkInData) return 0;

    const nights = Math.ceil(
      (new Date().getTime() - new Date(checkInData.checkInTime).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    const roomCharges = checkInData.roomRate * nights;
    const additionalAmount = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    
    return roomCharges + additionalAmount;
  };

  const calculateNights = (): number => {
    if (!checkInData) return 0;
    
    return Math.ceil(
      (new Date().getTime() - new Date(checkInData.checkInTime).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
  };

  const handleSubmit = async () => {
    if (!checkInData) return;

    setLoading(true);
    setError(null);

    try {
      const checkOut = hotelManager.checkOut(checkInId, additionalCharges);
      
      if (checkOut) {
        // Add payment record
        const totalAmount = calculateTotalAmount();
        checkOut.payments.push({
          amount: totalAmount,
          method: paymentMethod,
          date: new Date().toISOString(),
          reference: paymentReference || undefined
        });

        onSuccess?.(checkOut);
      } else {
        setError('Failed to check out guest');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out guest');
    } finally {
      setLoading(false);
    }
  };

  const chargeTypes = [
    'Room Service',
    'Laundry',
    'Mini Bar',
    'Restaurant',
    'Bar',
    'Spa',
    'Parking',
    'Internet',
    'Phone',
    'Damage',
    'Late Checkout',
    'Other'
  ];

  if (!checkInData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <p className="text-[#9CA3AF]">{error || 'Loading check-in data...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#111827] mb-2">Guest Check-out</h2>
        <p className="text-[#6B7280]">Process guest check-out and handle final charges</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-[#FEE2E2] border border-red-200 rounded-md">
          <p className="text-[#DC2626] text-sm">{error}</p>
        </div>
      )}

      {/* Guest Information */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[#111827] mb-4">Guest Information</h3>
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm"><span className="font-medium">Name:</span> {checkInData.guestInfo.name}</p>
              <p className="text-sm"><span className="font-medium">Email:</span> {checkInData.guestInfo.email}</p>
              <p className="text-sm"><span className="font-medium">Phone:</span> {checkInData.guestInfo.phone}</p>
            </div>
            <div>
              <p className="text-sm"><span className="font-medium">Room:</span> {hotelManager.getRoomById(checkInData.roomId)?.number}</p>
              <p className="text-sm"><span className="font-medium">Check-in:</span> {new Date(checkInData.checkInTime).toLocaleDateString()}</p>
              <p className="text-sm"><span className="font-medium">Expected Check-out:</span> {new Date(checkInData.expectedCheckOut).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm"><span className="font-medium">Guests:</span> {checkInData.adults} adults, {checkInData.children} children</p>
            {checkInData.specialRequests && (
              <p className="text-sm"><span className="font-medium">Special Requests:</span> {checkInData.specialRequests}</p>
            )}
          </div>
        </div>
      </div>

      {/* Room Charges */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[#111827] mb-4">Room Charges</h3>
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Room Rate:</span>
              <span>${checkInData.roomRate}/night</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Nights Stayed:</span>
              <span>{calculateNights()}</span>
            </div>
            <div className="flex justify-between text-sm font-medium pt-2 border-t">
              <span>Room Total:</span>
              <span>${checkInData.roomRate * calculateNights()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Charges */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[#111827] mb-4">Additional Charges</h3>
        
        {/* Add New Charge */}
        <div className="bg-[#EDEBFF]/30 border border-[#EDEBFF]/40 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-[#6D5DFB] mb-3">Add New Charge</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={newCharge.type}
              onChange={(e) => setNewCharge({...newCharge, type: e.target.value})}
              className="px-3 py-2 border border-[#9CA3AF] rounded-md text-sm"
            >
              <option value="">Select Type</option>
              {chargeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description"
              value={newCharge.description}
              onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
              className="px-3 py-2 border border-[#9CA3AF] rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newCharge.amount || ''}
              onChange={(e) => setNewCharge({...newCharge, amount: parseFloat(e.target.value) || 0})}
              min="0"
              step="0.01"
              className="px-3 py-2 border border-[#9CA3AF] rounded-md text-sm"
            />
            <button
              onClick={handleAddCharge}
              className="px-3 py-2 bg-[#6D5DFB] text-white rounded-md text-sm hover:bg-[#6D5DFB]/90"
            >
              Add Charge
            </button>
          </div>
        </div>

        {/* Existing Charges */}
        {additionalCharges.length > 0 && (
          <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[#9CA3AF] uppercase">Amount</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-[#9CA3AF] uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {additionalCharges.map((charge, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{charge.type}</td>
                    <td className="px-4 py-2 text-sm">{charge.description}</td>
                    <td className="px-4 py-2 text-sm text-right">${charge.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRemoveCharge(index)}
                        className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[#111827] mb-4">Payment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Transaction reference"
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[#111827] mb-4">Total Summary</h3>
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Room Charges:</span>
              <span>${checkInData.roomRate * calculateNights()}</span>
            </div>
            {additionalCharges.map((charge, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{charge.type} - {charge.description}:</span>
                <span>${charge.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold text-lg">Total Amount:</span>
              <span className="font-bold text-lg text-[#6D5DFB]">${calculateTotalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-[#111827] bg-[#E5E7EB] rounded-md hover:bg-[#9CA3AF] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50"
        >
          {loading ? 'Processing Check-out...' : 'Complete Check-out'}
        </button>
      </div>
    </div>
  );
}

