export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* <img className="fixed bottom-0 -z-10 right-0" src="/assets/svg/Delivery.svg" alt="Delivery" /> */}
      <div className="w-full px-5 flex items-center justify-center flex-col">
        <img src="/assets/svg/delivery2.svg" className="h-40 w-40 float-end" alt="Delivery" />
        {children}
      </div>
    </div>
  );
}