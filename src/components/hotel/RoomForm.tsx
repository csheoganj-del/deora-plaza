"use client";

import { useState } from "react";
import { Room } from "@/actions/hotel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const roomSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  type: z.string().min(1, "Room type is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  floor: z.number().min(0, "Floor must be 0 or greater").optional(),
  description: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

type RoomFormProps = {
  onSubmit: (data: Omit<Room, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<Room>;
};

export default function RoomForm({
  onSubmit,
  onCancel,
  loading = false,
  initialData
}: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      number: initialData?.number || "",
      type: initialData?.type || "",
      capacity: initialData?.capacity || 2,
      price: initialData?.price || 0,
      floor: initialData?.floor || 0,
      description: initialData?.description || ""
    }
  });

  const handleFormSubmit = (data: RoomFormData) => {
    onSubmit({
      ...data,
      ...data,
      status: initialData?.status || "available", // Preserve status if editing, else default
      amenities: initialData?.amenities || [] // Preserve amenities if editing, else default
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Room Information</h3>

          <div className="space-y-2">
            <Label htmlFor="number">Room Number *</Label>
            <Input
              id="number"
              {...register("number")}
              placeholder="Enter room number"
            />
            {errors.number && (
              <p className="text-sm text-[#FEE2E2]0">{errors.number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Room Type *</Label>
            <Select
              onValueChange={(value) => setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Executive">Executive</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-[#FEE2E2]0">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor">Floor</Label>
            <Input
              id="floor"
              type="number"
              min="0"
              {...register("floor", { valueAsNumber: true })}
            />
            {errors.floor && (
              <p className="text-sm text-[#FEE2E2]0">{errors.floor.message}</p>
            )}
          </div>
        </div>

        {/* Pricing & Capacity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pricing & Capacity</h3>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Night (₹) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-sm text-[#FEE2E2]0">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-sm text-[#FEE2E2]0">{errors.capacity.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Enter room description"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update Room" : "Create Room")}
        </Button>
      </div>
    </form>
  );
}

