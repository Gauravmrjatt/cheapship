"use client";

import { useState } from "react";
import { useHttp } from "@/lib/hooks/use-http";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Location01Icon, 
  Add01Icon, 
  Delete01Icon, 
  PencilEdit01Icon,
  AddressBookIcon,
  InformationCircleIcon,
  RocketIcon,
  Loading03Icon
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { sileo } from "sileo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AddressFormDialog,
  PickupAddressFormDialog,
  AddressFormData,
  PickupAddressFormData,
} from "@/components/address-form-dialog";

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

export default function AddressesPage() {
  const http = useHttp();
  const queryClient = useQueryClient();
  
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const { data: addresses, isLoading } = useQuery<SavedAddress[]>(
    http.get(["saved-addresses"], "/addresses")
  );

  const { data: shiprocketPickups } = useQuery<any>(
    http.get(["shiprocket-pickup-locations"], "/addresses/pickup", true)
  );

  const shiprocketPickupLocations: ShiprocketPickupLocation[] = shiprocketPickups?.data?.shipping_address || [];

  const { mutate: deleteAddress, isPending: isDeleting } = useMutation(
    http.del("/addresses", {
      onSuccess: () => {
        sileo.success({ title: "Address deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
        setDeleteConfirmOpen(false);
        setAddressToDelete(null);
      },
    })
  );

  const { mutate: saveAddress, isPending: isSavingAddress } = useMutation(
    http.post("/addresses", {
      onSuccess: () => {
        sileo.success({ title: "Address saved successfully" });
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
        setAddressDialogOpen(false);
        setEditingAddress(null);
      },
      onError: (error: Error) => {
        sileo.error({ title: "Error", description: error.message || "Failed to save address" });
      },
    })
  );

  const { mutate: updateAddress, isPending: isUpdatingAddress } = useMutation(
    http.put("/addresses", {
      onSuccess: () => {
        sileo.success({ title: "Address updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
        setAddressDialogOpen(false);
        setEditingAddress(null);
      },
      onError: (error: Error) => {
        sileo.error({ title: "Error", description: error.message || "Failed to update address" });
      },
    })
  );

  const { mutate: savePickupLocation, isPending: isSavingPickup } = useMutation(
    http.post("/addresses/pickup", {
      onSuccess: (data: any) => {
        if (data.success) {
          sileo.success({ title: "Pickup location registered successfully" });
          queryClient.invalidateQueries({ queryKey: ["shiprocket-pickup-locations"] });
          setPickupDialogOpen(false);
        } else {
          let errorMsg = data.message || "Failed to register pickup location";
          try {
            const parsed = JSON.parse(data.message);
            if (typeof parsed === "object") {
              errorMsg = Object.values(parsed).flat().join(", ");
            }
          } catch (e) {}
          sileo.error({ title: "Error", description: errorMsg });
        }
      },
      onError: (error: Error) => {
        sileo.error({ title: "Error", description: error.message || "Failed to register pickup location" });
      },
    })
  );

  const handleOpenAddressDialog = (address?: SavedAddress) => {
    setEditingAddress(address || null);
    setAddressDialogOpen(true);
  };

  const handleCloseAddressDialog = () => {
    setAddressDialogOpen(false);
    setEditingAddress(null);
  };

  const handleAddressSubmit = (data: AddressFormData) => {
    if (editingAddress) {
      updateAddress({ id: editingAddress.id, ...data } as any);
    } else {
      saveAddress(data as any);
    }
  };

  const handlePickupSubmit = (data: PickupAddressFormData) => {
    savePickupLocation(data as any);
  };

  const handleDeleteClick = (id: string) => {
    setAddressToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (addressToDelete) {
      deleteAddress(addressToDelete as any);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48"><Skeleton className="h-full w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
            Address Book
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Manage your saved pickup and delivery locations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl gap-2 font-bold shadow-sm"
            onClick={() => setPickupDialogOpen(true)}
          >
            <HugeiconsIcon icon={RocketIcon} size={18} />
            Add Pickup Location
          </Button>
          <Button
            className="rounded-2xl gap-2 font-bold shadow-sm"
            onClick={() => handleOpenAddressDialog()}
          >
            <HugeiconsIcon icon={Add01Icon} size={18} />
            Add New Address
          </Button>
        </div>
      </div>

      {shiprocketPickupLocations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={RocketIcon} size={20} className="text-primary" />
              <CardTitle className="text-lg">Registered Pickup Locations</CardTitle>
            </div>
            <CardDescription>
              Shiprocket-registered locations for order pickups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shiprocketPickupLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="bg-background rounded-xl p-4 border border-border/50"
                >
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!addresses || addresses.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <HugeiconsIcon icon={AddressBookIcon} size={32} />
          </div>
          <h3 className="text-xl font-bold">No saved addresses</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            You haven&apos;t saved any addresses yet. Saved addresses will appear here for quick selection during order creation.
          </p>
          <Button
            variant="outline"
            className="mt-6 rounded-2xl"
            onClick={() => handleOpenAddressDialog()}
          >
            Create Your First Address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <Card key={addr.id} className="group hover:shadow-md transition-all duration-200 border-border/50">
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
                      onClick={() => handleOpenAddressDialog(addr)}
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(addr.id)}
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
          ))}
        </div>
      )}

      <Card className="bg-muted/30 border-none shadow-none">
        <CardHeader className="pb-3 pt-6">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4" />
            Address Book Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <ul className="space-y-2">
            {[
              "Set a default address to have it pre-filled in your new orders.",
              "Use labels like 'Home', 'Warehouse', or 'Office' to easily identify locations.",
              "You can save addresses directly from the 'Create Order' screen by checking the 'Save Address' box.",
              "Register pickup locations with Shiprocket to enable order pickups from your warehouses."
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-[11px] text-muted-foreground leading-relaxed">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AddressFormDialog
        open={addressDialogOpen}
        onOpenChange={handleCloseAddressDialog}
        editingAddress={editingAddress}
        onSubmit={handleAddressSubmit}
        isPending={isSavingAddress || isUpdatingAddress}
      />

      <PickupAddressFormDialog
        open={pickupDialogOpen}
        onOpenChange={setPickupDialogOpen}
        onSubmit={handlePickupSubmit}
        isPending={isSavingPickup}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={16} />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
