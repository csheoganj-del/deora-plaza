"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BusinessUnit } from "@/lib/business-units";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Coffee,
  Wine,
  Hotel,
  Flower2,
  ChevronDown,
  Check,
} from "lucide-react";

interface BusinessUnitSwitcherProps {
  businessUnits: BusinessUnit[];
  currentUnitId?: string;
  onUnitChange?: (unitId: string) => void;
}

const getUnitIcon = (type: string) => {
  switch (type) {
    case 'cafe':
      return <Coffee className="h-4 w-4 mr-2" />;
    case 'restaurant':
    case 'bar':
      return <Wine className="h-4 w-4 mr-2" />;
    case 'hotel':
      return <Hotel className="h-4 w-4 mr-2" />;
    case 'marriage_garden':
      return <Flower2 className="h-4 w-4 mr-2" />;
    default:
      return <Coffee className="h-4 w-4 mr-2" />;
  }
};

export function BusinessUnitSwitcher({
  businessUnits,
  currentUnitId,
  onUnitChange,
}: BusinessUnitSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnit | undefined>(
    businessUnits.find((unit) => unit.id === currentUnitId) || businessUnits[0]
  );

  useEffect(() => {
    if (currentUnitId && businessUnits.length > 0) {
      const unit = businessUnits.find((unit) => unit.id === currentUnitId) || businessUnits[0];
      setSelectedUnit(unit);
    }
  }, [currentUnitId, businessUnits]);

  const handleUnitChange = (unit: BusinessUnit) => {
    setSelectedUnit(unit);
    if (onUnitChange) {
      onUnitChange(unit.id);
    }
    // Update URL with the selected unit
    const newPath = pathname.split('/').slice(0, 3).join('/');
    router.push(`${newPath}?unit=${unit.id}`);
  };

  if (!selectedUnit) return null;

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors"
          >
            {getUnitIcon(selectedUnit.type)}
            <span className="font-medium">{selectedUnit.name}</span>
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          {businessUnits.map((unit) => (
            <DropdownMenuItem
              key={unit.id}
              onClick={() => handleUnitChange(unit)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                {getUnitIcon(unit.type)}
                <span>{unit.name}</span>
              </div>
              {selectedUnit.id === unit.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

