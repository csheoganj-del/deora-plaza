"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  Plus,
  Reply,
} from "lucide-react";

interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  businessUnit: string;
  category: 'food' | 'service' | 'ambiance' | 'price' | 'general';
  date: string;
  helpful: number;
  notHelpful: number;
  status: 'new' | 'reviewed' | 'responded';
  response?: string;
}

export function CustomerFeedback() {
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        // Mock data - replace with actual API call
        const mockFeedback: Feedback[] = [
          {
            id: '1',
            customerName: 'John Doe',
            rating: 5,
            comment: 'Excellent coffee and great service! The atmosphere is perfect for working.',
            businessUnit: 'cafe',
            category: 'food',
            date: '2024-01-15',
            helpful: 12,
            notHelpful: 1,
            status: 'new',
          },
          {
            id: '2',
            customerName: 'Jane Smith',
            rating: 3,
            comment: 'Food was good but service was slow. Had to wait 30 minutes for my order.',
            businessUnit: 'restaurant',
            category: 'service',
            date: '2024-01-14',
            helpful: 8,
            notHelpful: 3,
            status: 'reviewed',
          },
          {
            id: '3',
            customerName: 'Mike Johnson',
            rating: 4,
            comment: 'Great selection of wines but prices are a bit high. Staff is knowledgeable.',
            businessUnit: 'bar',
            category: 'price',
            date: '2024-01-13',
            helpful: 15,
            notHelpful: 2,
            status: 'responded',
            response: 'Thank you for your feedback! We offer happy hour specials on weekdays.',
          },
          {
            id: '4',
            customerName: 'Sarah Wilson',
            rating: 2,
            comment: 'Room was not clean and AC was not working properly.',
            businessUnit: 'hotel',
            category: 'general',
            date: '2024-01-12',
            helpful: 6,
            notHelpful: 4,
            status: 'responded',
            response: 'We apologize for the inconvenience. We have addressed the maintenance issues.',
          },
          {
            id: '5',
            customerName: 'David Brown',
            rating: 5,
            comment: 'Perfect venue for our wedding! Beautiful decorations and excellent catering.',
            businessUnit: 'marriage_garden',
            category: 'ambiance',
            date: '2024-01-11',
            helpful: 20,
            notHelpful: 0,
            status: 'responded',
            response: 'Thank you for choosing us for your special day!',
          },
        ];
        setFeedback(mockFeedback);
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-[#F59E0B] text-[#F59E0B]400' : 'text-[#9CA3AF]'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: Feedback['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-[#EDEBFF]/30 text-[#6D5DFB]">New</Badge>;
      case 'reviewed':
        return <Badge variant="default" className="bg-[#F59E0B]/10 text-[#F59E0B]800">Reviewed</Badge>;
      case 'responded':
        return <Badge variant="default" className="bg-[#BBF7D0] text-green-800">Responded</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: Feedback['category']) => {
    const colors = {
      food: 'bg-orange-100 text-orange-800',
      service: 'bg-[#EDEBFF]/30 text-[#6D5DFB]',
      ambiance: 'bg-[#EDEBFF] text-purple-800',
      price: 'bg-[#BBF7D0] text-green-800',
      general: 'bg-[#F1F5F9] text-[#111827]',
    };
    
    return (
      <Badge variant="default" className={colors[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = item.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesRating = selectedRating === 'all' || item.rating.toString() === selectedRating;
    return matchesSearch && matchesCategory && matchesRating;
  });

  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: feedback.filter(item => item.rating === rating).length,
    percentage: feedback.length > 0 
      ? (feedback.filter(item => item.rating === rating).length / feedback.length) * 100 
      : 0,
  }));

  const handleRespond = (feedbackId: string) => {
    if (!responseText.trim()) return;
    
    setFeedback(feedback.map(item => 
      item.id === feedbackId 
        ? { ...item, status: 'responded' as const, response: responseText }
        : item
    ));
    setRespondingTo(null);
    setResponseText('');
  };

  const handleHelpful = (feedbackId: string, isHelpful: boolean) => {
    setFeedback(feedback.map(item => 
      item.id === feedbackId 
        ? { 
            ...item, 
            helpful: isHelpful ? item.helpful + 1 : item.helpful,
            notHelpful: !isHelpful ? item.notHelpful + 1 : item.notHelpful,
          }
        : item
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Customer Feedback</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div className="premium-card" key={i}>
              <div className="p-8 border-b border-[#E5E7EB]">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="p-8">
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-8">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Customer Feedback</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Feedback
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Average Rating</h2>
            <Star className="h-4 w-4 text-[#F59E0B]400" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">{averageRating}</div>
            <div className="flex items-center mt-1">
              {renderStars(Math.round(parseFloat(averageRating)))}
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Total Reviews</h2>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">{feedback.length}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">New Reviews</h2>
            <Users className="h-4 w-4 text-[#6D5DFB]" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#6D5DFB]">
              {feedback.filter(item => item.status === 'new').length}
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Responded</h2>
            <Reply className="h-4 w-4 text-[#DCFCE7]0" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#22C55E]">
              {feedback.filter(item => item.status === 'responded').length}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827]">Rating Distribution</h2>
          </div>
          <div className="p-8">
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]400" />
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                      <div
                        className="bg-[#F59E0B]/10400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827]">Feedback by Category</h2>
          </div>
          <div className="p-8">
            <div className="space-y-3">
              {['food', 'service', 'ambiance', 'price', 'general'].map(category => {
                const count = feedback.filter(item => item.category === category).length;
                const percentage = feedback.length > 0 ? (count / feedback.length) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <div className="w-20">
                      {getCategoryBadge(category as Feedback['category'])}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                        <div
                          className="bg-[#6D5DFB] h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Filters</h2>
        </div>
        <div className="p-8">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Categories</option>
                <option value="food">Food</option>
                <option value="service">Service</option>
                <option value="ambiance">Ambiance</option>
                <option value="price">Price</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="rating">Rating</Label>
              <select
                id="rating"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.map((item) => (
          <div className="premium-card" key={item.id}>
            <div className="p-8 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{item.customerName}</h3>
                    {renderStars(item.rating)}
                    {getStatusBadge(item.status)}
                    {getCategoryBadge(item.category)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.businessUnit} • {item.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.status !== 'responded' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRespondingTo(item.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Respond
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8">
              <p className="mb-4">{item.comment}</p>
              
              {item.response && (
                <div className="bg-[#EDEBFF]/30 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-[#6D5DFB] mb-1">Response:</p>
                  <p className="text-sm text-[#6D5DFB]">{item.response}</p>
                </div>
              )}

              {respondingTo === item.id && (
                <div className="space-y-3">
                  <Label htmlFor={`response-${item.id}`}>Your Response</Label>
                  <Textarea
                    id={`response-${item.id}`}
                    placeholder="Type your response..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRespond(item.id)}>
                      Send Response
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRespondingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Was this helpful?</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleHelpful(item.id, true)}
                    className="flex items-center gap-1"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    {item.helpful}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleHelpful(item.id, false)}
                    className="flex items-center gap-1"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    {item.notHelpful}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

