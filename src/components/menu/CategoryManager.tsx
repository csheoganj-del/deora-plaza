"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit, Plus, FolderTree } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory, updateCategoryOrder, Category } from "@/actions/categories";
import { useToast } from "@/hooks/use-toast";

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    businessUnit?: string;
}

export function CategoryManager({ isOpen, onClose, businessUnit }: CategoryManagerProps) {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [parentId, setParentId] = useState<string>("none");
    const [unit, setUnit] = useState(businessUnit || "all");

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingCategory) {
            setName(editingCategory.name);
            setParentId(editingCategory.parent_id || "none");
            setUnit(editingCategory.business_unit);
        } else {
            setName("");
            setParentId("none");
            setUnit(businessUnit || "all");
        }
    }, [editingCategory, businessUnit]);

    const loadCategories = async () => {
        setIsLoading(true);
        const data = await getCategories("all");
        setCategories(data);
        setIsLoading(false);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && over?.id) {
            // Calculate new order based on current state
            const oldIndex = categories.findIndex((item) => item.id === active.id);
            const newIndex = categories.findIndex((item) => item.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const newOrder = arrayMove(categories, oldIndex, newIndex);

            // Update UI optimistically
            setCategories(newOrder);

            // Call server action separately
            const updates = newOrder.map((item, index) => ({
                id: item.id,
                sort_order: index
            }));

            const result = await updateCategoryOrder(updates);
            if (!result.success) {
                toast({ title: "Failed to save order", variant: "destructive" });
                // Revert on failure
                loadCategories();
            }
        }
    };

    const handleSubmit = async () => {
        if (!name) return;

        const payload = {
            name,
            parent_id: parentId === "none" ? null : parentId,
            business_unit: unit,
            sort_order: categories.length // Append to end
        };

        let result;
        if (editingCategory) {
            result = await updateCategory(editingCategory.id, payload);
        } else {
            result = await createCategory(payload);
        }

        if (result.success) {
            toast({
                title: editingCategory ? "Category updated" : "Category created",
                variant: "default",
            });
            setEditingCategory(null);
            setName(""); // Reset form
            loadCategories();
        } else {
            toast({
                title: "Failed to save category",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this category? Items in this category will become uncategorized.")) {
            const result = await deleteCategory(id);
            if (result.success) {
                toast({
                    title: "Category deleted",
                    variant: "default",
                });
                loadCategories();
            } else {
                toast({
                    title: "Failed to delete",
                    variant: "destructive",
                });
            }
        }
    };

    const parentOptions = categories.filter(c => !c.parent_id && c.id !== editingCategory?.id);
    const parentCategories = categories.filter(c => !c.parent_id);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderTree className="h-5 w-5" />
                        Manage Categories
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 gap-6 overflow-hidden min-h-[300px]">
                    {/* Left: List with DND */}
                    <div className="flex-1 overflow-y-auto border rounded-md p-2 space-y-2">
                        {categories.length === 0 && <div className="text-center text-[#9CA3AF] py-4">No categories found.</div>}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={parentCategories.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {parentCategories.map(parent => (
                                    <SortableCategoryRow
                                        key={parent.id}
                                        category={parent}
                                        onEdit={setEditingCategory}
                                        onDelete={handleDelete}
                                    >
                                        {categories.filter(c => c.parent_id === parent.id).map(child => (
                                            <div key={child.id} className="flex items-center justify-between p-2 bg-white rounded border border-dashed text-sm group hover:border-[#6D5DFB]">
                                                <span>{child.name}</span>
                                                <div className="flex gap-1 opacity-50 group-hover:opacity-100">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingCategory(child)}><Edit className="h-3 w-3" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-[#FEE2E2]0" onClick={() => handleDelete(child.id)}><Trash2 className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </SortableCategoryRow>
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Right: Form */}
                    <div className="w-64 space-y-4 shrink-0 bg-[#F8FAFC] p-4 rounded-lg h-fit">
                        <h3 className="font-semibold text-sm">{editingCategory ? "Edit Category" : "Add New Category"}</h3>

                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Starters" />
                        </div>

                        <div className="space-y-2">
                            <Label>Parent (Optional)</Label>
                            <Select value={parentId} onValueChange={setParentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Top Level)</SelectItem>
                                    {parentOptions.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Business Unit</Label>
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="restaurant">Restaurant</SelectItem>
                                    <SelectItem value="bar">Bar</SelectItem>
                                    <SelectItem value="hotel">Hotel</SelectItem>
                                    <SelectItem value="garden">Garden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button className="w-full" onClick={handleSubmit}>
                                {editingCategory ? "Update" : "Create"}
                            </Button>
                            {editingCategory && (
                                <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SortableCategoryRow({ category, onEdit, onDelete, children }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="space-y-1 touch-none">
            <div className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded border group hover:border-[#6D5DFB] transition-all">
                <div className="flex items-center gap-2">
                    <div {...attributes} {...listeners} className="cursor-grab text-[#9CA3AF] hover:text-[#6B7280] p-1">
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">{category.name}</span>
                </div>
                <div className="flex gap-1 opacity-50 group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(category)}><Edit className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-[#FEE2E2]0" onClick={() => onDelete(category.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
            </div>
            <div className="pl-6 space-y-1 border-l-2 border-[#F1F5F9] ml-2">
                {children}
            </div>
        </div>
    );
}

