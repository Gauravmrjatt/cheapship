"use client";

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
  CheckmarkCircle01Icon,
  AddressBookIcon,
  InformationCircleIcon
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export default function AddressesPage() {
  const http = useHttp();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery<SavedAddress[]>(
    http.get(["saved-addresses"], "/addresses")
  );

  const { mutate: deleteAddress } = useMutation(
    http.del("/addresses", {
      onSuccess: () => {
        toast.success("Address deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      },
    })
  );

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
        <Button className="rounded-2xl gap-2 font-bold shadow-sm">
          <HugeiconsIcon icon={Add01Icon} size={18} />
          Add New Address
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <HugeiconsIcon icon={AddressBookIcon} size={32} />
          </div>
          <h3 className="text-xl font-bold">No saved addresses</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            You haven't saved any addresses yet. Saved addresses will appear here for quick selection during order creation.
          </p>
          <Button variant="outline" className="mt-6 rounded-2xl">
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this address?")) {
                          deleteAddress(addr.id as any);
                        }
                      }}
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
              "You can save addresses directly from the 'Create Order' screen by checking the 'Save Address' box."
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-[11px] text-muted-foreground leading-relaxed">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
