"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  RocketIcon
} from "@hugeicons/core-free-icons";

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  email?: string;
  complete_address: string;
  city: string;
  state: string;
  pincode: string;
  address_label?: string;
  is_default: boolean;
  country?: string;
}

interface ShiprocketPickupLocation {
  pickup_location: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string | number;
}

export function AddressCard({ 
  addr, 
  onEdit, 
  onDelete 
}: { 
  addr: SavedAddress; 
  onEdit: (addr: SavedAddress) => void; 
  onDelete: (id: string) => void; 
}) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{addr.name}</p>
              {addr.is_default && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 uppercase">Default</Badge>
              )}
            </div>
            {addr.address_label && (
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{addr.address_label}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onEdit(addr)}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(addr.id)}
            >
              <HugeiconsIcon icon={Delete01Icon} size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 text-sm">
          <HugeiconsIcon icon={Location01Icon} size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-muted-foreground leading-relaxed">
            {addr.complete_address},<br />
            {addr.city}, {addr.state} - {addr.pincode}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-xs font-medium border-t pt-4">
          <p className="text-muted-foreground">Phone: <span className="text-foreground">{addr.phone}</span></p>
          {addr.email && <p className="text-muted-foreground">Email: <span className="text-foreground">{addr.email}</span></p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function PickupLocationCard({ loc }: { loc: ShiprocketPickupLocation }) {
  return (
    <div className="bg-background rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">{loc.pickup_location}</span>
        <Badge variant="outline" className="text-[10px]">{loc.city}</Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {loc.address}, {loc.city}, {loc.state} - {loc.pin_code}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {loc.phone}
      </p>
    </div>
  );
}
