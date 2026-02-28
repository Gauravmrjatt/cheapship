type PageProps = {
  params: Promise<{
    pdf: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { pdf } = await params;

  return (
    <div>
      <iframe
        src={`${process.env.NEXT_PUBLIC_API_URL}/labels/${pdf}`}
        width="100%"
        height="600"
      />
      OR 
      <a href={`${process.env.NEXT_PUBLIC_API_URL}/labels/${pdf}`} download>
        Download PDF
      </a>
    </div>
  );
}