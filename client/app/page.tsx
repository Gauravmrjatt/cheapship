import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <Card className="relative w-full max-w-lg overflow-hidden pt-0">
        <div className="bg-primary absolute inset-0 z-30 aspect-video opacity-50 mix-blend-color" />
        <img
          src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Photo by mymind on Unsplash"
          title="Photo by mymind on Unsplash"
          className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale"
        />
        <CardHeader>
          <CardTitle>Welcome to CheapShip</CardTitle>
          <CardDescription>
            The easiest way to ship your packages at the best rates.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button>
            <Link href="/dashboard/orders/new">Get Started</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}