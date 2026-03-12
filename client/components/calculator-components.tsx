"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TruckIcon,
  RocketIcon,
  StarIcon,
  ArrowRight01Icon,
  Alert01Icon,
  InformationCircleIcon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface CourierPartner {
  courier_name: string;
  courier_company_id: number;
  rating: number;
  estimated_delivery: string;
  delivery_in_days: string;
  chargeable_weight: number;
  rate: number;
  is_surface: boolean;
  mode: string;
  is_recommended: boolean;
  is_flagged?: boolean;
  courier_logo_url?: string;
}

export function CourierCard({ 
  courier, 
  onShipNow 
}: { 
  courier: CourierPartner; 
  onShipNow: (courier: CourierPartner) => void;
}) {
  const [imgError, setImgError] = useState(false);
  
  return (
    <Card
      className={cn(
        "transition-all duration-200 border-l-4",
        courier.is_recommended ? "border-l-primary shadow-md" : "border-l-transparent"
      )}
    >
      <div className="p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 flex items-center gap-5 w-full">
          {courier.courier_logo_url && !imgError ? (
            <img 
              src={courier.courier_logo_url} 
              alt={courier.courier_name}
              className="h-14 w-14 rounded-xl object-contain bg-white border shadow-sm"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              courier.is_recommended ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <HugeiconsIcon icon={courier.mode.toLowerCase() === "surface" ? TruckIcon : RocketIcon} size={28} />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">{courier.courier_name}</h3>
              {courier.is_recommended && (
                <Badge variant="default" className="text-[10px] px-2 py-0 uppercase">Best Match</Badge>
              )}
              {(courier as any).custom_tag && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 uppercase border-primary text-primary bg-primary/5">{(courier as any).custom_tag}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1 text-yellow-600">
                <HugeiconsIcon icon={StarIcon} className="h-3 w-3 fill-yellow-600" />
                {courier?.rating?.toFixed(1) || "N/A"}
              </span>
              <span>•</span>
              <span>{courier.mode}</span>
              <span>•</span>
              <span>{courier.chargeable_weight} KG</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Delivery ETA</p>
            <p className="text-sm font-bold">{courier.estimated_delivery}</p>
            <p className="text-[10px] text-green-600 font-bold uppercase">{courier.delivery_in_days} Days</p>
          </div>
          <div className="text-right min-w-[100px]">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rate</p>
            <p className="text-2xl font-black tabular-nums">₹{courier.rate.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Incl. GST</p>
          </div>
        </div>
        <div className="flex justify-end pt-4 pb-2 pr-6">
          <Button size="sm" className="font-bold shadow-sm" onClick={() => onShipNow(courier)}>
            Ship Now
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-1" />
          </Button>
        </div>
      </div>
      {courier.is_flagged && (
        <div className="px-6 py-2 bg-amber-50 border-t text-[10px] font-bold text-amber-800 flex items-center gap-2">
          <HugeiconsIcon icon={Alert01Icon} className="h-3 w-3" />
          RADAR WARNING: Higher operational stress at destination. Delivery may be delayed.
        </div>
      )}
    </Card>
  );
}

export function CalculationGuidelines() {
  return (
    <Card className="bg-muted/30 border-none shadow-none">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4" />
          Calculation Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ul className="space-y-2">
          {[
            "Rates are calculated based on the higher of dead weight or volumetric weight.",
            "Volumetric Weight Formula: (L x W x H) / 5000.",
            "Rate Calculator: if your package is 1kg or less, you'll be charged only for the actual weight even if volumetric weight is higher (only applicable for flyers).",
            "Estimated delivery dates are provided by partners and may vary based on conditions.",
            "Taxes and surcharges are included in the final displayed rate."
          ].map((text) => (
            <li key={text} className="flex gap-3 text-[11px] text-muted-foreground leading-relaxed">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
              {text}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
