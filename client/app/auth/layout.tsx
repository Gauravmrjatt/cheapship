export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* <img className="fixed bottom-0 -z-10 right-0" src="/assets/svg/Delivery.svg" alt="Delivery" /> */}
      <img className="fixed bottom-0 w-50  -z-10 right-50" src="/assets/svg/delivery2.svg" alt="Delivery" />
      {children}
    </div>
  );
}