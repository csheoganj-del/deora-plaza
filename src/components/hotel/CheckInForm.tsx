"use client";

import { useState, useEffect } from "react";
import { hotelManager, CheckIn, Room, RoomType } from "@/lib/hotel-management";

interface CheckInFormProps {
  onSuccess?: (checkIn: CheckIn) => void;
  onCancel?: () => void;
  bookingId?: string;
}

export function CheckInForm({ onSuccess, onCancel, bookingId }: CheckInFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    idType: 'Driver License',
    idNumber: ''
  });
  const [checkInDetails, setCheckInDetails] = useState({
    adults: 1,
    children: 0,
    expectedCheckOut: '',
    roomRate: 0,
    specialRequests: ''
  });
  
  // Available data
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    loadRoomTypes();
    if (bookingId) {
      // Load booking details if bookingId is provided
      loadBookingDetails(bookingId);
    }
  }, [bookingId]);

  useEffect(() => {
    if (checkInDetails.expectedCheckOut && selectedRoom) {
      calculateTotal();
    }
  }, [checkInDetails.expectedCheckOut, checkInDetails.adults, checkInDetails.children, selectedRoom]);

  const loadRoomTypes = () => {
    const types = hotelManager.getRoomTypes();
    setRoomTypes(types);
  };

  const loadBookingDetails = (bookingId: string) => {
    // In a real app, this would fetch booking details from API
    // For now, we'll just set some default values
    setCheckInDetails(prev => ({
      ...prev,
      expectedCheckOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
  };

  const searchAvailableRooms = () => {
    if (!checkInDetails.expectedCheckOut) {
      setError('Please select expected check-out date');
      return;
    }

    const checkInDate = new Date().toISOString();
    const checkOutDate = new Date(checkInDetails.expectedCheckOut).toISOString();
    const totalGuests = checkInDetails.adults + checkInDetails.children;

    const rooms = hotelManager.getAvailableRooms(checkInDate, checkOutDate, totalGuests);
    setAvailableRooms(rooms);
    
    if (rooms.length === 0) {
      setError('No rooms available for the selected dates and occupancy');
    } else {
      setError(null);
    }
  };

  const calculateTotal = () => {
    if (!selectedRoom || !checkInDetails.expectedCheckOut) return;

    const roomType = hotelManager.getRoomTypeById(selectedRoom.typeId);
    if (!roomType) return;

    const checkIn = new Date();
    const checkOut = new Date(checkInDetails.expectedCheckOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const baseRate = roomType.basePrice;
    const total = baseRate * nights;
    
    setCalculatedTotal(total);
    setCheckInDetails(prev => ({ ...prev, roomRate: baseRate }));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!checkInDetails.expectedCheckOut) {
          setError('Please select expected check-out date');
          return false;
        }
        
        if (checkInDetails.adults < 1) {
          setError('At least one adult is required');
          return false;
        }
        
        const checkOutDate = new Date(checkInDetails.expectedCheckOut);
        if (checkOutDate <= new Date()) {
          setError('Check-out date must be in the future');
          return false;
        }
        
        break;
        
      case 2:
        if (!selectedRoom) {
          setError('Please select a room');
          return false;
        }
        break;
        
      case 3:
        if (!guestInfo.name || !guestInfo.email || !guestInfo.phone || !guestInfo.idNumber) {
          setError('Please fill in all required guest information');
          return false;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guestInfo.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        
        // Phone validation
        const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(guestInfo.phone)) {
          setError('Please enter a valid phone number');
          return false;
        }
        
        break;
    }
    
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 1) {
        searchAvailableRooms();
        setStep(2);
      } else if (step === 2) {
        setStep(3);
      } else if (step === 3) {
        setStep(4);
      }
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep() || !selectedRoom) return;

    setLoading(true);
    setError(null);

    try {
      const checkIn = hotelManager.checkIn({
        bookingId: bookingId || `direct_${Date.now()}`,
        roomId: selectedRoom.id,
        guestInfo,
        checkInTime: new Date().toISOString(),
        expectedCheckOut: new Date(checkInDetails.expectedCheckOut).toISOString(),
        adults: checkInDetails.adults,
        children: checkInDetails.children,
        totalGuests: checkInDetails.adults + checkInDetails.children,
        roomRate: checkInDetails.roomRate,
        additionalCharges: [],
        payments: [],
        status: 'active',
        specialRequests: checkInDetails.specialRequests || undefined,
        checkedInBy: 'current_user' // This would come from auth
      });

      onSuccess?.(checkIn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in guest');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Check-in Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Expected Check-out Date *
            </label>
            <input
              type="date"
              value={checkInDetails.expectedCheckOut}
              onChange={(e) => setCheckInDetails({...checkInDetails, expectedCheckOut: e.target.value})}
              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Number of Adults *
            </label>
            <input
              type="number"
              value={checkInDetails.adults}
              onChange={(e) => setCheckInDetails({...checkInDetails, adults: parseInt(e.target.value) || 1})}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Number of Children
            </label>
            <input
              type="number"
              value={checkInDetails.children}
              onChange={(e) => setCheckInDetails({...checkInDetails, children: parseInt(e.target.value) || 0})}
              min="0"
              max="10"
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Total Guests
            </label>
            <div className="px-3 py-2 bg-[#F1F5F9] border border-[#9CA3AF] rounded-md">
              {checkInDetails.adults + checkInDetails.children} guests
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Special Requests
          </label>
          <textarea
            value={checkInDetails.specialRequests}
            onChange={(e) => setCheckInDetails({...checkInDetails, specialRequests: e.target.value})}
            rows={3}
            placeholder="Any special requests or requirements..."
            className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Select Room</h3>
        
        {availableRooms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#9CA3AF] mb-4">No rooms available for the selected dates</p>
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-[#6D5DFB] text-white rounded-md hover:bg-[#6D5DFB]/90"
            >
              Go Back and Modify Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.map(room => {
              const roomType = hotelManager.getRoomTypeById(room.typeId);
              return (
                <div
                  key={room.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id
                      ? 'border-[#EDEBFF] bg-[#EDEBFF]/30'
                      : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-[#111827]">Room {room.number}</h4>
                      <p className="text-sm text-[#6B7280]">Floor {room.floor}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      room.status === 'AVAILABLE' ? 'bg-[#BBF7D0] text-[#16A34A]' :
                      room.status === 'RESERVED' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      'bg-[#F1F5F9] text-[#111827]'
                    }`}>
                      {room.status}
                    </span>
                  </div>
                  
                  {roomType && (
                    <div className="text-sm text-[#6B7280] mb-2">
                      <p className="font-medium">{roomType.name}</p>
                      <p>{roomType.bedConfiguration}</p>
                      <p>{roomType.size} sq ft</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {roomType.amenities.slice(0, 3).map((amenity, index) => (
                          <span key={index} className="text-xs bg-[#F1F5F9] px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                        {roomType.amenities.length > 3 && (
                          <span className="text-xs text-[#9CA3AF]">+{roomType.amenities.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-[#6B7280]">
                      Capacity: {room.maxOccupancy} guests
                    </span>
                    <span className="font-semibold text-[#111827]">
                      ${roomType?.basePrice || 0}/night
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Guest Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={guestInfo.name}
              onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="Enter guest name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={guestInfo.email}
              onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="guest@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={guestInfo.phone}
              onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="+1234567890"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Address
            </label>
            <input
              type="text"
              value={guestInfo.address}
              onChange={(e) => setGuestInfo({...guestInfo, address: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="Guest address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              ID Type *
            </label>
            <select
              value={guestInfo.idType}
              onChange={(e) => setGuestInfo({...guestInfo, idType: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            >
              <option value="Driver License">Driver License</option>
              <option value="Passport">Passport</option>
              <option value="National ID">National ID</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              ID Number *
            </label>
            <input
              type="text"
              value={guestInfo.idNumber}
              onChange={(e) => setGuestInfo({...guestInfo, idNumber: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="Enter ID number"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Review & Confirm</h3>
        
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Guest Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {guestInfo.name}</p>
                <p><span className="font-medium">Email:</span> {guestInfo.email}</p>
                <p><span className="font-medium">Phone:</span> {guestInfo.phone}</p>
                {guestInfo.address && <p><span className="font-medium">Address:</span> {guestInfo.address}</p>}
                <p><span className="font-medium">ID:</span> {guestInfo.idType} - {guestInfo.idNumber}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Room Details</h4>
              {selectedRoom && (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Room:</span> {selectedRoom.number}</p>
                  <p><span className="font-medium">Floor:</span> {selectedRoom.floor}</p>
                  <p><span className="font-medium">Type:</span> {hotelManager.getRoomTypeById(selectedRoom.typeId)?.name}</p>
                  <p><span className="font-medium">Guests:</span> {checkInDetails.adults + checkInDetails.children}</p>
                  <p><span className="font-medium">Check-out:</span> {new Date(checkInDetails.expectedCheckOut).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-[#111827] mb-3">Charges</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Room Rate:</span>
                <span>${checkInDetails.roomRate}/night</span>
              </div>
              <div className="flex justify-between">
                <span>Nights:</span>
                <span>
                  {Math.ceil(
                    (new Date(checkInDetails.expectedCheckOut).getTime() - new Date().getTime()) / 
                    (1000 * 60 * 60 * 24)
                  )}
                </span>
              </div>
              {checkInDetails.specialRequests && (
                <div className="flex justify-between">
                  <span>Special Requests:</span>
                  <span className="text-[#6B7280]">Noted</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="font-semibold text-lg">Total Amount:</span>
              <span className="font-bold text-lg text-[#6D5DFB]">${calculatedTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#111827]">Step {step} of 4</span>
          <span className="text-sm text-[#9CA3AF]">
            {step === 1 && 'Check-in Details'}
            {step === 2 && 'Room Selection'}
            {step === 3 && 'Guest Information'}
            {step === 4 && 'Review & Confirm'}
          </span>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
          <div 
            className="bg-[#6D5DFB] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-[#FEE2E2] border border-red-200 rounded-md">
          <p className="text-[#DC2626] text-sm">{error}</p>
        </div>
      )}

      {/* Form Steps */}
      <div className="mb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div>
          {step > 1 && (
            <button
              onClick={handlePrevious}
              disabled={loading}
              className="px-4 py-2 text-[#111827] bg-[#E5E7EB] rounded-md hover:bg-[#9CA3AF] disabled:opacity-50"
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[#111827] bg-[#E5E7EB] rounded-md hover:bg-[#9CA3AF] disabled:opacity-50"
          >
            Cancel
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-4 py-2 bg-[#6D5DFB] text-white rounded-md hover:bg-[#6D5DFB]/90 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:opacity-50"
            >
              {loading ? 'Checking In...' : 'Check In Guest'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

