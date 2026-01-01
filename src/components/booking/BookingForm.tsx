"use client";

import { useState, useEffect } from "react";
import { bookingManager, Booking, Room, MarriageGarden } from "@/lib/booking-system";
import { BusinessUnit } from "@/lib/business-units";

interface BookingFormProps {
  type: 'hotel_room' | 'marriage_garden';
  businessUnit: 'hotel' | 'garden';
  onSuccess?: (booking: Booking) => void;
  onCancel?: () => void;
}

export function BookingForm({ type, businessUnit, onSuccess, onCancel }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [resourceId, setResourceId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    idProof: ''
  });
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Available resources
  const [rooms, setRooms] = useState<Room[]>([]);
  const [gardens, setGardens] = useState<MarriageGarden[]>([]);
  const [selectedResource, setSelectedResource] = useState<Room | MarriageGarden | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    if (type === 'hotel_room') {
      const availableRooms = bookingManager.getRooms({ status: 'available' });
      setRooms(availableRooms);
    } else {
      const availableGardens = bookingManager.getGardens({ status: 'available' });
      setGardens(availableGardens);
    }
  }, [type]);

  useEffect(() => {
    if (resourceId && checkIn && (type === 'marriage_garden' || checkOut)) {
      calculatePrice();
    }
  }, [resourceId, checkIn, checkOut, guests, type]);

  const calculatePrice = () => {
    if (type === 'hotel_room' && resourceId && checkIn && checkOut) {
      const price = bookingManager.calculateRoomPrice(resourceId, checkIn, checkOut, guests);
      setCalculatedPrice(price);
    } else if (type === 'marriage_garden' && resourceId && checkIn) {
      const price = bookingManager.calculateGardenPrice(resourceId, checkIn, guests);
      setCalculatedPrice(price);
    }
  };

  const handleResourceSelect = (id: string) => {
    setResourceId(id);
    const resource = type === 'hotel_room' 
      ? bookingManager.getRoomById(id)
      : bookingManager.getGardenById(id);
    setSelectedResource(resource);
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!resourceId || !checkIn || (type === 'hotel_room' && !checkOut)) {
          setError('Please fill in all required fields');
          return false;
        }
        
        // Validate availability
        if (type === 'hotel_room') {
          if (!bookingManager.checkRoomAvailability(resourceId, checkIn, checkOut)) {
            setError('Room is not available for selected dates');
            return false;
          }
        } else {
          if (!bookingManager.checkGardenAvailability(resourceId, checkIn)) {
            setError('Garden is not available for selected date');
            return false;
          }
        }
        
        // Validate booking rules
        const bookingTypeKey = (type === 'hotel_room' ? 'HOTEL_ROOM' : 'MARRIAGE_GARDEN') as keyof import('@/lib/booking-system').BookingType;
        const validation = bookingManager.validateBooking(
          bookingTypeKey,
          businessUnit,
          checkIn,
          type === 'hotel_room' ? checkOut : undefined
        );
        
        if (!validation.valid) {
          setError(validation.errors.join(', '));
          return false;
        }
        
        break;
        
      case 2:
        if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
          setError('Please fill in all customer information');
          return false;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerInfo.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        
        // Phone validation
        const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(customerInfo.phone)) {
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
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      const booking = bookingManager.createBooking({
        type: (type === 'hotel_room' ? 'HOTEL_ROOM' : 'MARRIAGE_GARDEN') as keyof import('@/lib/booking-system').BookingType,
        resourceId,
        customerInfo,
        checkIn,
        checkOut: type === 'hotel_room' ? checkOut : checkIn,
        guests,
        totalPrice: calculatedPrice,
        status: 'pending',
        paymentStatus: 'pending',
        specialRequests: specialRequests || undefined,
        createdBy: 'current_user', // This would come from auth
        businessUnit
      });

      onSuccess?.(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">
          Select {type === 'hotel_room' ? 'Room' : 'Garden'}
        </h3>
        
        {type === 'hotel_room' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => (
              <div
                key={room.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  resourceId === room.id
                    ? 'border-[#EDEBFF] bg-[#EDEBFF]/30'
                    : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
                }`}
                onClick={() => handleResourceSelect(room.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-[#111827]">Room {room.number}</h4>
                    <p className="text-sm text-[#6B7280] capitalize">{room.type} • {room.category}</p>
                  </div>
                  <p className="font-semibold text-[#111827]">${room.basePrice}/night</p>
                </div>
                <div className="text-sm text-[#6B7280]">
                  <p>Capacity: {room.capacity} guests</p>
                  <p>Floor: {room.floor}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {room.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="text-xs bg-[#F1F5F9] px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs text-[#9CA3AF]">+{room.amenities.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gardens.map(garden => (
              <div
                key={garden.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  resourceId === garden.id
                    ? 'border-[#EDEBFF] bg-[#EDEBFF]/30'
                    : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
                }`}
                onClick={() => handleResourceSelect(garden.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-[#111827]">{garden.name}</h4>
                    <p className="text-sm text-[#6B7280]">{garden.area.toLocaleString()} sq ft</p>
                  </div>
                  <p className="font-semibold text-[#111827]">${garden.basePrice}</p>
                </div>
                <div className="text-sm text-[#6B7280]">
                  <p>Capacity: {garden.capacity} guests</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {garden.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="text-xs bg-[#F1F5F9] px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    {garden.amenities.length > 3 && (
                      <span className="text-xs text-[#9CA3AF]">+{garden.amenities.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Check-in Date *
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          />
        </div>
        
        {type === 'hotel_room' && (
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Check-out Date *
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">
          Number of Guests *
        </label>
        <input
          type="number"
          value={guests}
          onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
          max={selectedResource ? selectedResource.capacity : 10}
          className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
        />
      </div>

      {calculatedPrice > 0 && (
        <div className="bg-[#EDEBFF]/30 border border-[#EDEBFF]/40 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-[#6D5DFB]">Estimated Total:</span>
            <span className="text-xl font-bold text-[#6D5DFB]">${calculatedPrice}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Customer Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Address
            </label>
            <input
              type="text"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1">
          Special Requests
        </label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          placeholder="Any special requests or requirements..."
          className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
        />
      </div>

      {/* Booking Summary */}
      <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-4">
        <h4 className="font-medium text-[#111827] mb-3">Booking Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">
              {type === 'hotel_room' ? 'Room' : 'Garden'}:
            </span>
            <span className="font-medium">
              {type === 'hotel_room' 
                ? `Room ${(selectedResource as Room)?.number}`
                : (selectedResource as MarriageGarden)?.name
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Check-in:</span>
            <span className="font-medium">{new Date(checkIn).toLocaleDateString()}</span>
          </div>
          {type === 'hotel_room' && (
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Check-out:</span>
              <span className="font-medium">{new Date(checkOut).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Guests:</span>
            <span className="font-medium">{guests}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">Total Amount:</span>
            <span className="font-bold text-lg">${calculatedPrice}</span>
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
          <span className="text-sm font-medium text-[#111827]">Step {step} of 2</span>
          <span className="text-sm text-[#9CA3AF]">
            {step === 1 ? 'Select Resource & Dates' : 'Customer Information'}
          </span>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
          <div 
            className="bg-[#6D5DFB] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
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
          
          {step < 2 ? (
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
              {loading ? 'Creating Booking...' : 'Create Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

