"use client";

import { useState, useEffect } from "react";
import { eventManager, Event, EventPackage, EventService, EventStaff, EventType } from "@/lib/event-management";

interface EventFormProps {
  onSuccess?: (event: Event) => void;
  onCancel?: () => void;
  initialData?: Partial<Event>;
}

export function EventForm({ onSuccess, onCancel, initialData }: EventFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [basicInfo, setBasicInfo] = useState({
    title: initialData?.title || '',
    type: initialData?.type || 'WEDDING' as keyof EventType,
    description: initialData?.description || '',
    expectedGuests: initialData?.expectedGuests || 50,
    date: initialData?.date || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    specialRequirements: initialData?.specialRequirements || ''
  });
  
  const [customerInfo, setCustomerInfo] = useState({
    name: initialData?.customerInfo?.name || '',
    email: initialData?.customerInfo?.email || '',
    phone: initialData?.customerInfo?.phone || '',
    address: initialData?.customerInfo?.address || '',
    company: initialData?.customerInfo?.company || ''
  });
  
  const [venueInfo, setVenueInfo] = useState({
    id: initialData?.venue?.id || '',
    name: initialData?.venue?.name || '',
    type: initialData?.venue?.type || 'garden' as 'garden' | 'hall',
    capacity: initialData?.venue?.capacity || 100
  });
  
  const [selectedPackages, setSelectedPackages] = useState<Array<{ packageId: string; quantity: number }>>(
    initialData?.packages?.map(p => ({ packageId: p.packageId, quantity: p.quantity })) || []
  );
  
  const [selectedServices, setSelectedServices] = useState<Array<{ serviceId: string; quantity: number }>>(
    initialData?.services?.map(s => ({ serviceId: s.serviceId, quantity: s.quantity })) || []
  );
  
  const [selectedStaff, setSelectedStaff] = useState<Array<{ staffId: string; hours: number }>>(
    initialData?.staff?.map(s => ({ staffId: s.staffId, hours: s.hours })) || []
  );

  // Available options
  const [packages, setPackages] = useState<EventPackage[]>([]);
  const [services, setServices] = useState<EventService[]>([]);
  const [staff, setStaff] = useState<EventStaff[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    loadAvailableOptions();
  }, [basicInfo.type, venueInfo.type]);

  useEffect(() => {
    calculatePrice();
  }, [selectedPackages, selectedServices, selectedStaff, basicInfo.expectedGuests]);

  const loadAvailableOptions = () => {
    const availablePackages = eventManager.getPackages(basicInfo.type, venueInfo.type);
    const availableServices = eventManager.getServices();
    const availableStaff = eventManager.getStaff();
    
    setPackages(availablePackages);
    setServices(availableServices);
    setStaff(availableStaff);
  };

  const calculatePrice = () => {
    const price = eventManager.calculateEventPrice(
      selectedPackages,
      selectedServices,
      selectedStaff,
      basicInfo.expectedGuests
    );
    setCalculatedPrice(price);
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!basicInfo.title || !basicInfo.type || !basicInfo.date || !basicInfo.startTime || !basicInfo.endTime) {
          setError('Please fill in all required fields');
          return false;
        }
        
        // Validate date is in future
        if (new Date(basicInfo.date) <= new Date()) {
          setError('Event date must be in the future');
          return false;
        }
        
        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(basicInfo.startTime) || !timeRegex.test(basicInfo.endTime)) {
          setError('Please enter valid time format (HH:MM)');
          return false;
        }
        
        // Validate end time is after start time
        if (basicInfo.startTime >= basicInfo.endTime) {
          setError('End time must be after start time');
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
        
      case 3:
        if (!venueInfo.id || !venueInfo.name) {
          setError('Please select a venue');
          return false;
        }
        
        // Check venue availability
        if (!eventManager.checkVenueAvailability(venueInfo.id, basicInfo.date, basicInfo.startTime, basicInfo.endTime)) {
          setError('Venue is not available for the selected date and time');
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

  const handlePackageToggle = (packageId: string) => {
    const exists = selectedPackages.find(p => p.packageId === packageId);
    if (exists) {
      setSelectedPackages(selectedPackages.filter(p => p.packageId !== packageId));
    } else {
      setSelectedPackages([...selectedPackages, { packageId, quantity: 1 }]);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    const exists = selectedServices.find(s => s.serviceId === serviceId);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
    } else {
      setSelectedServices([...selectedServices, { serviceId, quantity: 1 }]);
    }
  };

  const handleStaffToggle = (staffId: string) => {
    const exists = selectedStaff.find(s => s.staffId === staffId);
    if (exists) {
      setSelectedStaff(selectedStaff.filter(s => s.staffId !== staffId));
    } else {
      setSelectedStaff([...selectedStaff, { staffId, hours: 8 }]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      const event = eventManager.createEvent({
        title: basicInfo.title,
        type: basicInfo.type,
        description: basicInfo.description,
        customerInfo,
        venue: venueInfo,
        date: basicInfo.date,
        startTime: basicInfo.startTime,
        endTime: basicInfo.endTime,
        expectedGuests: basicInfo.expectedGuests,
        packages: selectedPackages.map(p => {
          const pkg = eventManager.getPackageById(p.packageId);
          return {
            packageId: p.packageId,
            quantity: p.quantity,
            price: pkg ? pkg.basePrice * p.quantity : 0
          };
        }),
        services: selectedServices.map(s => {
          const svc = eventManager.getServiceById(s.serviceId);
          let totalPrice = 0;
          if (svc) {
            switch (svc.unitType) {
              case 'fixed':
                totalPrice = svc.basePrice * s.quantity;
                break;
              case 'per_person':
                totalPrice = svc.basePrice * basicInfo.expectedGuests * s.quantity;
                break;
              case 'per_hour':
                totalPrice = svc.basePrice * s.quantity;
                break;
            }
          }
          return {
            serviceId: s.serviceId,
            quantity: s.quantity,
            unitPrice: svc ? svc.basePrice : 0,
            totalPrice
          };
        }),
        staff: selectedStaff.map(s => {
          const staffMember = eventManager.getStaffById(s.staffId);
          return {
            staffId: s.staffId,
            role: staffMember ? staffMember.role : 'support',
            hours: s.hours,
            rate: staffMember ? staffMember.hourlyRate : 0,
            totalCost: staffMember ? staffMember.hourlyRate * s.hours : 0
          };
        }),
        totalAmount: calculatedPrice,
        status: 'inquiry',
        paymentStatus: 'pending',
        specialRequirements: basicInfo.specialRequirements || undefined,
        timeline: [],
        createdBy: 'current_user' // This would come from auth
      });

      onSuccess?.(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Basic Event Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={basicInfo.title}
              onChange={(e) => setBasicInfo({...basicInfo, title: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="Enter event title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Event Type *
            </label>
            <select
              value={basicInfo.type}
              onChange={(e) => setBasicInfo({...basicInfo, type: e.target.value as keyof EventType})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            >
              <option value="WEDDING">Wedding</option>
              <option value="RECEPTION">Reception</option>
              <option value="ENGAGEMENT">Engagement</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="CORPORATE">Corporate</option>
              <option value="CONFERENCE">Conference</option>
              <option value="SEMINAR">Seminar</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="EXHIBITION">Exhibition</option>
              <option value="CULTURAL">Cultural</option>
              <option value="RELIGIOUS">Religious</option>
              <option value="SOCIAL">Social</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Event Date *
            </label>
            <input
              type="date"
              value={basicInfo.date}
              onChange={(e) => setBasicInfo({...basicInfo, date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Expected Guests *
            </label>
            <input
              type="number"
              value={basicInfo.expectedGuests}
              onChange={(e) => setBasicInfo({...basicInfo, expectedGuests: parseInt(e.target.value) || 1})}
              min="1"
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={basicInfo.startTime}
              onChange={(e) => setBasicInfo({...basicInfo, startTime: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={basicInfo.endTime}
              onChange={(e) => setBasicInfo({...basicInfo, endTime: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Description
          </label>
          <textarea
            value={basicInfo.description}
            onChange={(e) => setBasicInfo({...basicInfo, description: e.target.value})}
            rows={3}
            placeholder="Describe your event..."
            className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          />
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Special Requirements
          </label>
          <textarea
            value={basicInfo.specialRequirements}
            onChange={(e) => setBasicInfo({...basicInfo, specialRequirements: e.target.value})}
            rows={2}
            placeholder="Any special requirements or preferences..."
            className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          />
        </div>
      </div>
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
              Company (Optional)
            </label>
            <input
              type="text"
              value={customerInfo.company}
              onChange={(e) => setCustomerInfo({...customerInfo, company: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Address (Optional)
          </label>
          <textarea
            value={customerInfo.address}
            onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
            rows={2}
            placeholder="Customer address..."
            className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Venue Selection</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Venue Type *
            </label>
            <select
              value={venueInfo.type}
              onChange={(e) => setVenueInfo({...venueInfo, type: e.target.value as 'garden' | 'hall'})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            >
              <option value="garden">Marriage Garden</option>
              <option value="hall">Event Hall</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Venue Capacity Required *
            </label>
            <input
              type="number"
              value={venueInfo.capacity}
              onChange={(e) => setVenueInfo({...venueInfo, capacity: parseInt(e.target.value) || 1})}
              min="1"
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Venue Name *
          </label>
          <input
            type="text"
            value={venueInfo.name}
            onChange={(e) => setVenueInfo({...venueInfo, name: e.target.value})}
            className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            placeholder="Enter venue name"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Packages & Services</h3>
        
        {/* Packages */}
        <div className="mb-6">
          <h4 className="font-medium text-[#111827] mb-3">Available Packages</h4>
          {packages.length === 0 ? (
            <p className="text-[#9CA3AF]">No packages available for this event type</p>
          ) : (
            <div className="space-y-3">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPackages.some(p => p.packageId === pkg.id)
                      ? 'border-[#EDEBFF] bg-[#EDEBFF]/30'
                      : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
                  }`}
                  onClick={() => handlePackageToggle(pkg.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-[#111827]">{pkg.name}</h5>
                      <p className="text-sm text-[#6B7280]">{pkg.description}</p>
                    </div>
                    <p className="font-semibold text-[#111827]">${pkg.basePrice}</p>
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    <p>Duration: {pkg.duration} hours • Capacity: {pkg.capacity} guests</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pkg.includes.slice(0, 3).map((item, index) => (
                        <span key={index} className="text-xs bg-[#BBF7D0] text-[#16A34A] px-2 py-1 rounded">
                          {item}
                        </span>
                      ))}
                      {pkg.includes.length > 3 && (
                        <span className="text-xs text-[#9CA3AF]">+{pkg.includes.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Services */}
        <div>
          <h4 className="font-medium text-[#111827] mb-3">Additional Services</h4>
          {services.length === 0 ? (
            <p className="text-[#9CA3AF]">No services available</p>
          ) : (
            <div className="space-y-3">
              {services.map(service => (
                <div
                  key={service.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedServices.some(s => s.serviceId === service.id)
                      ? 'border-[#EDEBFF] bg-[#EDEBFF]/30'
                      : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-[#111827]">{service.name}</h5>
                      <p className="text-sm text-[#6B7280]">{service.description}</p>
                    </div>
                    <p className="font-semibold text-[#111827]">
                      ${service.basePrice}
                      {service.unitType === 'per_person' && '/person'}
                      {service.unitType === 'per_hour' && '/hour'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Event Summary</h3>
        
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Event Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Title:</span> {basicInfo.title}</p>
                <p><span className="font-medium">Type:</span> {basicInfo.type}</p>
                <p><span className="font-medium">Date:</span> {new Date(basicInfo.date).toLocaleDateString()}</p>
                <p><span className="font-medium">Time:</span> {basicInfo.startTime} - {basicInfo.endTime}</p>
                <p><span className="font-medium">Guests:</span> {basicInfo.expectedGuests}</p>
                <p><span className="font-medium">Venue:</span> {venueInfo.name}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Customer Information</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {customerInfo.name}</p>
                <p><span className="font-medium">Email:</span> {customerInfo.email}</p>
                <p><span className="font-medium">Phone:</span> {customerInfo.phone}</p>
                {customerInfo.company && <p><span className="font-medium">Company:</span> {customerInfo.company}</p>}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-[#111827] mb-3">Cost Breakdown</h4>
            <div className="space-y-2 text-sm">
              {selectedPackages.map(p => {
                const pkg = eventManager.getPackageById(p.packageId);
                return pkg ? (
                  <div key={p.packageId} className="flex justify-between">
                    <span>{pkg.name} × {p.quantity}</span>
                    <span>${pkg.basePrice * p.quantity}</span>
                  </div>
                ) : null;
              })}
              
              {selectedServices.map(s => {
                const svc = eventManager.getServiceById(s.serviceId);
                if (!svc) return null;
                
                let price = 0;
                switch (svc.unitType) {
                  case 'fixed':
                    price = svc.basePrice * s.quantity;
                    break;
                  case 'per_person':
                    price = svc.basePrice * basicInfo.expectedGuests * s.quantity;
                    break;
                  case 'per_hour':
                    price = svc.basePrice * s.quantity;
                    break;
                }
                
                return (
                  <div key={s.serviceId} className="flex justify-between">
                    <span>{svc.name} × {s.quantity}</span>
                    <span>${price}</span>
                  </div>
                );
              })}
              
              {selectedStaff.map(s => {
                const staffMember = eventManager.getStaffById(s.staffId);
                return staffMember ? (
                  <div key={s.staffId} className="flex justify-between">
                    <span>{staffMember.name} ({staffMember.role}) × {s.hours}h</span>
                    <span>${staffMember.hourlyRate * s.hours}</span>
                  </div>
                ) : null;
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="font-semibold text-lg">Total Amount:</span>
              <span className="font-bold text-lg text-[#6D5DFB]">${calculatedPrice}</span>
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
          <span className="text-sm font-medium text-[#111827]">Step {step} of 5</span>
          <span className="text-sm text-[#9CA3AF]">
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Customer Details'}
            {step === 3 && 'Venue Selection'}
            {step === 4 && 'Packages & Services'}
            {step === 5 && 'Review & Confirm'}
          </span>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
          <div 
            className="bg-[#6D5DFB] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
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
        {step === 5 && renderStep5()}
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
          
          {step < 5 ? (
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
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

