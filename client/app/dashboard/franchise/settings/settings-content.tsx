"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useUser, useUpdateMyCommissionRate, useSetDefaultPickup } from "@/lib/hooks/use-user";
import { useHttp } from "@/lib/hooks/use-http";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    PercentIcon,
    Location01Icon,
    CheckmarkCircle01Icon,
    Settings02Icon,
    Loading03Icon,
    HelpCircleIcon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface Address {
    id: string;
    name: string;
    complete_address: string;
    city: string;
    pincode: string;
    pickup_nickname?: string;
}

export default function FranchiseSettingsPage() {
    const http = useHttp();
    const { data: user, isLoading: loadingUser } = useUser();
    const { data: addresses, isLoading: loadingAddresses } = useQuery<Address[]>(
        http.get(["saved-addresses"], "/addresses")
    );

    const updateRate = useUpdateMyCommissionRate();
    const setDefaultPickup = useSetDefaultPickup();

    const [rate, setRate] = useState<number>(0);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");

    useEffect(() => {
        if (user) {
            setRate(user.commission_rate || 5);
            setSelectedAddressId(user.default_referred_pickup_id || "");
        }
    }, [user]);

    const handleSaveRate = () => {
        updateRate.mutate(rate);
    };

    const handleSaveAddress = () => {
        setDefaultPickup.mutate(selectedAddressId);
    };

    if (loadingUser || loadingAddresses) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    const minRate = user?.min_commission_rate || 0;
    const maxRate = user?.max_commission_rate || 100;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Franchise & Referral Settings</h1>
                <p className="text-muted-foreground">Configure how your network earns and registers</p>
            </div>

            <div className="grid gap-8">
                {/* Commission Rate Section */}
                <Card className="border-primary/10 overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-background rounded-xl border border-primary/20 text-primary shadow-sm">
                                <HugeiconsIcon icon={PercentIcon} size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Commission Sharing</CardTitle>
                                <CardDescription>Adjust the profit percentage you provide to your referred partners</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="space-y-4 flex-1 w-full">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="commission-rate" className="text-sm font-bold uppercase tracking-wider">Your Active Sharing Rate (%)</Label>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        Current: {user?.commission_rate || 0}%
                                    </Badge>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="commission-rate"
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                                        min={minRate}
                                        max={maxRate}
                                        className="h-12 text-xl font-bold pl-4 pr-12 focus-visible:ring-primary shadow-sm"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        <HugeiconsIcon icon={PercentIcon} size={20} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
                                    <span>Minimum: {minRate}%</span>
                                    <span>Maximum: {maxRate}%</span>
                                </div>
                            </div>
                            <Button
                                onClick={handleSaveRate}
                                className="w-full md:w-auto h-12 px-8 font-bold gap-2"
                                disabled={updateRate.isPending || rate === user?.commission_rate}
                            >
                                {updateRate.isPending ? <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />}
                                Update Rate
                            </Button>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-xl border flex gap-3">
                            <HugeiconsIcon icon={HelpCircleIcon} size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                When a user registers using your code, they will initially pay prices based on this commission rate. You can later adjust individual rates for your partners in the <span className="text-primary font-semibold">Partners</span> tab.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Auto-Assign Pickup Section */}
                <Card className="border-secondary/10 overflow-hidden">
                    <CardHeader className="bg-secondary/5 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-background rounded-xl border border-secondary/20 text-secondary shadow-sm">
                                <HugeiconsIcon icon={Location01Icon} size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Default Pickup Address</CardTitle>
                                <CardDescription>New recruits will automatically have this address added to their account</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
                            <div className="space-y-2 flex-1 w-full">
                                <Label className="text-sm font-bold uppercase tracking-wider">Select Referral Pickup Template</Label>
                                <Select value={selectedAddressId} onValueChange={(val: string | null) => val && setSelectedAddressId(val)}>
                                    <SelectTrigger className="h-12 shadow-sm border-muted-foreground/20">
                                        <SelectValue placeholder="Select an address from your book" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {addresses?.map((addr) => (
                                            <SelectItem key={addr.id} value={addr.id}>
                                                {addr.pickup_nickname || addr.name} - {addr.city} ({addr.pincode})
                                            </SelectItem>
                                        ))}
                                        {!addresses?.length && (
                                            <SelectItem value="none" disabled>No addresses found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedAddressId && addresses && (
                                    <p className="text-[11px] text-muted-foreground px-1 mt-2">
                                        <span className="font-semibold">Full Address:</span> {addresses.find(a => a.id === selectedAddressId)?.complete_address}
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handleSaveAddress}
                                className="w-full md:w-auto h-12 px-8 font-bold gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                                disabled={setDefaultPickup.isPending || selectedAddressId === user?.default_referred_pickup_id}
                            >
                                {setDefaultPickup.isPending ? <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" /> : <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />}
                                Set as Default
                            </Button>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-xl border flex gap-3">
                            <HugeiconsIcon icon={Settings02Icon} size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This feature is perfect for providing a white-labeled experience. When your referral signs up, they won't need to manually configure their first warehouse—it'll be ready for them to ship immediately.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Badge({ children, variant = "primary", className }: any) {
    return (
        <div className={cn(
            "px-2 py-0.5 rounded text-xs font-bold",
            variant === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            className
        )}>
            {children}
        </div>
    );
}
