"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { franchiseSchema, type Franchise } from "@/lib/validators/franchise";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserGroupIcon, 
  PlusSignIcon, 
  Store01Icon, 
  SmartPhone01Icon,
  ContactIcon,
  Mail01Icon,
  Location01Icon
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const dummyFranchises = [
  { id: "VXVF_tFA6q", fullName: "Mukesh", type: "DIRECT_SELLER", phone: "+91-9251120521" },
  { id: "VXVF_Cg15f", fullName: "Mukul", type: "DIRECT_SELLER", phone: "+91-9024501872" },
  { id: "VXVF_2EYLZ", fullName: "Dr Rammy", type: "DIRECT_SELLER", phone: "+91-8708951717" },
];

export default function FranchaisePage() {
  const [franchises, setFranchises] = useState(dummyFranchises);
  
  const form = useForm({
    resolver: zodResolver(franchiseSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      type: "DIRECT_SELLER" as const,
      address: "",
      pincode: "",
      city: "",
      state: "",
    },
  });

  const onSubmit = (data: any) => {
    const newFranchise = {
      id: `VXVF_${Math.random().toString(36).substr(2, 5)}`,
      fullName: data.fullName,
      type: data.type,
      phone: `+91-${data.phone}`,
    };
    setFranchises([newFranchise, ...franchises]);
    toast.success("Franchise created successfully!");
    form.reset();
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <HugeiconsIcon icon={UserGroupIcon} size={24} className="text-primary" />
          Franchaise Management
        </h1>
        <p className="text-sm text-muted-foreground">Expand your distribution network with certified partners</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Section - Dashboard Card Style */}
        <Card className="lg:col-span-7 rounded-2xl border-none ring-1 ring-foreground/10 shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm">
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HugeiconsIcon icon={PlusSignIcon} size={18} className="text-primary" />
              Onboard Partner
            </CardTitle>
            <CardDescription className="text-xs">Fill in the certified entity details</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">Legal Name</FieldLabel>
                  <Input {...form.register("fullName")} placeholder="Full Name" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                  <FieldError>{form.formState.errors.fullName?.message}</FieldError>
                </Field>

                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">Email Node</FieldLabel>
                  <Input {...form.register("email")} placeholder="email@domain.com" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                  <FieldError>{form.formState.errors.email?.message}</FieldError>
                </Field>

                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">Contact Line</FieldLabel>
                  <Input {...form.register("phone")} placeholder="9876543210" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                  <FieldError>{form.formState.errors.phone?.message}</FieldError>
                </Field>

                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">Security Key</FieldLabel>
                  <Input type="password" {...form.register("password")} placeholder="••••••" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                  <FieldError>{form.formState.errors.password?.message}</FieldError>
                </Field>
              </div>

              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">Entity Type</FieldLabel>
                <Select onValueChange={(v) => form.setValue("type", v as any)} defaultValue="DIRECT_SELLER">
                  <SelectTrigger className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="DIRECT_SELLER" className="rounded-lg">Direct Seller</SelectItem>
                    <SelectItem value="DISTRIBUTOR" className="rounded-lg">Distributor</SelectItem>
                    <SelectItem value="PARTNER" className="rounded-lg">Logistics Partner</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError>{form.formState.errors.type?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">Physical Address</FieldLabel>
                <Input {...form.register("address")} placeholder="Suite, Building, Street" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                <FieldError>{form.formState.errors.address?.message}</FieldError>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">Zip</FieldLabel>
                  <Input {...form.register("pincode")} placeholder="000000" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                  <FieldError>{form.formState.errors.pincode?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">City</FieldLabel>
                  <Input {...form.register("city")} placeholder="Metropolis" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                  <FieldError>{form.formState.errors.city?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel className="text-xs font-semibold text-muted-foreground opacity-70">State</FieldLabel>
                  <Input {...form.register("state")} placeholder="Region" className="h-10 rounded-xl bg-background/50 border-none ring-1 ring-border" />
                  <FieldError>{form.formState.errors.state?.message}</FieldError>
                </Field>
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]">
                DEPLOY FRANCHAISE NODE
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List Section - Dashboard Style */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <HugeiconsIcon icon={Store01Icon} size={18} className="text-primary" />
              Active Network
            </h2>
            <Badge variant="secondary" className="rounded-lg font-bold text-[10px] px-2 py-0.5">
              {franchises.length} NODES
            </Badge>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {franchises.map((f, index) => (
              <Card key={f.id} className="rounded-2xl border-none ring-1 ring-foreground/10 bg-card/50 shadow-lg shadow-foreground/5 hover:bg-card/80 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/10">
                        {index + 1}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-base tracking-tight">{f.fullName}</p>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 px-1.5 rounded-md border-primary/20 bg-primary/5 text-primary">
                            {f.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono opacity-60">REF: {f.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-foreground/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HugeiconsIcon icon={SmartPhone01Icon} size={14} className="opacity-40" />
                      <span className="text-xs font-semibold">{f.phone}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold px-3 rounded-lg text-primary hover:bg-primary/5">
                      VIEW PROFILE
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}