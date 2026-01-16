import { useState } from "react";
import { Room } from "@/actions/hotel";
import {
  GlassButton,
  GlassInput,
  GlassLabel,
  GlassSelect,
  GlassTextarea
} from "@/components/ui/glass/GlassFormComponents";
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
    formState: { errors }
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      number: initialData?.number || "",
      type: initialData?.type || "Standard",
      capacity: initialData?.capacity || 2,
      price: initialData?.price || 0,
      floor: initialData?.floor || 0,
      description: initialData?.description || ""
    }
  });

  const handleFormSubmit = (data: RoomFormData) => {
    onSubmit({
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
          <h3 className="text-lg font-semibold text-white/90">Room Information</h3>

          <div className="space-y-2">
            <GlassLabel htmlFor="number">Room Number *</GlassLabel>
            <GlassInput
              id="number"
              {...register("number")}
              placeholder="Enter room number"
            />
            {errors.number && (
              <p className="text-sm text-rose-400">{errors.number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <GlassLabel htmlFor="type">Room Type *</GlassLabel>
            <GlassSelect
              id="type"
              {...register("type")}
            >
              <option value="Standard" className="bg-[#1a1a1a] text-white">Standard</option>
              <option value="Deluxe" className="bg-[#1a1a1a] text-white">Deluxe</option>
              <option value="Suite" className="bg-[#1a1a1a] text-white">Suite</option>
              <option value="Executive" className="bg-[#1a1a1a] text-white">Executive</option>
            </GlassSelect>
            {errors.type && (
              <p className="text-sm text-rose-400">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <GlassLabel htmlFor="floor">Floor</GlassLabel>
            <GlassInput
              id="floor"
              type="number"
              min="0"
              {...register("floor", { valueAsNumber: true })}
            />
            {errors.floor && (
              <p className="text-sm text-rose-400">{errors.floor.message}</p>
            )}
          </div>
        </div>

        {/* Pricing & Capacity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white/90">Pricing & Capacity</h3>

          <div className="space-y-2">
            <GlassLabel htmlFor="price">Price per Night (₹) *</GlassLabel>
            <GlassInput
              id="price"
              type="number"
              min="0"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-sm text-rose-400">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <GlassLabel htmlFor="capacity">Capacity *</GlassLabel>
            <GlassInput
              id="capacity"
              type="number"
              min="1"
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-sm text-rose-400">{errors.capacity.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <GlassLabel htmlFor="description">Description</GlassLabel>
        <GlassTextarea
          id="description"
          {...register("description")}
          placeholder="Enter room description"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <GlassButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" disabled={loading}>
          {loading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update Room" : "Create Room")}
        </GlassButton>
      </div>
    </form>
  );
}

