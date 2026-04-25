import { GradientBg } from "@/components/bg/bg-gradient";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* <img className="fixed bottom-0 -z-10 right-0" src="/assets/svg/Delivery.svg" alt="Delivery" /> */}
      <div className="w-full px-5 flex items-center justify-center flex-col">
        <div className="flex gap-3 justify-center items-center mb-3">
          <img src="/logo.jpg" className="h-10 w-10 float-end rounded-xl inline-block" alt="Delivery" />
          <h1 className="text-2xl font-bold text-center inline-block  my-4">Cashback wallah</h1>
        </div>
        {children}
      </div>
      {/* <GradientBg /> */}
    </div>
  );
}