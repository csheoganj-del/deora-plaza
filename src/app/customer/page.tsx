"use client";

import React, { useState, useEffect } from "react";
import { BusinessUnitType } from "@/lib/business-units";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import {
  Coffee,
  Wine,
  Hotel,
  Flower2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Users,
  ChefHat,
  Utensils,
  BedDouble,
  Car,
  Wifi,
  Dumbbell,
  Gift,
  Percent,
  ArrowRight,
  CheckCircle
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  businessUnit: BusinessUnitType;
}

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  capacity: number;
  amenities: string[];
  image?: string;
}

interface EventPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  duration: string;
  features: string[];
  businessUnit: BusinessUnitType;
}

export default function CustomerWebsite() {
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnitType | 'all'>('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [eventPackages, setEventPackages] = useState<EventPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = () => {
    setLoading(true);
    
    // Mock menu items
    const mockMenuItems: MenuItem[] = [
      { id: '1', name: 'Cappuccino', description: 'Rich espresso with steamed milk foam', price: 4.50, category: 'Coffee', businessUnit: BusinessUnitType.CAFE },
      { id: '2', name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with herbs', price: 28.00, category: 'Main Course', businessUnit: BusinessUnitType.RESTAURANT },
      { id: '3', name: 'Craft Beer', description: 'Local brewery selection', price: 6.00, category: 'Beverage', businessUnit: BusinessUnitType.BAR },
      { id: '4', name: 'Caesar Salad', description: 'Classic Caesar with romaine lettuce', price: 12.00, category: 'Salad', businessUnit: BusinessUnitType.RESTAURANT },
      { id: '5', name: 'Espresso', description: 'Strong Italian espresso shot', price: 3.00, category: 'Coffee', businessUnit: BusinessUnitType.CAFE }
    ];

    // Mock rooms
    const mockRooms: Room[] = [
      { id: '1', name: 'Deluxe Suite', type: 'Suite', price: 250, capacity: 2, amenities: ['WiFi', 'Mini Bar', 'Balcony', 'Spa Access'] },
      { id: '2', name: 'Executive Room', type: 'Standard', price: 150, capacity: 2, amenities: ['WiFi', 'Work Desk', 'Coffee Maker'] },
      { id: '3', name: 'Presidential Suite', type: 'Suite', price: 450, capacity: 4, amenities: ['WiFi', 'Mini Bar', 'Balcony', 'Spa Access', 'Butler Service'] }
    ];

    // Mock event packages
    const mockEventPackages: EventPackage[] = [
      { id: '1', name: 'Wedding Package', description: 'Complete wedding ceremony and reception', price: 15000, capacity: 200, duration: 'Full Day', features: ['Catering', 'Decoration', 'Photography', 'Music'], businessUnit: BusinessUnitType.MARRIAGE_GARDEN },
      { id: '2', name: 'Corporate Event', description: 'Professional corporate meeting package', price: 8000, capacity: 100, duration: 'Half Day', features: ['AV Equipment', 'Catering', 'Parking'], businessUnit: BusinessUnitType.MARRIAGE_GARDEN },
      { id: '3', name: 'Birthday Celebration', description: 'Complete birthday party setup', price: 3000, capacity: 50, duration: '4 Hours', features: ['Decoration', 'Cake', 'Music', 'Games'], businessUnit: BusinessUnitType.MARRIAGE_GARDEN }
    ];

    setMenuItems(mockMenuItems);
    setRooms(mockRooms);
    setEventPackages(mockEventPackages);
    setLoading(false);
  };

  const getBusinessUnitIcon = (unit: BusinessUnitType) => {
    switch (unit) {
      case BusinessUnitType.CAFE: return Coffee;
      case BusinessUnitType.RESTAURANT: return Utensils;
      case BusinessUnitType.BAR: return Wine;
      case BusinessUnitType.HOTEL: return Hotel;
      case BusinessUnitType.MARRIAGE_GARDEN: return Flower2;
      default: return Coffee;
    }
  };

  const getBusinessUnitName = (unit: BusinessUnitType) => {
    return unit.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredMenuItems = selectedBusinessUnit === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.businessUnit === selectedBusinessUnit);

  const filteredRooms = rooms;
  const filteredEventPackages = selectedBusinessUnit === 'all' 
    ? eventPackages 
    : eventPackages.filter(pkg => pkg.businessUnit === selectedBusinessUnit);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D5DFB]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section id="main" className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6D5DFB]/60 to-[#EDEBFF]/60 z-10"></div>
        <div className="absolute inset-0">
          <video
            className="w-full h-full object-cover motion-reduce:hidden"
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          >
            <source src="https://videos.pexels.com/video-files/5494472/5494472-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Experience Luxury at Deora Plaza
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Where modern hospitality meets timeless elegance across our premium facilities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#6D5DFB] hover:bg-[#F1F5F9]">
              Reserve Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#6D5DFB]">
              Virtual Tour
            </Button>
          </div>
        </div>
      </section>

      {/* Business Unit Filter */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedBusinessUnit('all')}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedBusinessUnit === 'all' 
                  ? 'bg-[#6D5DFB] text-white' 
                  : 'bg-[#F1F5F9] text-[#111827] hover:bg-[#E5E7EB]'
              }`}
            >
              All Services
            </button>
            {[BusinessUnitType.CAFE, BusinessUnitType.RESTAURANT, BusinessUnitType.BAR, BusinessUnitType.HOTEL, BusinessUnitType.MARRIAGE_GARDEN].map(unit => (
              <button
                key={unit}
                onClick={() => setSelectedBusinessUnit(unit)}
                className={`px-6 py-2 rounded-full transition-colors flex items-center gap-2 ${
                  selectedBusinessUnit === unit 
                    ? 'bg-[#6D5DFB] text-white' 
                    : 'bg-[#F1F5F9] text-[#111827] hover:bg-[#E5E7EB]'
                }`}
              >
                {React.createElement(getBusinessUnitIcon(unit), { className: "h-4 w-4" })}
                {getBusinessUnitName(unit)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dining Section */}
      <section id="dining" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">Culinary Excellence</h2>
            <p className="text-xl text-[#6B7280]">Discover our exceptional dining experiences</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-[#6D5DFB]/20 to-[#EDEBFF]/20 flex items-center justify-center">
                  {React.createElement(getBusinessUnitIcon(item.businessUnit), { className: "h-16 w-16 text-[#6D5DFB]" })}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-[#111827]">{item.name}</h3>
                    <span className="text-lg font-bold text-[#6D5DFB]">${item.price}</span>
                  </div>
                  <p className="text-[#6B7280] mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9CA3AF] bg-[#F1F5F9] px-3 py-1 rounded-full">
                      {getBusinessUnitName(item.businessUnit)}
                    </span>
                    <Button size="sm">Order Now</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accommodation Section */}
      <section id="accommodation" className="py-16 bg-[#F1F5F9]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">Luxury Accommodation</h2>
            <p className="text-xl text-[#6B7280]">Relax in our premium rooms and suites</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-[#FDE68A] to-orange-100 flex items-center justify-center">
                  <BedDouble className="h-16 w-16 text-[#F59E0B]" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-[#111827]">{room.name}</h3>
                      <p className="text-[#9CA3AF]">{room.type}</p>
                    </div>
                    <span className="text-lg font-bold text-[#6D5DFB]">${room.price}/night</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 text-sm text-[#6B7280]">
                    <Users className="h-4 w-4" />
                    <span>Up to {room.capacity} guests</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="text-xs bg-[#F1F5F9] px-2 py-1 rounded-full text-[#6B7280]">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs bg-[#F1F5F9] px-2 py-1 rounded-full text-[#6B7280]">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                  <Button className="w-full">Book Room</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">Memorable Events</h2>
            <p className="text-xl text-[#6B7280]">Host your special occasions with us</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEventPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-[#FBCFE8] to-[#EDEBFF] flex items-center justify-center">
                  <Flower2 className="h-16 w-16 text-[#C084FC]" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-[#111827]">{pkg.name}</h3>
                    <span className="text-lg font-bold text-[#6D5DFB]">${pkg.price}</span>
                  </div>
                  <p className="text-[#6B7280] mb-4">{pkg.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-[#6B7280]">
                      <Users className="h-4 w-4" />
                      <span>{pkg.capacity} guests</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6B7280]">
                      <Clock className="h-4 w-4" />
                      <span>{pkg.duration}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.features.slice(0, 2).map((feature, index) => (
                      <span key={index} className="text-xs bg-[#F1F5F9] px-2 py-1 rounded-full text-[#6B7280]">
                        {feature}
                      </span>
                    ))}
                    {pkg.features.length > 2 && (
                      <span className="text-xs bg-[#F1F5F9] px-2 py-1 rounded-full text-[#6B7280]">
                        +{pkg.features.length - 2} more
                      </span>
                    )}
                  </div>
                  <Button className="w-full">Book Event</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#F1F5F9]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">Why Choose Deora Plaza</h2>
            <p className="text-xl text-[#6B7280]">Experience the difference</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Star, title: "Premium Quality", desc: "5-star service and facilities" },
              { icon: Wifi, title: "Modern Amenities", desc: "Latest technology and comfort" },
              { icon: Users, title: "Expert Staff", desc: "Professional and courteous team" },
              { icon: Gift, title: "Loyalty Rewards", desc: "Exclusive member benefits" }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-[#6D5DFB]" />
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-2">{feature.title}</h3>
                <p className="text-[#6B7280]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">Get in Touch</h2>
            <p className="text-xl text-[#6B7280]">We're here to help with your queries</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-[#6D5DFB]" />
              </div>
              <h3 className="text-xl font-semibold text-[#111827] mb-2">Phone</h3>
              <p className="text-[#6B7280]">+1 (555) 123-4567</p>
              <p className="text-[#6B7280]">24/7 Support Available</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-[#6D5DFB]" />
              </div>
              <h3 className="text-xl font-semibold text-[#111827] mb-2">Email</h3>
              <p className="text-[#6B7280]">info@deoraplaza.com</p>
              <p className="text-[#6B7280]">reservations@deoraplaza.com</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-[#6D5DFB]" />
              </div>
              <h3 className="text-xl font-semibold text-[#111827] mb-2">Location</h3>
              <p className="text-[#6B7280]">123 Plaza Drive</p>
              <p className="text-[#6B7280]">City, State 12345</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

